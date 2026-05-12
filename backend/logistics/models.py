from sqlalchemy import Column, Integer, String, DateTime
from database import Base
import datetime

class Seguimiento(Base):
    __tablename__ = 'seguimientos'
    id_seguimiento = Column(Integer, primary_key=True, autoincrement=True)
    id_orden = Column(Integer, unique=True)
    estado_actual = Column(String(100))
    ultima_actualizacion = Column(DateTime, default=datetime.datetime.utcnow)
    id_rastreo_externo = Column(String(100))
