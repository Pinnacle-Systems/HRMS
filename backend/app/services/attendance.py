from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
from ..database import get_db
from ...services.attendance_service import AttendanceService
from ...services.device_service import DeviceService
from ...models import MachineInOutGrid, Employee
from ...schemas import (
    FetchLogsResponse,
    PunchDataResponse,
    PaginatedResponse
)
from ...config import settings

router = APIRouter()

@router.get("/fetch-logs", response_model=FetchLogsResponse)
async def fetch_and_sync_logs(
    from_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    device_ip: Optional[str] = Query(None, description="Specific device IP"),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Fetch logs from machine and sync to database.
    This endpoint:
    1. Connects to the device
    2. Fetches all attendance logs
    3. Filters by date range
    4. Saves new logs to database
    5. Returns all logs in the date range
    """
    try:
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
        
        # Get devices
        query = db.query(MachineInOutGrid).filter(MachineInOutGrid.is_active == 1)
        if device_ip:
            query = query.filter(MachineInOutGrid.machineIp == device_ip)
        devices = query.all()
        
        if not devices:
            raise HTTPException(status_code=404, detail="No active devices found")
        
        service = AttendanceService(db)
        total_new = 0
        
        # Sync logs from each device
        for device in devices:
            new_count, _ = service.sync_logs_from_device(from_dt, to_dt, device)
            total_new += new_count
        
        # Get synced logs
        logs, total_count = service.get_logs(from_dt, to_dt, page=1, page_size=10000)
        
        return {
            "success": True,
            "from_date": from_date,
            "to_date": to_date,
            "total_new": total_new,
            "count": total_count,
            "message": f"Synced {total_new} new records. Total {total_count} records in range.",
            "data": [PunchDataResponse.model_validate(log) for log in logs]
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs", response_model=PaginatedResponse)
async def get_logs(
    from_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    device_ip: Optional[str] = Query(None, description="Filter by device IP"),
    card_id: Optional[str] = Query(None, description="Filter by card ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=500, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Get logs from database without syncing.
    Supports pagination and filtering.
    """
    try:
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
        
        service = AttendanceService(db)
        logs, total = service.get_logs(
            from_dt, 
            to_dt, 
            employee_id, 
            device_ip, 
            card_id,
            page, 
            page_size
        )
        
        # Get employee names
        employee_ids = [log.employeeId for log in logs if log.employeeId]
        employees = {}
        if employee_ids:
            emp_list = db.query(Employee).filter(Employee.id.in_(employee_ids)).all()
            employees = {e.id: e.name for e in emp_list}
        
        return {
            "success": True,
            "data": [
                {
                    **PunchDataResponse.model_validate(log).model_dump(),
                    "employee_name": employees.get(log.employeeId) if log.employeeId else None
                }
                for log in logs
            ],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "pages": (total + page_size - 1) // page_size
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/devices")
async def get_devices(db: Session = Depends(get_db)):
    """Get list of configured devices with status"""
    devices = db.query(MachineInOutGrid).filter(MachineInOutGrid.is_active == 1).all()
    
    device_list = []
    for device in devices:
        status = "online" if DeviceService.check_ping(device.machineIp) else "offline"
        device_list.append({
            "id": device.id,
            "machineIp": device.machineIp,
            "machineName": device.machineName or device.machineIp,
            "machineType": device.machineTypeOne or "ZK-Device",
            "status": status,
            "port": device.machinePort or 4370
        })
    
    return {
        "success": True,
        "devices": device_list
    }

@router.get("/summary")
async def get_logs_summary(
    from_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    device_ip: Optional[str] = Query(None, description="Filter by device IP"),
    db: Session = Depends(get_db)
):
    """Get summary statistics for logs in date range"""
    try:
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
        
        service = AttendanceService(db)
        summary = service.get_logs_summary(from_dt, to_dt, device_ip)
        
        return {
            "success": True,
            "summary": summary
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recent")
async def get_recent_logs(
    limit: int = Query(100, ge=1, le=1000, description="Number of logs to return"),
    db: Session = Depends(get_db)
):
    """Get most recent logs"""
    try:
        service = AttendanceService(db)
        logs = service.get_recent_logs(limit)
        
        return {
            "success": True,
            "count": len(logs),
            "data": [PunchDataResponse.model_validate(log) for log in logs]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/employee/{employee_id}")
async def get_employee_logs(
    employee_id: int,
    from_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    to_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get logs for a specific employee"""
    try:
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
        
        service = AttendanceService(db)
        logs, total = service.get_logs_by_employee(employee_id, from_dt, to_dt, page, page_size)
        
        return {
            "success": True,
            "employee_id": employee_id,
            "data": [PunchDataResponse.model_validate(log) for log in logs],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "pages": (total + page_size - 1) // page_size
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync-all")
async def sync_all_devices(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Sync all devices in background"""
    try:
        devices = db.query(MachineInOutGrid).filter(MachineInOutGrid.is_active == 1).all()
        
        if not devices:
            return {"success": False, "message": "No active devices found"}
        
        # Add background task
        for device in devices:
            # Sync last 7 days
            from_date = datetime.now() - timedelta(days=7)
            to_date = datetime.now()
            
            background_tasks.add_task(
                sync_device_in_background,
                device.machineIp,
                from_date,
                to_date
            )
        
        return {
            "success": True,
            "message": f"Sync started for {len(devices)} devices",
            "devices": [d.machineIp for d in devices]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def sync_device_in_background(device_ip: str, from_date: datetime, to_date: datetime):
    """Background task to sync a device"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"🔄 Background sync started for {device_ip}")
    
    try:
        # Implementation would go here
        pass
    except Exception as e:
        logger.error(f"❌ Background sync failed for {device_ip}: {e}")