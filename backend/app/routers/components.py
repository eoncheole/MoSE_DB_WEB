from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, database, schemas
from ..deps import get_current_admin_user


router = APIRouter(prefix="/components", tags=["Components"])


@router.get("/", response_model=List[schemas.Component])
def list_components(
    skip: int = 0,
    limit: int = 200,
    type: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    return crud.get_components(db, skip=skip, limit=limit, type=type)


@router.get("/{component_id}", response_model=schemas.Component)
def get_component(component_id: int, db: Session = Depends(database.get_db)):
    comp = crud.get_component(db, component_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Component not found")
    return comp


@router.post("/", response_model=schemas.Component, status_code=201)
def create_component(
    component: schemas.ComponentCreate,
    db: Session = Depends(database.get_db),
    _: schemas.User = Depends(get_current_admin_user),
):
    return crud.create_component(db, component)
