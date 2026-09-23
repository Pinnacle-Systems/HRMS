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

# ✅ Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def check_ping(host, timeout=2000):
    """
    ✅ Check ping latency (ms). Returns True if reachable.
    Works on both Windows and Linux.
    """
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
    """
    ✅ Try connecting to the device up to 3 times with delay.
    Returns (zk, conn) or (None, None) if failed.
    """
    for attempt in range(1, retries + 1):
        try:
            print(f"🔁 Attempt {attempt}/{retries} connecting to {MACHINE_IP}...")
            socket.setdefaulttimeout(10)
            zk = ZK(MACHINE_IP, port=4370, timeout=10)
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


@app.get("/fetch-logs")
async def fetch_logs(from_date: str = Query(...), to_date: str = Query(...),device_ips: str = Query(...)):
    """
    ✅ Multi-Device Smart Incremental Fetch
    - Checks ping first but never skips due to high ping
    - Retries 3 times if connection fails
    - Handles large date ranges safely
    """
    print("🚀 API called")
    db = SessionLocal()
    conn = None

    # DEVICES = [
    #     {"ip": "192.168.1.50"},
    # ]
    device_strings = [d.strip() for d in device_ips.split(',') if d.strip()]
    DEVICES = []
    for device_str in device_strings:
            if ':' in device_str:
                ip, port = device_str.rsplit(':', 1)
                DEVICES.append({"ip": ip.strip(), "port": int(port.strip())})
            else:
                # If no port specified, use default
                DEVICES.append({"ip": device_str.strip(), "port": 4370})

    try:
        from_dt = datetime.strptime(from_date, "%Y-%m-%d")
        to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)

        total_new = 0
        all_logs_db = []
        employees = {e.mid_no: e.id for e in db.query(Employee).all()}

        for device in DEVICES:
            MACHINE_IP = device["ip"]
            port = device["port"]
            print(f"\n🔹 Checking device {MACHINE_IP} connectivity...")

            # ✅ Step 1: Ping check (only for info — don’t skip)
            reachable = check_ping(MACHINE_IP)
            if not reachable:
                print(f"⚠️ Device {MACHINE_IP} ping failed — continuing with connection attempts anyway.")
            else:
                print(f"✅ Device {MACHINE_IP} reachable (ping OK).")

            # ✅ Step 2: Get machine details
            machine_info = (
                db.query(BiometricDevices)
                .filter(BiometricDevices.ip_address == MACHINE_IP)
                .first()
            )

            machineInOutGridId = machine_info.id if machine_info else None
            machineType = machine_info.machine_type if machine_info else None

            # ✅ Step 3: Try connecting (always attempt, even if ping fails)
            zk, conn = connect_with_retry(MACHINE_IP,port, retries=3, delay=5)
            if not conn:
                print(f"⚠️ Skipping device {MACHINE_IP} after 3 failed connection attempts.")
                continue

            # ✅ Step 4: Fetch logs
            try:
                all_logs = conn.get_attendance()
                print(f"✅ Retrieved {len(all_logs)} logs from {MACHINE_IP}")
            except Exception as e:
                print(f"⚠️ Failed to fetch logs from {MACHINE_IP}: {e}")
                all_logs = []

            # ✅ Step 5: Filter logs by date range
            filtered_logs = [log for log in all_logs if from_dt <= log.timestamp < to_dt]

            current = from_dt
            while current < to_dt:
                start_dt = current.replace(hour=0, minute=0, second=0, microsecond=0)
                end_dt = current.replace(hour=23, minute=59, second=59, microsecond=999999)
                logs_for_day = [log for log in filtered_logs if start_dt <= log.timestamp <= end_dt]
                if not logs_for_day:
                    current += timedelta(days=1)
                    continue

                existing_logs = (
                    db.query(PunchData)
                    .filter(PunchData.punch_timestamp.between(start_dt, end_dt))
                    .order_by(PunchData.punch_timestamp.asc())
                    .all()
                )

                log_objects = []
                if not existing_logs:
                    for log in logs_for_day:
                        employeeId =  employees.get(int(log.user_id))
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
                else:
                    last_saved_ts = (
                        db.query(func.max(PunchData.punch_timestamp))
                        .filter(PunchData.punch_timestamp.between(start_dt, end_dt))
                        .scalar()
                    )

                    new_logs = [log for log in logs_for_day if log.timestamp > last_saved_ts]
                    for log in new_logs:
                        exists = (
                            db.query(PunchData)
                            .filter_by(m_id_card=str(log.user_id), punch_timestamp=log.timestamp,machine_ip= MACHINE_IP)
                            .first()
                        )
                        if not exists:
                            employeeId =  employees.get(int(log.user_id))
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

                current += timedelta(days=1)

            # ✅ Step 6: Disconnect safely
            if conn:
                try:
                    conn.disconnect()
                    zk.disable_device()
                    print(f"🔌 Disconnected from {MACHINE_IP}")
                except Exception:
                    pass

        # ✅ Step 7: Fetch all logs from DB
        all_logs_db = (
            db.query(PunchData)
            .filter(PunchData.punch_timestamp.between(from_dt, to_dt))
            .order_by(PunchData.punch_timestamp.asc())
            .all()
        )
        print("")
        response = {
            "success": True,
            "from_date": from_date,
            "to_date": to_date,
            "total_new": total_new,
            "devices_processed": len(DEVICES),
            "count": len(all_logs_db),
            "message": f"Synced logs from {from_date} to {to_date}. Total {len(all_logs_db)} records.",
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
        print(f"📤 API response: {response}")
        return response

    except Exception as e:
        db.rollback()
        response = {"success": False, "error": str(e)}
        print(f"📤 API response: {response}")
        return response

    finally:
        db.close()