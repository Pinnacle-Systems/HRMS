# import logging
# from datetime import datetime, timedelta
# from typing import List, Dict, Set, Optional, Tuple, Any
# from sqlalchemy.orm import Session
# from sqlalchemy import func, and_, or_
# from ..models import PythonPunchData, Employee, MachineInOutGrid
# from ..schemas import PunchDataResponse
# from .device_service import DeviceService

# logger = logging.getLogger(__name__)

# class AttendanceService:
#     def __init__(self, db: Session):
#         self.db = db

#     def get_employees_map(self) -> Dict[str, int]:
#         """Get mapping of card IDs to employee IDs"""
#         employees = self.db.query(Employee).all()
#         return {str(e.mIdCard): e.id for e in employees}

#     def get_employees_by_card(self) -> Dict[str, Employee]:
#         """Get mapping of card IDs to employee objects"""
#         employees = self.db.query(Employee).all()
#         return {str(e.mIdCard): e for e in employees}

#     def sync_logs_from_device(
#         self,
#         from_date: datetime,
#         to_date: datetime,
#         device: MachineInOutGrid,
#         batch_size: int = 1000
#     ) -> Tuple[int, List[PythonPunchData]]:
#         """Sync logs from a single device with batch processing"""
#         logger.info(f"🔄 Syncing logs from device {device.machineIp}")
        
#         # Check ping
#         reachable = DeviceService.check_ping(device.machineIp)
#         if not reachable:
#             logger.warning(f"⚠️ Device {device.machineIp} ping failed, but attempting connection...")
        
#         # Connect to device
#         zk, conn = DeviceService.connect_with_retry(device.machineIp)
#         if not conn:
#             logger.error(f"❌ Failed to connect to device {device.machineIp}")
#             return 0, []
        
#         try:
#             # Fetch logs from device
#             all_logs = DeviceService.get_attendance_logs(conn, from_date, to_date)
            
#             if not all_logs:
#                 logger.info(f"ℹ️ No logs found for device {device.machineIp} in date range")
#                 return 0, []
            
#             # Get existing logs to avoid duplicates
#             existing_logs = self.db.query(PythonPunchData).filter(
#                 PythonPunchData.machineIP == device.machineIp,
#                 PythonPunchData.timestamp.between(from_date, to_date)
#             ).all()
            
#             existing_set = {(log.mIdCard, log.timestamp) for log in existing_logs}
#             employees_map = self.get_employees_map()
            
#             # Prepare new logs with batch processing
#             new_logs = []
#             total_new = 0
            
#             for log in all_logs:
#                 key = (str(log.user_id), log.timestamp)
#                 if key in existing_set:
#                     continue
                
#                 employee_id = employees_map.get(str(log.user_id))
                
#                 # Determine punch type (if available)
#                 punch_type = None
#                 if hasattr(log, 'punch_type'):
#                     punch_type = log.punch_type
                
#                 new_logs.append(
#                     PythonPunchData(
#                         mIdCard=str(log.user_id),
#                         timestamp=log.timestamp,
#                         machineIP=device.machineIp,
#                         machineInOutGridId=device.id,
#                         machineType=device.machineTypeOne or "ZK-Device",
#                         employeeId=employee_id,
#                         punch_type=punch_type
#                     )
#                 )
                
#                 # Bulk insert in batches
#                 if len(new_logs) >= batch_size:
#                     self.db.bulk_save_objects(new_logs)
#                     self.db.commit()
#                     total_new += len(new_logs)
#                     logger.info(f"✅ Inserted batch of {len(new_logs)} records")
#                     new_logs = []
            
#             # Insert remaining logs
#             if new_logs:
#                 self.db.bulk_save_objects(new_logs)
#                 self.db.commit()
#                 total_new += len(new_logs)
#                 logger.info(f"✅ Inserted final batch of {len(new_logs)} records")
            
#             logger.info(f"✅ Synced {total_new} new records from {device.machineIp}")
#             return total_new, new_logs
            
#         except Exception as e:
#             logger.error(f"Error syncing logs from {device.machineIp}: {e}")
#             self.db.rollback()
#             return 0, []
#         finally:
#             DeviceService.disconnect(zk, conn)

#     def get_logs(
#         self,
#         from_date: datetime,
#         to_date: datetime,
#         employee_id: Optional[int] = None,
#         device_ip: Optional[str] = None,
#         card_id: Optional[str] = None,
#         page: int = 1,
#         page_size: int = 100
#     ) -> Tuple[List[PythonPunchData], int]:
#         """Get logs from database with pagination and filters"""
#         query = self.db.query(PythonPunchData).filter(
#             PythonPunchData.timestamp.between(from_date, to_date)
#         )
        
#         if employee_id:
#             query = query.filter(PythonPunchData.employeeId == employee_id)
#         if device_ip:
#             query = query.filter(PythonPunchData.machineIP == device_ip)
#         if card_id:
#             query = query.filter(PythonPunchData.mIdCard == card_id)
        
#         total = query.count()
#         offset = (page - 1) * page_size
        
#         logs = query.order_by(PythonPunchData.timestamp.desc()).offset(offset).limit(page_size).all()
        
#         return logs, total

#     def get_logs_summary(
#         self,
#         from_date: datetime,
#         to_date: datetime,
#         device_ip: Optional[str] = None
#     ) -> Dict[str, Any]:
#         """Get summary statistics for logs"""
#         query = self.db.query(PythonPunchData).filter(
#             PythonPunchData.timestamp.between(from_date, to_date)
#         )
        
#         if device_ip:
#             query = query.filter(PythonPunchData.machineIP == device_ip)
        
#         total_logs = query.count()
        
#         # Get distinct employees
#         distinct_employees = query.distinct(PythonPunchData.employeeId).count()
        
#         # Get logs by machine
#         logs_by_machine = {}
#         machine_query = self.db.query(
#             PythonPunchData.machineIP, 
#             func.count(PythonPunchData.id).label('count')
#         ).filter(PythonPunchData.timestamp.between(from_date, to_date))
        
#         if device_ip:
#             machine_query = machine_query.filter(PythonPunchData.machineIP == device_ip)
        
#         machine_results = machine_query.group_by(PythonPunchData.machineIP).all()
#         for result in machine_results:
#             logs_by_machine[result.machineIP] = result.count
        
#         return {
#             "total_logs": total_logs,
#             "distinct_employees": distinct_employees,
#             "logs_by_machine": logs_by_machine,
#             "date_range": {
#                 "from": from_date.isoformat(),
#                 "to": to_date.isoformat()
#             }
#         }

#     def get_recent_logs(self, limit: int = 100) -> List[PythonPunchData]:
#         """Get most recent logs"""
#         logs = self.db.query(PythonPunchData).order_by(
#             PythonPunchData.timestamp.desc()
#         ).limit(limit).all()
#         return logs

#     def get_logs_by_employee(
#         self,
#         employee_id: int,
#         from_date: datetime,
#         to_date: datetime,
#         page: int = 1,
#         page_size: int = 100
#     ) -> Tuple[List[PythonPunchData], int]:
#         """Get logs for a specific employee"""
#         query = self.db.query(PythonPunchData).filter(
#             PythonPunchData.employeeId == employee_id,
#             PythonPunchData.timestamp.between(from_date, to_date)
#         )
        
#         total = query.count()
#         offset = (page - 1) * page_size
        
#         logs = query.order_by(PythonPunchData.timestamp.desc()).offset(offset).limit(page_size).all()
        
#         return logs, total