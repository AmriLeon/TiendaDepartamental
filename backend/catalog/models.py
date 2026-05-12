from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class Producto(Base):
    __tablename__ = 'productos'
    id_producto = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text)
    categoria = Column(String(50))
    variantes = relationship("Variante", back_populates="producto")

class Variante(Base):
    __tablename__ = 'variantes'
    id_variante = Column(Integer, primary_key=True, autoincrement=True)
    id_producto = Column(Integer, ForeignKey('productos.id_producto', ondelete="CASCADE"))
    sku = Column(String(50), unique=True, nullable=False)
    talla = Column(String(20))
    color = Column(String(30))
    material = Column(String(50))
    precio_base = Column(DECIMAL(10,2), nullable=False)
    producto = relationship("Producto", back_populates="variantes")
