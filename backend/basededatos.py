# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "mysql+pymysql://root:@localhost:3306/tiendadepartamental"

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Función para obtener la sesión de la BD (muy útil para tus rutas después)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()