import os
import sys
import httpx
from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Any
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

# Add backend dir to path so we can import basededatos and modelos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from basededatos import get_db
from modelos import Usuario
from sqlalchemy.orm import Session

# Security config
SECRET_KEY = "tu_clave_secreta_super_segura"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(title="API Gateway")

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
    db_user = db.query(Usuario).filter((Usuario.nombre_usuario == user.username) | (Usuario.correo == user.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    new_user = Usuario(
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
    user = db.query(Usuario).filter(Usuario.nombre_usuario == form_data.username).first()
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
    
    user = db.query(Usuario).filter(Usuario.nombre_usuario == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs
INVENTORY_SERVICE_URL = os.getenv("INVENTORY_SERVICE_URL", "http://inventory-service:8001")
CATALOG_SERVICE_URL = os.getenv("CATALOG_SERVICE_URL", "http://catalog-service:8002")
ORDERS_SERVICE_URL = os.getenv("ORDERS_SERVICE_URL", "http://orders-service:8003")

async def proxy_request(service_url: str, path: str, request: Request):
    url = f"{service_url}/{path}"
    async with httpx.AsyncClient() as client:
        method = request.method
        content = await request.body()
        headers = dict(request.headers)
        # Remove host header to avoid issues with proxying
        headers.pop("host", None)
        
        try:
            response = await client.request(
                method,
                url,
                params=request.query_params,
                headers=headers,
                content=content
            )
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Service unavailable: {exc}")

@app.api_route("/inventory/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def inventory_proxy(path: str, request: Request):
    return await proxy_request(INVENTORY_SERVICE_URL, path, request)

@app.api_route("/catalog/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def catalog_proxy(path: str, request: Request):
    return await proxy_request(CATALOG_SERVICE_URL, path, request)

@app.api_route("/orders/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def orders_proxy(path: str, request: Request):
    return await proxy_request(ORDERS_SERVICE_URL, path, request)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "gateway"}

# Unified endpoint for dashboard that combines inventory and catalog data
@app.get("/api/dashboard/inventory")
async def get_dashboard_inventory():
    async with httpx.AsyncClient() as client:
        try:
            # Fetch inventory
            inv_resp = await client.get(f"{INVENTORY_SERVICE_URL}/inventory")
            inventory = inv_resp.json()
            
            # Fetch sucursales
            suc_resp = await client.get(f"{INVENTORY_SERVICE_URL}/sucursales")
            sucursales = {s['id_sucursal']: s['nombre'] for s in suc_resp.json()}
            
            # Fetch all products/variants for enrichment
            # (In a real scenario, you'd want more efficient fetching)
            enriched_inventory = []
            for item in inventory:
                var_resp = await client.get(f"{CATALOG_SERVICE_URL}/variantes/{item['id_variante']}")
                variante = var_resp.json()
                
                # Fetch product name
                prod_resp = await client.get(f"{CATALOG_SERVICE_URL}/productos")
                productos = prod_resp.json()
                producto = next((p for p in productos if p['id'] == variante['id_producto']), None)
                
                enriched_inventory.append({
                    "id": item['id_inventario'],
                    "producto": producto['nombre'] if producto else "Desconocido",
                    "categoria": producto['categoria'] if producto else "General",
                    "sku": variante['sku'],
                    "precio": variante['precio_base'],
                    "detalles": f"{variante['color']} - Talla {variante['talla']}",
                    "stock": item['stock_actual'],
                    "alerta_reabastecimiento": item['stock_actual'] <= item['punto_pedido'],
                    "sucursal": sucursales.get(item['id_sucursal'], "Desconocida")
                })
            
            return enriched_inventory
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
