from contextlib import contextmanager

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings


sqlite_url = f"sqlite:///{settings.sqlite_path}"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=False, connect_args=connect_args)


def init_db() -> None:
    from app import models  # noqa: F401

    SQLModel.metadata.create_all(engine)


@contextmanager
def session_context():
    with Session(engine) as session:
        yield session


def get_session():
    with Session(engine) as session:
        yield session
