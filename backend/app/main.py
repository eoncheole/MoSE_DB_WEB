"""FastAPI entry point.

Routes are split into routers under `app/routers/`. This module wires them up,
configures CORS + auth, and seeds demo data on startup.
"""

from datetime import timedelta
from typing import List

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import crud, database, models, schemas
from .auth_utils import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    verify_password,
)
from .deps import get_current_active_user, get_current_admin_user
from .routers import attacks, components, cves, graph, imports, labs


# Schema is owned by Alembic — run `alembic upgrade head` from `backend/`
# before starting the app. We still call create_all() defensively so a fresh
# SQLite dev DB without Alembic doesn't 500 on first request; in production
# (Postgres) you should drop this line and rely on migrations exclusively.
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="MoSE DB API",
    description="Mobility Cybersecurity Lab — hardware vulnerability graph DB.",
    version="2.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(labs.router)
app.include_router(components.router)
app.include_router(attacks.router)
app.include_router(cves.router)
app.include_router(graph.router)
app.include_router(imports.router)


# ---------------------------------------------------------------------------
# Startup seed — small connected demo so the dashboard isn't empty on first run
# ---------------------------------------------------------------------------

@app.on_event("startup")
def startup_event():
    try:
        db = database.SessionLocal()
        print("Initializing DB Check...")

        # 1. Default lab (idempotent)
        default_lab_name = "Mobility Cybersecurity Lab"
        lab = db.query(models.Lab).filter(models.Lab.name == default_lab_name).first()
        if not lab:
            lab = models.Lab(
                name=default_lab_name,
                affiliation="Kookmin University",
                contact="https://mose.kookmin.ac.kr/mose/index.do",
                description="Primary owner of this MoSE DB instance.",
            )
            db.add(lab)
            db.flush()
            print(f"Inserted lab: {lab.name}")

        # 2. Hardware components
        seed_components = [
            {"name": "STM32F407 SoC",  "vendor": "STMicroelectronics", "model": "STM32F407VG",   "type": "MCU"},
            {"name": "ESP32-WROOM-32", "vendor": "Espressif",          "model": "ESP32-WROOM-32", "type": "SoC"},
            {"name": "CAN Bus Stack",  "vendor": "Bosch",              "model": "CAN 2.0B",      "type": "Bus"},
            {"name": "Boot ROM v1.2",  "vendor": "Internal",           "model": "boot-1.2",      "type": "Firmware"},
        ]
        component_by_name = {}
        for spec in seed_components:
            existing = db.query(models.Component).filter(models.Component.name == spec["name"]).first()
            if not existing:
                comp = models.Component(lab_id=lab.id, **spec)
                db.add(comp)
                db.flush()
                component_by_name[spec["name"]] = comp
                print(f"Inserted component: {comp.name}")
            else:
                component_by_name[spec["name"]] = existing

        # 3. Attack techniques
        seed_attacks = [
            {"name": "Voltage Glitch",       "category": "Fault Injection", "mitre_id": None,    "description": "Disturb supply voltage to skip instructions."},
            {"name": "Side-Channel Power",   "category": "Side-channel",    "mitre_id": None,    "description": "Recover keys from power consumption traces."},
            {"name": "Supply-Chain Implant", "category": "Supply Chain",    "mitre_id": "T1195", "description": "Malicious code introduced upstream of the build."},
        ]
        attack_by_name = {}
        for spec in seed_attacks:
            existing = db.query(models.AttackTechnique).filter(models.AttackTechnique.name == spec["name"]).first()
            if not existing:
                atk = models.AttackTechnique(**spec)
                db.add(atk)
                db.flush()
                attack_by_name[spec["name"]] = atk
                print(f"Inserted attack: {atk.name}")
            else:
                attack_by_name[spec["name"]] = existing

        # 4. CVEs + edges
        seed_cves = [
            {
                "cve_id": "DEMO-CVE-001",
                "severity": "Critical",
                "cvss": 9.8,
                "description": "Glitch-induced bypass of secure boot signature check on STM32F407.",
                "remediation_script": "# Apply firmware patch v1.3\nsudo flash boot-1.3.bin",
                "affects": ["STM32F407 SoC", "Boot ROM v1.2"],
                "attacks": ["Voltage Glitch"],
            },
            {
                "cve_id": "DEMO-CVE-002",
                "severity": "High",
                "cvss": 7.4,
                "description": "Side-channel leakage allows AES key recovery on ESP32 secure element.",
                "remediation_script": "# Enable hardware DPA mitigations\nesptool.py --dpa-protect",
                "affects": ["ESP32-WROOM-32"],
                "attacks": ["Side-Channel Power"],
            },
            {
                "cve_id": "DEMO-CVE-003",
                "severity": "Medium",
                "cvss": 5.5,
                "description": "Compromised tooling injected payload into shipped firmware artifact.",
                "remediation_script": "# Rebuild from clean toolchain\nmake clean && make release",
                "affects": ["Boot ROM v1.2"],
                "attacks": ["Supply-Chain Implant"],
            },
        ]
        for spec in seed_cves:
            cve = db.query(models.CVE).filter(models.CVE.cve_id == spec["cve_id"]).first()
            if not cve:
                cve = models.CVE(
                    cve_id=spec["cve_id"],
                    severity=spec["severity"],
                    cvss=spec["cvss"],
                    description=spec["description"],
                    remediation_script=spec["remediation_script"],
                )
                db.add(cve)
                db.flush()
                print(f"Inserted CVE: {cve.cve_id}")

            for comp_name in spec["affects"]:
                comp = component_by_name.get(comp_name)
                if comp and not db.query(models.CVEAffectsComponent).filter_by(
                    cve_id=cve.id, component_id=comp.id
                ).first():
                    db.add(models.CVEAffectsComponent(
                        cve_id=cve.id, component_id=comp.id, contributed_by_lab_id=lab.id,
                    ))

            for atk_name in spec["attacks"]:
                atk = attack_by_name.get(atk_name)
                if atk and not db.query(models.CVEUsesAttack).filter_by(
                    cve_id=cve.id, attack_id=atk.id
                ).first():
                    db.add(models.CVEUsesAttack(
                        cve_id=cve.id, attack_id=atk.id, contributed_by_lab_id=lab.id,
                    ))

        # 5. Component-to-component relation: Boot ROM lives inside the SoC
        soc = component_by_name.get("STM32F407 SoC")
        rom = component_by_name.get("Boot ROM v1.2")
        if soc and rom and not db.query(models.ComponentRelation).filter_by(
            a_id=soc.id, b_id=rom.id, relation_type="contains"
        ).first():
            db.add(models.ComponentRelation(a_id=soc.id, b_id=rom.id, relation_type="contains"))

        # Persist the graph seed first — admin creation hashes a password and
        # has its own failure modes (bcrypt versions, etc.); we don't want it
        # rolling back the demo data.
        db.commit()

        # 6. Default admin user — isolated try so a hashing/IO error here
        #    leaves the seeded graph intact.
        try:
            if not crud.get_user_by_email(db, "admin"):
                crud.create_user(db, schemas.UserCreate(
                    email="admin", password="admin", full_name="MoSE Administrator",
                ))
                print("Created Admin User: admin")
        except Exception as e:
            print(f"Admin user seeding failed (graph data is fine): {e}")

        db.close()
    except Exception as e:
        print(f"Startup initialization failed: {e}")


# ---------------------------------------------------------------------------
# System + auth endpoints (lightweight, kept here)
# ---------------------------------------------------------------------------

@app.get("/", tags=["System"])
def read_root():
    return {"message": "MoSE DB Brain is Active", "status": "Online"}


@app.post("/users/", response_model=schemas.User, tags=["Auth"])
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    if crud.get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)


@app.post("/token", response_model=schemas.Token, tags=["Auth"])
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db),
):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(data={"sub": user.email}, expires_delta=expires)
    return {"access_token": token, "token_type": "bearer"}


@app.get("/users/me", response_model=schemas.User, tags=["Auth"])
async def read_users_me(current_user: schemas.User = Depends(get_current_active_user)):
    return current_user


@app.get("/admin/users", response_model=List[schemas.User], tags=["Admin"])
def read_all_users(
    db: Session = Depends(database.get_db),
    _: schemas.User = Depends(get_current_admin_user),
):
    return db.query(models.User).all()
