from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel

# Importamos la base de datos y los modelos
from basededatos import get_db, engine
import modelos

# Inicializamos la aplicación de FastAPI
app = FastAPI(title="API Tienda Departamental Monolítica")

# --- CONFIGURACIÓN DE CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SEGURIDAD ---
SECRET_KEY = "tu_clave_secreta_super_segura"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

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
    
    hashed_password = get_password_hash(user.password)
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
    if not user or not verify_password(form_data.password, user.contrasena_hash):
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
        modelos.Inventario.id_sucursal,
        modelos.Inventario.stock_actual,
        modelos.Inventario.punto_pedido,
        modelos.Variante.id_variante,
        modelos.Variante.sku,
        modelos.Variante.talla,
        modelos.Variante.color,
        modelos.Variante.precio_base,
        modelos.Producto.nombre,
        modelos.Producto.categoria,
        modelos.Producto.descripcion,
        modelos.Producto.imagen,
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
            "id_sucursal": fila.id_sucursal if hasattr(fila, 'id_sucursal') else None,
            "producto": fila.nombre,
            "descripcion": fila.descripcion or "",
            "imagen": fila.imagen or "https://via.placeholder.com/150",
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
    # 1. Calcular total de la venta
    total = sum(item.cantidad * item.precio_unitario for item in req.items)
    
    # 2. Crear registro de venta
    nueva_venta = modelos.Venta(
        id_usuario=current_user.id_usuario,
        total=total
    )
    db.add(nueva_venta)
    db.flush() # Para obtener el ID generado sin commitear aún

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
            
            # Registrar detalle de venta
            detalle = modelos.DetalleVenta(
                id_venta=nueva_venta.id_venta,
                id_variante=item.id_variante,
                id_sucursal=inventario.id_sucursal, # usar el real
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario
            )
            db.add(detalle)
        else:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para variante {item.id_variante}")
            
    # 3. Generar pedido logístico
    nuevo_pedido = modelos.PedidoLogistica(
        id_venta=nueva_venta.id_venta,
        estado="pendiente"
    )
    db.add(nuevo_pedido)
    
    db.commit()
    return {"message": "Venta procesada con éxito", "id_venta": nueva_venta.id_venta}

# --- ANALÍTICAS ---
from sqlalchemy.sql import func

@app.get("/api/dashboard/analytics")
def obtener_analiticas(db: Session = Depends(get_db)):
    # 1. Ticket promedio
    promedio = db.query(func.avg(modelos.Venta.total)).scalar() or 0.0
    
    # 2. Top Productos (sumando cantidad de detalles agrupados por variante)
    top_query = db.query(
        modelos.Producto.nombre,
        func.sum(modelos.DetalleVenta.cantidad).label("uds_vendidas")
    ).join(modelos.Variante, modelos.DetalleVenta.id_variante == modelos.Variante.id_variante)\
     .join(modelos.Producto, modelos.Variante.id_producto == modelos.Producto.id_producto)\
     .group_by(modelos.Producto.id_producto, modelos.Producto.nombre)\
     .order_by(func.sum(modelos.DetalleVenta.cantidad).desc())\
     .limit(3).all()
     
    top_productos = [{"id": i+1, "nombre": row.nombre, "uds": int(row.uds_vendidas)} for i, row in enumerate(top_query)]
    
    # 3. Ventas por Sucursal
    sucursal_query = db.query(
        modelos.Sucursal.nombre,
        func.sum(modelos.DetalleVenta.cantidad * modelos.DetalleVenta.precio_unitario).label("total_sucursal")
    ).join(modelos.Sucursal, modelos.DetalleVenta.id_sucursal == modelos.Sucursal.id_sucursal)\
     .group_by(modelos.Sucursal.id_sucursal, modelos.Sucursal.nombre)\
     .all()
     
    ventas_sucursal = [{"sucursal": row.nombre, "total": float(row.total_sucursal)} for row in sucursal_query]

    # Handle Tienda en Línea fallback
    if not ventas_sucursal:
        ventas_sucursal = [{"sucursal": "Tienda en Línea", "total": float(promedio)}] # Placeholder
        
    return {
        "ticket_promedio": float(promedio),
        "top_productos": top_productos,
        "ventas_sucursal": ventas_sucursal
    }

# --- LOGÍSTICA ---
class UpdatePedidoStatus(BaseModel):
    estado: str

@app.get("/api/dashboard/logistica")
def obtener_logistica(db: Session = Depends(get_db)):
    pedidos = db.query(modelos.PedidoLogistica).all()
    resultado = []
    for p in pedidos:
        resultado.append({
            "id": p.id_pedido,
            "id_venta": p.id_venta,
            "estado": p.estado,
            "fecha": p.fecha_actualizacion.strftime("%d/%m/%Y %H:%M")
        })
    return resultado

@app.put("/api/dashboard/logistica/{id_pedido}")
def actualizar_pedido(id_pedido: int, req: UpdatePedidoStatus, db: Session = Depends(get_db), current_user: modelos.Usuario = Depends(get_current_user)):
    pedido = db.query(modelos.PedidoLogistica).filter(modelos.PedidoLogistica.id_pedido == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    pedido.estado = req.estado
    db.commit()
    return {"message": "Estado actualizado"}

# --- CLIENTES ---
@app.get("/api/dashboard/clientes")
def obtener_clientes(db: Session = Depends(get_db)):
    clientes = db.query(modelos.Usuario).filter(modelos.Usuario.rol == 'cliente').all()
    return [{"id": c.id_usuario, "nombre": c.nombre_usuario, "correo": c.correo} for c in clientes]

@app.get("/api/dashboard/clientes/{id_cliente}/historial")
def obtener_historial_cliente(id_cliente: int, db: Session = Depends(get_db)):
    ventas = db.query(modelos.Venta).filter(modelos.Venta.id_usuario == id_cliente).all()
    
    historial = []
    for v in ventas:
        detalles = db.query(
            modelos.DetalleVenta.cantidad,
            modelos.DetalleVenta.precio_unitario,
            modelos.Producto.nombre,
            modelos.Producto.categoria
        ).join(modelos.Variante, modelos.DetalleVenta.id_variante == modelos.Variante.id_variante)\
         .join(modelos.Producto, modelos.Variante.id_producto == modelos.Producto.id_producto)\
         .filter(modelos.DetalleVenta.id_venta == v.id_venta).all()
         
        for d in detalles:
            historial.append({
                "id": f"{v.id_venta}-{d.nombre}",
                "fecha": v.fecha.strftime("%d/%m/%Y %H:%M"),
                "producto": d.nombre,
                "categoria": d.categoria,
                "cant": d.cantidad,
                "total": float(d.cantidad * d.precio_unitario)
            })
            
    return historial
