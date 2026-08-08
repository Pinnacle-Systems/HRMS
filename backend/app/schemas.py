# from pydantic import BaseModel, Field
# from datetime import datetime
# from typing import Optional, List

# # Employee Schemas
# class EmployeeBase(BaseModel):
#     mIdCard: str
#     name: str
#     email: Optional[str] = None
#     department: Optional[str] = None

# class EmployeeCreate(EmployeeBase):
#     pass

# class EmployeeResponse(EmployeeBase):
#     id: int
#     created_at: datetime
    
#     class Config:
#         from_attributes = True

# # Machine Schemas
# class MachineBase(BaseModel):
#     machineIp: str
#     machineName: Optional[str] = None
#     machineTypeOne: Optional[str] = None
#     machinePort: Optional[int] = 4370
#     is_active: Optional[int] = 1

# class MachineCreate(MachineBase):
#     pass

# class MachineResponse(MachineBase):
#     id: int
#     created_at: datetime
    
#     class Config:
#         from_attributes = True

# # Punch Data Schemas
# class PunchDataBase(BaseModel):
#     mIdCard: str
#     timestamp: datetime
#     machineIP: str
#     machineType: Optional[str] = None
#     machineInOutGridId: int
#     employeeId: Optional[int] = None

# class PunchDataCreate(PunchDataBase):
#     pass

# class PunchDataResponse(PunchDataBase):
#     id: int
#     created_at: datetime
#     employee_name: Optional[str] = None
    
#     class Config:
#         from_attributes = True

# # Request/Response Schemas
# class FetchLogsRequest(BaseModel):
#     from_date: str = Field(..., description="Start date (YYYY-MM-DD)")
#     to_date: str = Field(..., description="End date (YYYY-MM-DD)")
#     device_ip: Optional[str] = Field(None, description="Specific device IP")

# class FetchLogsResponse(BaseModel):
#     success: bool
#     from_date: str
#     to_date: str
#     total_new: int
#     count: int
#     message: str
#     data: List[PunchDataResponse]

# class PaginationParams(BaseModel):
#     page: int = Field(1, ge=1)
#     page_size: int = Field(100, ge=1, le=500)
#     from_date: str
#     to_date: str
#     employee_id: Optional[int] = None
#     device_ip: Optional[str] = None

# class PaginatedResponse(BaseModel):
#     success: bool
#     data: List[PunchDataResponse]
#     pagination: dict