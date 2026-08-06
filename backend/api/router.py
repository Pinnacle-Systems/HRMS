from fastapi import APIRouter
from . import attendance, devices, employees

router = APIRouter()

router.include_router(
    attendance.router,
    prefix="/attendance",
    tags=["Attendance"]
)

router.include_router(
    devices.router,
    prefix="/devices",
    tags=["Devices"]
)

router.include_router(
    employees.router,
    prefix="/employees",
    tags=["Employees"]
)