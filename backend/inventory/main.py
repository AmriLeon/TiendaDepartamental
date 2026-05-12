import os
import pika
import json
import time
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import get_db, engine, Base
import models
from pydantic import BaseModel

# Retry connecting to DB
for _ in range(10):
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("✅ Base de datos de Inventario conectada y tablas creadas.")
        break
    except Exception as e:
        print(f"⏳ Esperando a la base de datos de Inventario... {e}")
        time.sleep(5)

app = FastAPI(title="Inventory Service")

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost/")

def publish_stock_update(id_variante, stock_actual, id_sucursal):
    try:
        connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
        channel = connection.channel()
        channel.exchange_declare(exchange='inventory_events', exchange_type='topic')
        
        event = {
            "type": "STOCK_UPDATED",
            "id_variante": id_variante,
            "stock_actual": stock_actual,
            "id_sucursal": id_sucursal
        }
        
        channel.basic_publish(
            exchange='inventory_events',
            routing_key='stock.updated',
            body=json.dumps(event)
        )
        connection.close()
    except Exception as e:
        print(f"Error publishing to RabbitMQ: {e}")

class StockUpdate(BaseModel):
    id_variante: int
    id_sucursal: int
    cantidad: int # Positivo para suma, negativo para resta

@app.get("/inventory")
def get_inventory(db: Session = Depends(get_db)):
    return db.query(models.Inventario).all()

@app.get("/inventory/{id_variante}")
def get_stock_by_variante(id_variante: int, db: Session = Depends(get_db)):
    return db.query(models.Inventario).filter(models.Inventario.id_variante == id_variante).all()

@app.post("/inventory/update")
def update_stock(update: StockUpdate, db: Session = Depends(get_db)):
    # ATOMICITY: Use with_for_update() to lock the row for the transaction
    inv_item = db.query(models.Inventario).with_for_update().filter(
        models.Inventario.id_variante == update.id_variante,
        models.Inventario.id_sucursal == update.id_sucursal
    ).first()
    
    if not inv_item:
        raise HTTPException(status_code=404, detail="Item not found in inventory")
    
    nuevo_stock = inv_item.stock_actual + update.cantidad
    
    if nuevo_stock < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    inv_item.stock_actual = nuevo_stock
    db.commit()
    
    # Check for reorder point
    if nuevo_stock <= inv_item.punto_pedido:
        # Notify Alerts Service via RabbitMQ
        notify_reorder(inv_item, db)
    
    # Notify Dashboard via RabbitMQ
    publish_stock_update(inv_item.id_variante, inv_item.stock_actual, inv_item.id_sucursal)
    
    return {"status": "success", "new_stock": nuevo_stock}

def notify_reorder(inv_item, db):
    try:
        connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
        channel = connection.channel()
        channel.queue_declare(queue='reorder_alerts')
        
        alert = {
            "type": "REORDER_ALERT",
            "id_variante": inv_item.id_variante,
            "id_sucursal": inv_item.id_sucursal,
            "stock_actual": inv_item.stock_actual,
            "punto_pedido": inv_item.punto_pedido
        }
        
        channel.basic_publish(
            exchange='',
            routing_key='reorder_alerts',
            body=json.dumps(alert)
        )
        connection.close()
    except Exception as e:
        print(f"Error publishing reorder alert: {e}")

@app.get("/sucursales")
def get_sucursales(db: Session = Depends(get_db)):
    return db.query(models.Sucursal).all()

@app.post("/seed")
def seed_inventory(db: Session = Depends(get_db)):
    # Check if already seeded
    existing = db.query(models.Sucursal).first()
    if existing:
        return {"status": "already seeded"}

    # Add Sucursales
    s1 = models.Sucursal(nombre="Sucursal Norte", direccion="Av. Tecnológico 100")
    s2 = models.Sucursal(nombre="Sucursal Sur", direccion="Blvd. Revolución 500")
    db.add_all([s1, s2])
    db.commit()
    
    # Add initial inventory for variants 1, 2, 3 (from catalog)
    i1 = models.Inventario(id_sucursal=s1.id_sucursal, id_variante=1, stock_actual=10, punto_pedido=5)
    i2 = models.Inventario(id_sucursal=s1.id_sucursal, id_variante=2, stock_actual=2, punto_pedido=5)
    i3 = models.Inventario(id_sucursal=s2.id_sucursal, id_variante=3, stock_actual=15, punto_pedido=5)
    db.add_all([i1, i2, i3])
    db.commit()
    return {"status": "seeded"}
