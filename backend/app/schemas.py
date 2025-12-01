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
