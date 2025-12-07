from sqlalchemy.orm import Session
from . import models, schemas
from .auth_utils import get_password_hash

def get_cves(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.CVE).offset(skip).limit(limit).all()

def create_cve(db: Session, cve: schemas.CVECreate):
    db_cve = models.CVE(**cve.dict())
    db.add(db_cve)
    db.commit()
    db.refresh(db_cve)
    return db_cve

# --- User CRUD ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
