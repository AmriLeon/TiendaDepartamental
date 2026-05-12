import os
import redis
import json
import time
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, engine, Base, SessionLocal
import models
from pydantic import BaseModel
from typing import List
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

# Retry connecting to DB
for _ in range(10):
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("✅ Base de datos de Catálogo conectada y tablas creadas.")
        break
    except Exception as e:
        print(f"⏳ Esperando a la base de datos de Catálogo... {e}")
        time.sleep(5)

app = FastAPI(title="Catalog Service")

# Scheduler for dynamic prices
def apply_night_sale():
    db = SessionLocal()
    print(f"[{datetime.now()}] Aplicando Venta Nocturna: -15% en Electrónica")
    # Logic to apply discounts
    variantes = db.query(models.Variante).join(models.Producto).filter(models.Producto.categoria == "Electrónica").all()
    for v in variantes:
        v.precio_base = float(v.precio_base) * 0.85
    db.commit()
    db.close()
    r.delete("all_productos")

scheduler = BackgroundScheduler()
# Run every day at 00:00 (for demo, let's say every hour or manual trigger)
# scheduler.add_job(apply_night_sale, 'cron', hour=0)
scheduler.start()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
r = redis.from_url(REDIS_URL)

class PriceUpdate(BaseModel):
    id_variante: int
    nuevo_precio: float

@app.get("/productos")
def get_productos(db: Session = Depends(get_db)):
    # Try to get from cache
    cache_key = "all_productos"
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
    
    productos = db.query(models.Producto).all()
    # Serialize manually because SQLAlchemy objects aren't directly serializable to JSON
    result = []
    for p in productos:
        result.append({
            "id": p.id_producto,
            "nombre": p.nombre,
            "descripcion": p.descripcion,
            "categoria": p.categoria
        })
    
    r.setex(cache_key, 3600, json.dumps(result)) # Cache for 1 hour
    return result

@app.get("/productos/{id_producto}/variantes")
def get_variantes(id_producto: int, db: Session = Depends(get_db)):
    return db.query(models.Variante).filter(models.Variante.id_producto == id_producto).all()

@app.get("/variantes/{id_variante}")
def get_variante(id_variante: int, db: Session = Depends(get_db)):
    return db.query(models.Variante).filter(models.Variante.id_variante == id_variante).first()

@app.post("/variantes/update-price")
def update_price(update: PriceUpdate, db: Session = Depends(get_db)):
    variante = db.query(models.Variante).filter(models.Variante.id_variante == update.id_variante).first()
    if not variante:
        raise HTTPException(status_code=404, detail="Variante not found")
    
    variante.precio_base = update.nuevo_precio
    db.commit()
    
    # Invalidate cache
    r.delete("all_productos")
    return {"status": "success", "nuevo_precio": update.nuevo_precio}

@app.post("/precios/masivo")
def masive_price_update(categoria: str, porcentaje: float, db: Session = Depends(get_db)):
    # Implementation for masive update
    variantes = db.query(models.Variante).join(models.Producto).filter(models.Producto.categoria == categoria).all()
    for v in variantes:
        v.precio_base = float(v.precio_base) * (1 + porcentaje/100)
    
    db.commit()
    r.delete("all_productos")
    return {"status": "success", "updated_count": len(variantes)}

@app.post("/seed")
def seed_catalog(db: Session = Depends(get_db)):
    # Check if already seeded
    existing = db.query(models.Producto).first()
    if existing:
        return {"status": "already seeded"}
        
    p1 = models.Producto(nombre="Pantalón Denim Clásico", descripcion="Jeans ajustados", categoria="Ropa")
    p2 = models.Producto(nombre="Fragancia Nocturna", descripcion="Aroma amaderado", categoria="Perfumería")
    db.add_all([p1, p2])
    db.commit()
    
    v1 = models.Variante(id_producto=p1.id_producto, sku="PANT-AZ-M", talla="M", color="Azul", material="Mezclilla", precio_base=599.00)
    v2 = models.Variante(id_producto=p1.id_producto, sku="PANT-NE-L", talla="L", color="Negro", material="Mezclilla", precio_base=599.00)
    v3 = models.Variante(id_producto=p2.id_producto, sku="PERF-100", talla="100ml", color="N/A", material="Cristal", precio_base=1250.00)
    db.add_all([v1, v2, v3])
    db.commit()
    return {"status": "seeded"}
