from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from ...database import get_db
from ...services.attendance_service import AttendanceService
from ...services.device_service import DeviceService
from ...models import MachineInOutGrid
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
    db: Session = Depends(get_db)
):
    """Fetch logs from machine and sync to database"""
    try:
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
        
        # Get devices
        query = db.query(MachineInOutGrid).filter(MachineInOutGrid.is_active == 1)
        if device_ip:
            query = query.filter(MachineInOutGrid.machineIp == device_ip)
        devices = query.all()
        
        if not devices:
            raise HTTPException(status_code=404, detail="No devices found")
        
        service = AttendanceService(db)
        total_new = 0
        
        for device in devices:
            new_count, _ = service.sync_logs_from_device(from_dt, to_dt, device)
            total_new += new_count
        
        # Get synced logs
        logs, _ = service.get_logs(from_dt, to_dt, page=1, page_size=10000)
        
        return {
            "success": True,
            "from_date": from_date,
            "to_date": to_date,
            "total_new": total_new,
            "count": len(logs),
            "message": f"Synced {total_new} new records. Total {len(logs)} records in range.",
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
    employee_id: Optional[int] = Query(None),
    device_ip: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get logs from database without syncing"""
    try:
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
        
        service = AttendanceService(db)
        logs, total = service.get_logs(from_dt, to_dt, employee_id, device_ip, page, page_size)
        
        return {
            "success": True,
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

@router.get("/devices")
async def get_devices(db: Session = Depends(get_db)):
    """Get list of configured devices with status"""
    devices = db.query(MachineInOutGrid).filter(MachineInOutGrid.is_active == 1).all()
    
    return {
        "success": True,
        "devices": [
            {
                "id": device.id,
                "machineIp": device.machineIp,
                "machineName": device.machineName or device.machineIp,
                "machineType": device.machineTypeOne,
                "status": "online" if DeviceService.check_ping(device.machineIp) else "offline"
            }
            for device in devices
        ]
    }