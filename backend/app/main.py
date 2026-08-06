from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from sqlalchemy import func
from database import SessionLocal
from models import BiometricDevices, PunchData, Employee
from zk import ZK
import socket
import platform
import subprocess
import time

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def check_ping(host, timeout=2000):
    param = "-n" if platform.system().lower() == "windows" else "-c"
    try:
        output = subprocess.run(
            ["ping", param, "1", "-w", str(timeout), host],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return output.returncode == 0
    except Exception:
        return False

def connect_with_retry(MACHINE_IP,port, retries=3, delay=5):
    for attempt in range(1, retries + 1):
        try:
            print(f"🔁 Attempt {attempt}/{retries} connecting to {MACHINE_IP}...")
            socket.setdefaulttimeout(10)
            zk = ZK(MACHINE_IP, port, timeout=10)
            conn = zk.connect()
            print(f"✅ Connection successful on attempt {attempt}")
            return zk, conn
        except Exception as e:
            print(f"⚠️ Attempt {attempt} failed for {MACHINE_IP}: {e}")
            if attempt < retries:
                print(f"⏳ Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                print(f"❌ All {retries} attempts failed for {MACHINE_IP}")
    return None, None

#added
def ensure_naive(dt):
    """Ensure datetime is timezone-naive"""
    if dt is None:
        return None
    if hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt

@app.get("/fetch-logs")
async def fetch_logs(
    from_date: str = Query(...), 
    to_date: str = Query(...), 
    device_ips: str = Query(...) #added
):
    print("🚀 API called with multiple devices")
    db = SessionLocal()
    
    device_strings = [d.strip() for d in device_ips.split(',') if d.strip()]
    
    # Create device configurations
    DEVICES = []
    for device_str in device_strings:
        if ':' in device_str:
            ip, port = device_str.rsplit(':', 1)
            DEVICES.append({"ip": ip.strip(), "port": int(port.strip())})
        else:
            # If no port specified, use default
            DEVICES.append({"ip": device_str.strip(), "port": 4370})
    
    print(f"📱 Processing {len(DEVICES)} devices: {DEVICES}")
    
    try:
        # Parse dates and ensure they're naive
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
        
        # Ensure they are naive
        from_dt = ensure_naive(from_dt)
        to_dt = ensure_naive(to_dt)

        total_new = 0
        all_logs_db = []
        employees = {e.mid_no: e.id for e in db.query(Employee).all()}

        # Process each device
        for device in DEVICES:
            MACHINE_IP = device["ip"]
            port = device["port"]
            print(f"\n🔹 Processing device {MACHINE_IP}:{port}")

            # Check if device exists in database
            machine_info = (
                db.query(BiometricDevices)
                .filter(BiometricDevices.ip_address == MACHINE_IP)
                .first()
            )

            machineInOutGridId = machine_info.id if machine_info else None
            machineType = machine_info.machine_type if machine_info else None

            # Try to connect to the device
            reachable = check_ping(MACHINE_IP)
            if not reachable:
                print(f"⚠️ Device {MACHINE_IP} ping failed — continuing with connection attempts anyway.")
            else:
                print(f"✅ Device {MACHINE_IP} reachable (ping OK).")

            zk, conn = connect_with_retry(MACHINE_IP, port, retries=3, delay=5)
            if not conn:
                print(f"⚠️ Skipping device {MACHINE_IP} after 3 failed connection attempts.")
                continue

            try:
                all_logs = conn.get_attendance()
                print(f"✅ Retrieved {len(all_logs)} logs from {MACHINE_IP}")
            except Exception as e:
                print(f"⚠️ Failed to fetch logs from {MACHINE_IP}: {e}")
                all_logs = []

            # Process logs and ensure all timestamps are naive
            filtered_logs = []
            for log in all_logs:
                # Ensure timestamp is naive
                log.timestamp = ensure_naive(log.timestamp)
                
                # Only include logs within date range
                if from_dt <= log.timestamp < to_dt:
                    filtered_logs.append(log)

            print(f"📊 Found {len(filtered_logs)} logs in date range for device {MACHINE_IP}")

            if filtered_logs:
                # Process logs by day
                current = from_dt
                while current < to_dt:
                    start_dt = current.replace(hour=0, minute=0, second=0, microsecond=0)
                    end_dt = current.replace(hour=23, minute=59, second=59, microsecond=999999)
                    
                    # Ensure start and end are naive
                    start_dt = ensure_naive(start_dt)
                    end_dt = ensure_naive(end_dt)
                    
                    logs_for_day = [
                        log for log in filtered_logs
                        if start_dt <= log.timestamp <= end_dt
                    ]
                    
                    if logs_for_day:
                        # Check existing logs in database for this specific device
                        existing_logs = (
                            db.query(PunchData)
                            .filter(
                                PunchData.punch_timestamp.between(start_dt, end_dt),
                                PunchData.machine_ip == MACHINE_IP
                            )
                            .order_by(PunchData.punch_timestamp.asc())
                            .all()
                        )

                        log_objects = []
                        if not existing_logs:
                            for log in logs_for_day:
                                employeeId = employees.get(str(log.user_id))
                                log_objects.append(
                                    PunchData(
                                        m_id_card=str(log.user_id),
                                        punch_timestamp=log.timestamp,
                                        machine_ip=MACHINE_IP,
                                        machine_in_out_grid_id=machineInOutGridId,
                                        machine_type=machineType,
                                        employee_id=employeeId,
                                    )
                                )
                            if log_objects:
                                db.bulk_save_objects(log_objects)
                                db.commit()
                                total_new += len(log_objects)
                                print(f"✅ Saved {len(log_objects)} new logs for {start_dt.date()} on device {MACHINE_IP}")
                        else:
                            # Get the latest timestamp from database for this device
                            last_saved_ts = (
                                db.query(func.max(PunchData.punch_timestamp))
                                .filter(
                                    PunchData.punch_timestamp.between(start_dt, end_dt),
                                    PunchData.machine_ip == MACHINE_IP
                                )
                                .scalar()
                            )
                            last_saved_ts = ensure_naive(last_saved_ts)
                            
                            # If no timestamp found, use start_dt
                            if last_saved_ts is None:
                                last_saved_ts = start_dt

                            # Find new logs after last saved timestamp
                            new_logs = [
                                log for log in logs_for_day
                                if log.timestamp > last_saved_ts
                            ]
                            
                            print(f"📝 Found {len(new_logs)} new logs after {last_saved_ts} on device {MACHINE_IP}")
                            
                            for log in new_logs:
                                # Check if log already exists (duplicate check)
                                exists = (
                                    db.query(PunchData)
                                    .filter(
                                        PunchData.m_id_card == str(log.user_id),
                                        PunchData.punch_timestamp == log.timestamp,
                                        PunchData.machine_ip == MACHINE_IP
                                    )
                                    .first()
                                )
                                if not exists:
                                    employeeId = employees.get(str(log.user_id))
                                    log_objects.append(
                                        PunchData(
                                            m_id_card=str(log.user_id),
                                            punch_timestamp=log.timestamp,
                                            machine_ip=MACHINE_IP,
                                            machine_in_out_grid_id=machineInOutGridId,
                                            machine_type=machineType,
                                            employee_id=employeeId,
                                        )
                                    )
                            
                            if log_objects:
                                db.bulk_save_objects(log_objects)
                                db.commit()
                                total_new += len(log_objects)
                                print(f"✅ Saved {len(log_objects)} new logs for {start_dt.date()} on device {MACHINE_IP}")

                    current += timedelta(days=1)

            if conn:
                try:
                    conn.disconnect()
                    zk.disable_device()
                    print(f"🔌 Disconnected from {MACHINE_IP}")
                except Exception as e:
                    print(f"⚠️ Error disconnecting: {e}")

        # Query all logs from database for the date range
        all_logs_db = (
            db.query(PunchData)
            .filter(PunchData.punch_timestamp.between(from_dt, to_dt))
            .order_by(PunchData.punch_timestamp.asc())
            .all()
        )

        return {
            "success": True,
            "from_date": from_date,
            "to_date": to_date,
            "total_new": total_new,
            "devices_processed": len(DEVICES),
            "count": len(all_logs_db),
            "message": f"Synced logs from {from_date} to {to_date} across {len(DEVICES)} device(s). Total {len(all_logs_db)} records.",
            "data": [
                {
                    "mid_no": log.m_id_card,
                    "timestamp": log.punch_timestamp.isoformat(),
                    "machineIP": log.machine_ip,
                    "machineType": log.machine_type,
                    "machineInOutGridId": log.machine_in_out_grid_id,
                    "employeeId": log.employee_id,
                }
                for log in all_logs_db
            ],
        }

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

    finally:
        db.close()

        
@app.get("/api/punches")
async def get_punches(from_date: str = Query(...), to_date: str = Query(...)):
    db = SessionLocal()
    try:
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)
        
        # Ensure dates are naive
        from_dt = ensure_naive(from_dt)
        to_dt = ensure_naive(to_dt)
        
        punches = (
            db.query(PunchData)
            .filter(PunchData.punch_timestamp.between(from_dt, to_dt))
            .order_by(PunchData.punch_timestamp.asc())
            .all()
        )
        
        return {
            "success": True,
            "from_date": from_date,
            "to_date": to_date,
            "count": len(punches),
            "data": [
                {
                    "mid_no": p.m_id_card,
                    "timestamp": p.punch_timestamp.isoformat(),
                    "machineIP": p.machine_ip,
                    "machineType": p.machine_type,
                    "machineInOutGridId": p.machine_in_out_grid_id,
                    "employeeId": p.employee_id,
                }
                for p in punches
            ],
        }
    except Exception as e:
        print(f"❌ Error in /api/punches: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
    finally:
        db.close()