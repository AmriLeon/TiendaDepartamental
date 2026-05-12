from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Orden(Base):
    __tablename__ = 'ordenes'
    id_orden = Column(Integer, primary_key=True, autoincrement=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)
    total = Column(DECIMAL(10,2))
    estado = Column(String(50), default="Pendiente")
    detalles = relationship("DetalleOrden", back_populates="orden")

class DetalleOrden(Base):
    __tablename__ = 'detalle_ordenes'
    id_detalle = Column(Integer, primary_key=True, autoincrement=True)
    id_orden = Column(Integer, ForeignKey('ordenes.id_orden'))
    id_variante = Column(Integer)
    id_sucursal = Column(Integer)
    cantidad = Column(Integer)
    precio_unitario = Column(DECIMAL(10,2))
    orden = relationship("Orden", back_populates="detalles")
