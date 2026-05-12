import httpx
import asyncio
import time
import sys

# Ensure stdout uses utf-8 encoding for Windows console compatibility
sys.stdout.reconfigure(encoding='utf-8')

GATEWAY_URL = "http://localhost:8000"
INVENTORY_URL = "http://localhost:8001"
CATALOG_URL = "http://localhost:8002"

async def seed():
    async with httpx.AsyncClient() as client:
        print("🌱 Esperando a que los servicios esten listos...")
        # Simple wait for services to be up
        for _ in range(10):
            try:
                resp = await client.get(f"{GATEWAY_URL}/health")
                if resp.status_code == 200:
                    break
            except:
                pass
            time.sleep(5)

        print("🚀 Sembrando Catalogo...")
        # 1. Crear Productos
        p1 = {"nombre": "Pantalon Denim Clasico", "descripcion": "Jeans ajustados", "categoria": "Ropa"}
        
        try:
            resp = await client.post(f"{CATALOG_URL}/seed")
            if resp.status_code == 200:
                print("✅ Catalogo sembrado.")
            else:
                print(f"❌ Error HTTP {resp.status_code} al sembrar catalogo: {resp.text}")
        except Exception as e:
            print(f"❌ Error de conexion al sembrar catalogo: {e}")

        try:
            resp = await client.post(f"{INVENTORY_URL}/seed")
            if resp.status_code == 200:
                print("✅ Inventario sembrado.")
            else:
                print(f"❌ Error HTTP {resp.status_code} al sembrar inventario: {resp.text}")
        except Exception as e:
            print(f"❌ Error de conexion al sembrar inventario: {e}")

if __name__ == "__main__":
    asyncio.run(seed())
