from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, database, schemas
from ..deps import get_current_active_user


router = APIRouter(prefix="/labs", tags=["Labs"])


@router.get("/", response_model=List[schemas.Lab])
def list_labs(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return crud.get_labs(db, skip=skip, limit=limit)


@router.get("/{lab_id}", response_model=schemas.Lab)
def get_lab(lab_id: int, db: Session = Depends(database.get_db)):
    lab = crud.get_lab(db, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    return lab


@router.post("/", response_model=schemas.Lab, status_code=201)
def create_lab(
    lab: schemas.LabCreate,
    db: Session = Depends(database.get_db),
    _: schemas.User = Depends(get_current_active_user),
):
    if crud.get_lab_by_name(db, lab.name):
        raise HTTPException(status_code=409, detail="Lab name already exists")
    return crud.create_lab(db, lab)
