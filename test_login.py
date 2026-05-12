import httpx
import asyncio

async def test_login():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/token",
            data={"username": "admin", "password": "admin123"}
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_login())