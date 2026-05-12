from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class Sucursal(Base):
    __tablename__ = 'sucursales'
    id_sucursal = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    direccion = Column(String(255))

class Inventario(Base):
    __tablename__ = 'inventario'
    id_inventario = Column(Integer, primary_key=True, autoincrement=True)
    id_sucursal = Column(Integer, ForeignKey('sucursales.id_sucursal'))
    id_variante = Column(Integer, index=True) # Referencia al microservicio de catálogo
    stock_actual = Column(Integer, nullable=False, default=0)
    punto_pedido = Column(Integer, nullable=False, default=5)
