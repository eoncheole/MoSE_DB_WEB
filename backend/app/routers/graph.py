from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import crud, database, schemas
from ..deps import get_current_admin_user


router = APIRouter(prefix="/graph", tags=["Graph"])


@router.get("/overview", response_model=schemas.GraphOverview)
def graph_overview(cve_limit: int = Query(50, ge=1, le=200), db: Session = Depends(database.get_db)):
    """Flat node/edge payload for the visualization view.

    `cve_limit` caps the number of CVEs included (most recent first); every
    component/attack/lab they reach is pulled in along with them. Default 50
    keeps the graph dense but renderable.
    """
    return crud.get_graph_overview(db, cve_limit=cve_limit)


@router.post("/component-relations", response_model=schemas.ComponentRelationOut, status_code=201)
def link_components(
    payload: schemas.ComponentRelationCreate,
    db: Session = Depends(database.get_db),
    _: schemas.User = Depends(get_current_admin_user),
):
    if not crud.get_component(db, payload.a_id) or not crud.get_component(db, payload.b_id):
        raise HTTPException(status_code=404, detail="Component not found")
    if payload.a_id == payload.b_id:
        raise HTTPException(status_code=400, detail="Cannot relate a component to itself")
    return crud.link_components(db, payload)
