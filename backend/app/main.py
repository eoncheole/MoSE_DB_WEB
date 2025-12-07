from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
from jose import JWTError, jwt

from . import models, schemas, crud, database
from .auth_utils import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM

# DB 테이블 생성 (개발용 자동 생성)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="MoSE DB API",
    description="Mobility Cybersecurity Lab Vulnerability Database API",
    version="1.0.0"
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Dependency: Current User ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: schemas.User = Depends(get_current_user)):
    return current_user

async def get_current_admin_user(current_user: schemas.User = Depends(get_current_user)):
    if current_user.email != "admin": # Simple admin check (In real app, use role field)
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return current_user

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
    try:
        db = database.SessionLocal()
        
        # 1. Mock CVEs
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
        
        # 2. Create Default Admin User
        admin_email = "admin"
        existing_admin = crud.get_user_by_email(db, admin_email)
        if not existing_admin:
            crud.create_user(db, schemas.UserCreate(
                email=admin_email, 
                password="admin", 
                full_name="MoSE Administrator"
            ))
            print(f"Created Admin User: {admin_email}")
                
        db.close()
    except Exception as e:
        print(f"Startup initialization failed: {e}")
        # 계속 실행되도록 예외를 잡음 (DB가 아직 준비 안 됐을 수도 있음)

# --- API Endpoints ---

@app.get("/", tags=["System"])
def read_root():
    return {"message": "MoSE DB Brain is Active", "status": "Online"}

# --- Auth Endpoints ---
@app.post("/users/", response_model=schemas.User, tags=["Auth"])
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/token", response_model=schemas.Token, tags=["Auth"])
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User, tags=["Auth"])
async def read_users_me(current_user: schemas.User = Depends(get_current_active_user)):
    return current_user

@app.get("/admin/users", response_model=List[schemas.User], tags=["Admin"])
def read_all_users(current_user: schemas.User = Depends(get_current_admin_user), db: Session = Depends(database.get_db)):
    return db.query(models.User).all()

@app.get("/cves/", response_model=List[schemas.CVE], tags=["Vulnerabilities"])
def read_cves(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    cves = crud.get_cves(db, skip=skip, limit=limit)
    return cves

@app.post("/cves/", response_model=schemas.CVE, tags=["Vulnerabilities"])
def create_cve(cve: schemas.CVECreate, db: Session = Depends(database.get_db), current_user: schemas.User = Depends(get_current_active_user)):
    return crud.create_cve(db, cve)