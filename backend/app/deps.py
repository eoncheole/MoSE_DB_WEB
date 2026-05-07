"""Shared FastAPI dependencies — auth + DB session.

Lives outside main.py so routers can import it without creating a cycle.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from . import crud, database, schemas
from .auth_utils import ALGORITHM, SECRET_KEY


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError as exc:
        raise credentials_exception from exc

    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: schemas.User = Depends(get_current_user)):
    return current_user


async def get_current_admin_user(current_user: schemas.User = Depends(get_current_user)):
    # TODO: switch to checking the `role` column once admin provisioning is in place.
    if current_user.email != "admin":
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return current_user
