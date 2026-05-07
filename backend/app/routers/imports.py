"""Bulk import endpoints — ingest data bundles from partner labs."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, database, schemas
from ..deps import get_current_active_user


router = APIRouter(prefix="/import", tags=["Import"])


@router.post("/bundle", response_model=schemas.ImportResult)
def import_bundle(
    bundle: schemas.BundleImport,
    db: Session = Depends(database.get_db),
    _: schemas.User = Depends(get_current_active_user),
):
    """Upsert a partner bundle (lab + components + attacks + CVEs + edges).

    Idempotent — replays of the same payload return zeroes in `created` and
    leave existing edges untouched. Unresolved component/attack names referenced
    by a CVE come back as `warnings`.
    """
    return crud.import_bundle(db, bundle)
