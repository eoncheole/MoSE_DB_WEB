from sqlalchemy.orm import Session
from . import models, schemas

def get_cves(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.CVE).offset(skip).limit(limit).all()

def create_cve(db: Session, cve: schemas.CVECreate):
    db_cve = models.CVE(**cve.dict())
    db.add(db_cve)
    db.commit()
    db.refresh(db_cve)
    return db_cve
