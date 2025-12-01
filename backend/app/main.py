from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas, crud, database

# DB 테이블 생성 (개발용 자동 생성)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="MoSE DB API",
    description="Mobility Cybersecurity Lab Vulnerability Database API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 초기 데이터 주입 (개발 편의용) ---
@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    # Check specific CVEs to avoid duplicates
    mock_data = [
        schemas.CVECreate(cve_id="TEST-001", severity="Critical", asset="Test-Server-Alpha", description="Test vulnerability description for demo purposes."),
        schemas.CVECreate(cve_id="TEST-002", severity="High", asset="Test-Database-Beta", description="Another test vulnerability sample."),
        schemas.CVECreate(cve_id="TEST-003", severity="Medium", asset="Test-Gateway-01", description="Minor security misconfiguration example."),
        schemas.CVECreate(cve_id="TEST-004", severity="Low", asset="Test-Workstation-X", description="Low impact informational alert.")
    ]
    
    print("Initializing DB Check...")
    for cve in mock_data:
        exists = db.query(models.CVE).filter(models.CVE.cve_id == cve.cve_id).first()
        if not exists:
            crud.create_cve(db, cve)
            print(f"Inserted {cve.cve_id}")
        else:
            print(f"Skipped {cve.cve_id} (Already Exists)")
            
    db.close()

# --- API Endpoints ---

@app.get("/", tags=["System"])
def read_root():
    return {"message": "MoSE DB Brain is Active", "status": "Online"}

@app.get("/cves/", response_model=List[schemas.CVE], tags=["Vulnerabilities"])
def read_cves(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    cves = crud.get_cves(db, skip=skip, limit=limit)
    return cves

@app.post("/cves/", response_model=schemas.CVE, tags=["Vulnerabilities"])
def create_cve(cve: schemas.CVECreate, db: Session = Depends(database.get_db)):
    return crud.create_cve(db, cve)