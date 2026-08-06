# from sqlalchemy import create_engine
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker, Session
# from typing import Generator
# from config import settings

# # Create engine with connection pooling
# engine = create_engine(
#     settings.DATABASE_URL,
#     pool_size=settings.DATABASE_POOL_SIZE,
#     max_overflow=settings.DATABASE_MAX_OVERFLOW,
#     pool_pre_ping=True,
#     pool_recycle=3600,
#     echo=False
# )

# # Create session factory
# SessionLocal = sessionmaker(
#     autocommit=False,
#     autoflush=False,
#     bind=engine
# )

# # Base class for models
# Base = declarative_base()

# def get_db() -> Generator[Session, None, None]:
#     """Dependency for getting database session"""
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# from sqlalchemy import create_engine
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker

# # SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:Pinnacle@localhost:3306/payroll"
# SQLALCHEMY_DATABASE_URL = (
#     "postgresql+psycopg://avfaapp:avfaapp%24123@122.166.169.82:4555/payroll_app_pinnaclesystems"
# )

# engine = create_engine(SQLALCHEMY_DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()


from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "postgresql+psycopg2://avfaapp:avfaapp%24123@122.166.169.82:4555/payroll_app_pinnaclesystems"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def test_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")

            version = conn.execute(text("SELECT version()")).scalar()
            print("PostgreSQL Version:", version)

    except Exception as e:
        print("❌ Database connection failed!")
        print(e)


if __name__ == "__main__":
    test_connection()