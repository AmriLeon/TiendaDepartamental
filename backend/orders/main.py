import os
import httpx
import time
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, engine, Base
import models
from pydantic import BaseModel
from typing import List

# Retry connecting to DB
for _ in range(10):
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("✅ Base de datos de Órdenes conectada y tablas creadas.")
        break
    except Exception as e:
        print(f"⏳ Esperando a la base de datos de Órdenes... {e}")
        time.sleep(5)

app = FastAPI(title="Orders Service")

INVENTORY_SERVICE_URL = os.getenv("INVENTORY_SERVICE_URL", "http://inventory-service:8001")

class OrderItem(BaseModel):
    id_variante: int
    id_sucursal: int
    cantidad: int
    precio_unitario: float

class OrderCreate(BaseModel):
    items: List[OrderItem]

@app.post("/orders")
async def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # 1. Start a local transaction
    total = sum(item.cantidad * item.precio_unitario for item in order.items)
    db_order = models.Orden(total=total, estado="Completada")
    db.add(db_order)
    db.flush() # Get order ID
    
    # 2. Update stock in Inventory Service (Sync call for immediate feedback)
    async with httpx.AsyncClient() as client:
        for item in order.items:
            try:
                resp = await client.post(
                    f"{INVENTORY_SERVICE_URL}/inventory/update",
                    json={
                        "id_variante": item.id_variante,
                        "id_sucursal": item.id_sucursal,
                        "cantidad": -item.cantidad # Subtract stock
                    }
                )
                if resp.status_code != 200:
                    db.rollback()
                    raise HTTPException(status_code=resp.status_code, detail=resp.json())
                
                db_detail = models.DetalleOrden(
                    id_orden=db_order.id_orden,
                    id_variante=item.id_variante,
                    id_sucursal=item.id_sucursal,
                    cantidad=item.cantidad,
                    precio_unitario=item.precio_unitario
                )
                db.add(db_detail)
            except httpx.RequestError:
                db.rollback()
                raise HTTPException(status_code=503, detail="Inventory service unavailable")
    
    db.commit()
    return {"status": "success", "order_id": db_order.id_orden}

@app.get("/orders/{id_orden}")
def get_order(id_orden: int, db: Session = Depends(get_db)):
    order = db.query(models.Orden).filter(models.Orden.id_orden == id_orden).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
