from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os

class Database:
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    def get_db(cls):
        if cls.client is None:
            raise Exception("Database not initialized")
        return cls.client[os.environ.get('DB_NAME', 'campusiq')]
    
    @classmethod
    async def connect_db(cls):
        cls.client = AsyncIOMotorClient(os.environ['MONGO_URL'])
        # Create indexes
        db = cls.get_db()
        await db.users.create_index("email", unique=True)
        await db.subjects.create_index("code", unique=True)
        print("✅ Database connected and indexed")
    
    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()
            print("🔒 Database connection closed")

# Helper to get database instance
def get_database():
    return Database.get_db()
