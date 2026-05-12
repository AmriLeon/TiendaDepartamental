# models.py
from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey, Text
from sqlalchemy.orm import relationship
from basededatos import Base # Importamos la configuración base

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

# Agrégalas al final de tu archivo modelos.py

class Sucursal(Base):
    __tablename__ = 'sucursales'

    id_sucursal = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    direccion = Column(String(255))

class Inventario(Base):
    __tablename__ = 'inventario'

    id_inventario = Column(Integer, primary_key=True, autoincrement=True)
    id_sucursal = Column(Integer, ForeignKey('sucursales.id_sucursal'))
    id_variante = Column(Integer, ForeignKey('variantes.id_variante'))
    stock_actual = Column(Integer, nullable=False, default=0)
    punto_pedido = Column(Integer, nullable=False, default=5)

class Usuario(Base):
    __tablename__ = 'usuarios'

    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    nombre_usuario = Column(String(50), unique=True, nullable=False)
    correo = Column(String(100), unique=True, nullable=False)
    contrasena_hash = Column(String(255), nullable=False)
    rol = Column(String(20), default="cliente", nullable=False) # 'admin' o 'cliente'