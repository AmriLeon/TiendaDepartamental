# models.py
from sqlalchemy import Column, Integer, String, DECIMAL, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from basededatos import Base # Importamos la configuración base
from datetime import datetime

class Producto(Base):
    __tablename__ = 'productos'

    id_producto = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text)
    categoria = Column(String(50))
    imagen = Column(String(255))

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

    variante = relationship("Variante")
    sucursal = relationship("Sucursal")

class Usuario(Base):
    __tablename__ = 'usuarios'

    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    nombre_usuario = Column(String(50), unique=True, nullable=False)
    correo = Column(String(100), unique=True, nullable=False)
    contrasena_hash = Column(String(255), nullable=False)
    rol = Column(String(20), default="cliente", nullable=False)

class Venta(Base):
    __tablename__ = 'ventas'

    id_venta = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario'), nullable=True)
    total = Column(DECIMAL(10,2), nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow)

    detalles = relationship("DetalleVenta", back_populates="venta")
    usuario = relationship("Usuario")

class DetalleVenta(Base):
    __tablename__ = 'detalles_venta'

    id_detalle = Column(Integer, primary_key=True, autoincrement=True)
    id_venta = Column(Integer, ForeignKey('ventas.id_venta'))
    id_variante = Column(Integer, ForeignKey('variantes.id_variante'))
    id_sucursal = Column(Integer, ForeignKey('sucursales.id_sucursal'))
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(DECIMAL(10,2), nullable=False)

    venta = relationship("Venta", back_populates="detalles")
    variante = relationship("Variante")
    sucursal = relationship("Sucursal")

class PedidoLogistica(Base):
    __tablename__ = 'pedidos_logistica'

    id_pedido = Column(Integer, primary_key=True, autoincrement=True)
    id_venta = Column(Integer, ForeignKey('ventas.id_venta'))
    estado = Column(String(20), default="pendiente") # pendiente, empacando, enviado
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    venta = relationship("Venta")