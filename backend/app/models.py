from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Index, BigInteger, Boolean
from database import Base

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(String, primary_key=True, index=True)
    mid_no = Column(String(50), unique=True, index=True)

class BiometricDevices(Base):
    __tablename__ = "biometric_devices"
    
    id = Column(String, primary_key=True, index=True)
    ip_address = Column(String(50), unique=True, index=True)
    machine_type = Column(String(50), nullable=True)

class PunchData(Base):
    __tablename__ = "punch_data"
    
    id = Column(String, primary_key=True, index=True)
    m_id_card = Column(String(50), index=True)
    punch_timestamp = Column(DateTime, index=True, nullable=False)
    machine_ip = Column(String(50), index=True)
    machine_type = Column(String(50), nullable=True)
    machine_in_out_grid_id = Column(String, ForeignKey("biometric_devices.id"), nullable=True)
    employee_id = Column(String, ForeignKey("employees.id"), nullable=True)