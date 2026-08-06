# import os
# from typing import List, Optional
# from pydantic_settings import BaseSettings
# from dotenv import load_dotenv

# load_dotenv()

# class Settings(BaseSettings):
#     # Database - Updated with your credentials
#     DATABASE_URL: str = os.getenv(
#         "DATABASE_URL", 
#     )
#     DATABASE_POOL_SIZE: int = int(os.getenv("DATABASE_POOL_SIZE", "10"))
#     DATABASE_MAX_OVERFLOW: int = int(os.getenv("DATABASE_MAX_OVERFLOW", "20"))
    
#     # API
#     API_V1_PREFIX: str = "/api/v1"
#     API_TITLE: str = "HRMS Attendance API"
#     API_VERSION: str = "1.0.0"
#     API_DESCRIPTION: str = "HRMS Attendance Management System API"
    
#     # CORS
#     CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:8080").split(",")
#     CORS_ALLOW_CREDENTIALS: bool = True
#     CORS_ALLOW_METHODS: List[str] = ["*"]
#     CORS_ALLOW_HEADERS: List[str] = ["*"]
    
#     # Device Settings
#     DEVICE_PORT: int = int(os.getenv("DEVICE_PORT", "4370"))
#     DEVICE_TIMEOUT: int = int(os.getenv("DEVICE_TIMEOUT", "10"))
#     DEVICE_RETRIES: int = int(os.getenv("DEVICE_RETRIES", "3"))
#     DEVICE_RETRY_DELAY: int = int(os.getenv("DEVICE_RETRY_DELAY", "5"))
#     DEVICE_IP: str = os.getenv("DEVICE_IP", "192.168.1.50")
    
#     # Logging
#     LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
#     LOG_FILE: str = os.getenv("LOG_FILE", "logs/app.log")
    
#     class Config:
#         env_file = ".env"
#         case_sensitive = True

# settings = Settings()

# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+psycopg2://avfaapp:avfaapp%24123@122.166.169.82:4555/payroll_app_pinnaclesystems"
    )
    
    # ... other settings
    
settings = Settings()