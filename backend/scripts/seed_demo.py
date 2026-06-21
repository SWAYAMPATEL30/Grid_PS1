import os
import uuid
import asyncio
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"
)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

USERS = [
    {
        "email": "admin@parksight.in",
        "full_name": "System Admin",
        "role": "ADMIN",
        "police_station": None,
    },
    {
        "email": "analyst@parksight.in",
        "full_name": "Data Analyst",
        "role": "ANALYST",
        "police_station": "HQ",
    },
    {
        "email": "verifier@parksight.in",
        "full_name": "Report Verifier",
        "role": "VERIFIER",
        "police_station": "HQ",
    },
    {
        "email": "officer.rao@parksight.in",
        "full_name": "Rao (Traffic Officer)",
        "role": "POLICE_OFFICER",
        "police_station": "Ashok Nagar PS",
    },
    {
        "email": "officer.singh@parksight.in",
        "full_name": "Singh (Traffic Officer)",
        "role": "POLICE_OFFICER",
        "police_station": "Indiranagar PS",
    },
    {
        "email": "tow.operator1@parksight.in",
        "full_name": "Tow Truck 1",
        "role": "TOW_OPERATOR",
        "police_station": None,
    },
    {
        "email": "citizen@example.com",
        "full_name": "Citizen User",
        "role": "CITIZEN",
        "police_station": None,
    },
    {
        "email": "owner@example.com",
        "full_name": "Vehicle Owner",
        "role": "VEHICLE_OWNER",
        "police_station": None,
    }
]

async def seed_users():
    engine = create_async_engine(DATABASE_URL)
    hashed_pw = pwd_context.hash("Password@123")
    
    async with engine.begin() as conn:
        for user in USERS:
            # Check if exists
            result = await conn.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": user["email"]}
            )
            if not result.fetchone():
                await conn.execute(
                    text("""
                        INSERT INTO users (id, email, hashed_password, role, full_name, police_station, is_active, created_at)
                        VALUES (:id, :email, :pw, :role, :name, :station, true, :now)
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "email": user["email"],
                        "pw": hashed_pw,
                        "role": user["role"],
                        "name": user["full_name"],
                        "station": user["police_station"],
                        "now": datetime.utcnow()
                    }
                )
                print(f"Created user: {user['email']}")
            else:
                print(f"User {user['email']} already exists.")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_users())
