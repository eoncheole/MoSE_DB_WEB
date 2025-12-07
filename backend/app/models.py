from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from .database import Base

class CVE(Base):
    __tablename__ = "cves"

    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(String, unique=True, index=True)  # 예: CVE-2024-3094
    severity = Column(String)                         # 예: Critical, High
    asset = Column(String)                            # 예: Linux-Prod-01
    description = Column(String)                      # 상세 설명
    status = Column(String, default="Active")         # Active, Resolved
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    role = Column(String, default="user") # user, admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())
