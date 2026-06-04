from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, database, schemas
from ..deps import get_current_admin_user


router = APIRouter(prefix="/cves", tags=["Vulnerabilities"])


@router.get("/", response_model=List[schemas.CVE])
def list_cves(
    skip: int = 0,
    limit: int = 100,
    severity: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    return crud.get_cves(db, skip=skip, limit=limit, severity=severity)


@router.get("/{cve_id}", response_model=schemas.CVE)
def get_cve(cve_id: int, db: Session = Depends(database.get_db)):
    cve = crud.get_cve(db, cve_id)
    if not cve:
        raise HTTPException(status_code=404, detail="CVE not found")
    return cve


@router.get(
    "/{cve_id}/graph",
    response_model=schemas.CVEWithRelations,
    # alias is used to read from ORM (`component_links` → field `components`);
    # disable it on output so JSON keys are the friendly field names.
    response_model_by_alias=False,
)
def get_cve_graph(cve_id: int, db: Session = Depends(database.get_db)):
    """CVE plus its connected components, attack techniques, and contributing labs."""
    cve = crud.get_cve_with_relations(db, cve_id)
    if not cve:
        raise HTTPException(status_code=404, detail="CVE not found")
    return schemas.CVEWithRelations.from_orm(cve)


@router.post("/", response_model=schemas.CVE, status_code=201)
def create_cve(
    cve: schemas.CVECreate,
    db: Session = Depends(database.get_db),
    _: schemas.User = Depends(get_current_admin_user),
):
    if crud.get_cve_by_cve_id(db, cve.cve_id):
        raise HTTPException(status_code=409, detail="CVE id already exists")
    return crud.create_cve(db, cve)


# ---------------------------------------------------------------------------
# Edge endpoints — keep them under /cves since they're CVE-anchored.
# Component↔Component edges live in the graph router instead.
# ---------------------------------------------------------------------------

@router.post("/links/components", response_model=schemas.ComponentLink, status_code=201)
def link_cve_to_component(
    payload: schemas.CVEAffectsComponentCreate,
    db: Session = Depends(database.get_db),
    _: schemas.User = Depends(get_current_admin_user),
):
    if not crud.get_cve(db, payload.cve_id):
        raise HTTPException(status_code=404, detail="CVE not found")
    if not crud.get_component(db, payload.component_id):
        raise HTTPException(status_code=404, detail="Component not found")
    if payload.contributed_by_lab_id and not crud.get_lab(db, payload.contributed_by_lab_id):
        raise HTTPException(status_code=404, detail="Contributor lab not found")
    return crud.link_cve_to_component(db, payload)


@router.post("/links/attacks", response_model=schemas.AttackLink, status_code=201)
def link_cve_to_attack(
    payload: schemas.CVEUsesAttackCreate,
    db: Session = Depends(database.get_db),
    _: schemas.User = Depends(get_current_admin_user),
):
    if not crud.get_cve(db, payload.cve_id):
        raise HTTPException(status_code=404, detail="CVE not found")
    if not crud.get_attack(db, payload.attack_id):
        raise HTTPException(status_code=404, detail="Attack technique not found")
    if payload.contributed_by_lab_id and not crud.get_lab(db, payload.contributed_by_lab_id):
        raise HTTPException(status_code=404, detail="Contributor lab not found")
    return crud.link_cve_to_attack(db, payload)
