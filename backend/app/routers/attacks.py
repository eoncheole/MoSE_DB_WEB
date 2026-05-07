from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, database, schemas
from ..deps import get_current_active_user


router = APIRouter(prefix="/attacks", tags=["Attacks"])


@router.get("/", response_model=List[schemas.AttackTechnique])
def list_attacks(skip: int = 0, limit: int = 200, db: Session = Depends(database.get_db)):
    return crud.get_attacks(db, skip=skip, limit=limit)


@router.get("/{attack_id}", response_model=schemas.AttackTechnique)
def get_attack(attack_id: int, db: Session = Depends(database.get_db)):
    atk = crud.get_attack(db, attack_id)
    if not atk:
        raise HTTPException(status_code=404, detail="Attack technique not found")
    return atk


@router.post("/", response_model=schemas.AttackTechnique, status_code=201)
def create_attack(
    attack: schemas.AttackTechniqueCreate,
    db: Session = Depends(database.get_db),
    _: schemas.User = Depends(get_current_active_user),
):
    if crud.get_attack_by_name(db, attack.name):
        raise HTTPException(status_code=409, detail="Attack technique name already exists")
    return crud.create_attack(db, attack)
