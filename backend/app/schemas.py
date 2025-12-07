from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CVEBase(BaseModel):
    cve_id: str
    severity: str
    asset: str
    description: Optional[str] = None
    status: str = "Active"

class CVECreate(CVEBase):
    pass

class CVE(CVEBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

# --- User Schemas ---
class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
