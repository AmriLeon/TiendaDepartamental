from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

# Importamos la base de datos y los modelos
from basededatos import get_db, engine
import modelos

# Inicializamos la aplicación de FastAPI
app = FastAPI(title="API Tienda Departamental Monolítica")

# --- CONFIGURACIÓN DE CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SEGURIDAD ---
SECRET_KEY = "tu_clave_secreta_super_segura"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/register")
async def register(user: UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(modelos.Usuario).filter((modelos.Usuario.nombre_usuario == user.username) | (modelos.Usuario.correo == user.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    new_user = modelos.Usuario(
        nombre_usuario=user.username,
        correo=user.email,
        contrasena_hash=hashed_password,
        rol="cliente"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(modelos.Usuario).filter(modelos.Usuario.nombre_usuario == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.contrasena_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.nombre_usuario, "rol": user.rol})
    return {"access_token": access_token, "token_type": "bearer", "rol": user.rol}

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(modelos.Usuario).filter(modelos.Usuario.nombre_usuario == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# --- RUTA PRINCIPAL ---
@app.get("/")
def ruta_principal():
    return {"estado": "Éxito", "mensaje": "¡El backend está funcionando perfectamente!"}

# --- RUTAS DE INVENTARIO / DASHBOARD ---
@app.get("/api/dashboard/inventory")
@app.get("/api/inventario")
def obtener_inventario(db: Session = Depends(get_db)):
    # Hacemos una consulta relacional que une Inventario, Variante, Producto y Sucursal
    resultados = db.query(
        modelos.Inventario.id_inventario,
        modelos.Inventario.stock_actual,
        modelos.Inventario.punto_pedido,
        modelos.Variante.id_variante,
        modelos.Variante.sku,
        modelos.Variante.talla,
        modelos.Variante.color,
        modelos.Variante.precio_base,
        modelos.Producto.nombre,
        modelos.Producto.categoria,
        modelos.Sucursal.nombre.label("sucursal_nombre")
    ).join(modelos.Variante, modelos.Inventario.id_variante == modelos.Variante.id_variante)\
     .join(modelos.Producto, modelos.Variante.id_producto == modelos.Producto.id_producto)\
     .outerjoin(modelos.Sucursal, modelos.Inventario.id_sucursal == modelos.Sucursal.id_sucursal)\
     .all()

    inventario_formateado = []
    for fila in resultados:
        alerta_roja = fila.stock_actual <= fila.punto_pedido
        inventario_formateado.append({
            "id": fila.id_inventario,
            "id_variante": fila.id_variante,
            "producto": fila.nombre,
            "categoria": fila.categoria or "General",
            "sku": fila.sku,
            "precio": float(fila.precio_base) if fila.precio_base else 0.0,
            "detalles": f"{fila.color} - Talla {fila.talla}",
            "stock": fila.stock_actual,
            "alerta_reabastecimiento": alerta_roja,
            "sucursal": fila.sucursal_nombre or "Desconocida"
        })
        
    return inventario_formateado

# --- COMPRA DE ORDENES (MOCK) ---
class OrderItem(BaseModel):
    id_variante: int
    id_sucursal: int
    cantidad: int
    precio_unitario: float

class OrderCreate(BaseModel):
    items: list[OrderItem]

@app.post("/orders/orders")
async def create_order(order: OrderCreate, current_user: modelos.Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    # Simular la actualización de stock
    for item in order.items:
        inventario = db.query(modelos.Inventario).filter(
            modelos.Inventario.id_variante == item.id_variante,
            modelos.Inventario.id_sucursal == item.id_sucursal
        ).first()
        
        # Si no lo encontramos por sucursal específica (porque a lo mejor en el front pasamos id=variante)
        if not inventario:
            inventario = db.query(modelos.Inventario).filter(
                modelos.Inventario.id_variante == item.id_variante
            ).first()

        if inventario and inventario.stock_actual >= item.cantidad:
            inventario.stock_actual -= item.cantidad
        else:
            raise HTTPException(status_code=400, detail="Sin stock suficiente")
            
    db.commit()
    return {"message": "Orden procesada con éxito"}
