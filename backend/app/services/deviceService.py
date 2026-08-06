import socket
import platform
import subprocess
import time
import logging
from typing import Optional, Tuple, List, Dict, Any
from datetime import datetime
from zk import ZK
from ..config import settings

logger = logging.getLogger(__name__)

class DeviceService:
    @staticmethod
    def check_ping(host: str, timeout: int = 2000) -> bool:
        """Check if device is reachable via ping"""
        param = "-n" if platform.system().lower() == "windows" else "-c"
        try:
            output = subprocess.run(
                ["ping", param, "1", "-w", str(timeout), host],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=5
            )
            return output.returncode == 0
        except Exception as e:
            logger.error(f"Ping error for {host}: {e}")
            return False

    @staticmethod
    def connect_with_retry(
        machine_ip: str,
        port: int = None,
        retries: int = None,
        delay: int = None
    ) -> Tuple[Optional[ZK], Optional[object]]:
        """Connect to device with retry logic"""
        port = port or settings.DEVICE_PORT
        retries = retries or settings.DEVICE_RETRIES
        delay = delay or settings.DEVICE_RETRY_DELAY
        
        for attempt in range(1, retries + 1):
            try:
                logger.info(f"🔁 Attempt {attempt}/{retries} connecting to {machine_ip}...")
                socket.setdefaulttimeout(settings.DEVICE_TIMEOUT)
                zk = ZK(machine_ip, port=port, timeout=settings.DEVICE_TIMEOUT)
                conn = zk.connect()
                logger.info(f"✅ Connection successful to {machine_ip}")
                return zk, conn
            except Exception as e:
                logger.warning(f"⚠️ Attempt {attempt} failed for {machine_ip}: {e}")
                if attempt < retries:
                    logger.info(f"⏳ Retrying in {delay} seconds...")
                    time.sleep(delay)
                else:
                    logger.error(f"❌ All {retries} attempts failed for {machine_ip}")
        return None, None

    @staticmethod
    def disconnect(zk: Optional[ZK], conn: Optional[object]):
        """Safely disconnect from device"""
        if conn:
            try:
                conn.disconnect()
                if zk:
                    zk.disable_device()
                logger.info("🔌 Disconnected from device")
            except Exception as e:
                logger.warning(f"Error disconnecting: {e}")

    @staticmethod
    def get_device_info(conn: object) -> Dict[str, Any]:
        """Get device information"""
        try:
            info = {
                "serial_number": conn.get_serial_number(),
                "firmware_version": conn.get_firmware_version(),
                "device_name": conn.get_device_name(),
                "platform": conn.get_platform(),
            }
            return info
        except Exception as e:
            logger.warning(f"Could not get device info: {e}")
            return {}

    @staticmethod
    def get_attendance_logs(conn: object, from_date: datetime = None, to_date: datetime = None) -> List[Any]:
        """Get attendance logs from device"""
        try:
            all_logs = conn.get_attendance()
            logger.info(f"📊 Retrieved {len(all_logs)} logs from device")
            
            if from_date and to_date:
                filtered_logs = [
                    log for log in all_logs 
                    if from_date <= log.timestamp < to_date
                ]
                logger.info(f"📊 Filtered to {len(filtered_logs)} logs in date range")
                return filtered_logs
            
            return all_logs
        except Exception as e:
            logger.error(f"Failed to get attendance logs: {e}")
            return []

    @staticmethod
    def get_users(conn: object) -> List[Any]:
        """Get users from device"""
        try:
            users = conn.get_users()
            logger.info(f"👥 Retrieved {len(users)} users from device")
            return users
        except Exception as e:
            logger.error(f"Failed to get users: {e}")
            return []