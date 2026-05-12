from fastapi import FastAPI, Depends, HTTPException
import time
from sqlalchemy.orm import Session
from database import get_db, engine, Base
import models
from pydantic import BaseModel

# Retry connecting to DB
for _ in range(10):
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("✅ Base de datos de Logística conectada y tablas creadas.")
        break
    except Exception as e:
        print(f"⏳ Esperando a la base de datos de Logística... {e}")
        time.sleep(5)

app = FastAPI(title="Logistics Service")

@app.get("/track/{id_orden}")
def track_order(id_orden: int, db: Session = Depends(get_db)):
    seguimiento = db.query(models.Seguimiento).filter(models.Seguimiento.id_orden == id_orden).first()
    if not seguimiento:
        # Mocking external API call if not found in local DB
        return {
            "id_orden": id_orden,
            "estado": "Preparación",
            "historial": [
                {"estado": "Pedido Recibido", "fecha": "2026-04-30 08:00"},
                {"estado": "Preparación", "fecha": "2026-04-30 10:00"}
            ]
        }
    return seguimiento
