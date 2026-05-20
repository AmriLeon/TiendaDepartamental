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
            "talla": fila.talla,
            "color": fila.color,
            "detalles": f"{fila.color} - Talla {fila.talla}",
            "stock": fila.stock_actual,
            "alerta_reabastecimiento": alerta_roja,
            "sucursal": fila.sucursal_nombre or "Desconocida"
        })
        
    return inventario_formateado

# --- AGREGAR STOCK ---
class AddStockRequest(BaseModel):
    id_inventario: int
    cantidad: int

@app.post("/api/inventario/add-stock")
def add_stock(req: AddStockRequest, current_user: modelos.Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = db.query(modelos.Inventario).filter(modelos.Inventario.id_inventario == req.id_inventario).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventario no encontrado")
    
    inv.stock_actual += req.cantidad
    db.commit()
    db.refresh(inv)
    return {"message": "Stock actualizado con éxito", "nuevo_stock": inv.stock_actual}

# --- ALTA DE NUEVA MERCANCÍA ---
class NewProductRequest(BaseModel):
    nombre: str
    categoria: str
    precio: float
    stock_inicial: int
    punto_pedido: int
    talla: str = None
    color: str = None

@app.post("/api/inventario/nuevo-producto")
def nuevo_producto(req: NewProductRequest, current_user: modelos.Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Crear el Producto
    nuevo_prod = modelos.Producto(
        nombre=req.nombre,
        categoria=req.categoria,
        descripcion=f"Producto de la categoría {req.categoria}"
    )
    db.add(nuevo_prod)
    db.commit()
    db.refresh(nuevo_prod)
    
    # 2. Crear la Variante (con talla y color si existen, o "N/A" por defecto)
    import uuid
    sku_generado = f"SKU-{uuid.uuid4().hex[:6].upper()}"
    nueva_variante = modelos.Variante(
        id_producto=nuevo_prod.id_producto,
        sku=sku_generado,
        talla=req.talla if req.talla else "N/A",
        color=req.color if req.color else "N/A",
        precio_base=req.precio
    )
    db.add(nueva_variante)
    db.commit()
    db.refresh(nueva_variante)
    
    # 3. Crear el Inventario (Asociado a la sucursal 1 por defecto, o None)
    # Buscamos la sucursal 1, si no existe la dejamos en NULL
    sucursal = db.query(modelos.Sucursal).first()
    id_suc = sucursal.id_sucursal if sucursal else None
    
    nuevo_inv = modelos.Inventario(
        id_sucursal=id_suc,
        id_variante=nueva_variante.id_variante,
        stock_actual=req.stock_inicial,
        punto_pedido=req.punto_pedido
    )
    db.add(nuevo_inv)
    db.commit()
    
    return {"message": "Producto creado con éxito"}

# --- COMPRA DE ORDENES (MOCK) ---
class OrderItem(BaseModel):
    id_variante: int
    id_sucursal: int
    cantidad: int
    precio_unitario: float

class OrderCreate(BaseModel):
    items: list[OrderItem]

@app.get("/api/sucursales")
def obtener_sucursales(db: Session = Depends(get_db)):
    sucursales = db.query(modelos.Sucursal).all()
    return [{"id": s.id_sucursal, "nombre": s.nombre} for s in sucursales]

@app.post("/api/tpv/venta")
def procesar_venta(req: OrderCreate, current_user: modelos.Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    # Simular la venta en TPV descontando stock
    for item in req.items:
        inventario = db.query(modelos.Inventario).filter(
            modelos.Inventario.id_variante == item.id_variante,
            modelos.Inventario.id_sucursal == item.id_sucursal
        ).first()
        
        # Si no lo encontramos por sucursal, lo intentamos sin sucursal
        if not inventario:
            inventario = db.query(modelos.Inventario).filter(
                modelos.Inventario.id_variante == item.id_variante
            ).first()

        if inventario and inventario.stock_actual >= item.cantidad:
            inventario.stock_actual -= item.cantidad
        else:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para variante {item.id_variante}")
            
    db.commit()
    return {"message": "Venta procesada con éxito"}
