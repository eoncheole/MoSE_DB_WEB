from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 환경 변수에서 DATABASE_URL 가져오기 (Docker 환경 등)
# 없으면 기본값으로 로컬 SQLite 사용
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mose.db")

# PostgreSQL인 경우와 SQLite인 경우의 connect_args 처리
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()