import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from contextlib import asynccontextmanager
from pydantic_settings import BaseSettings, SettingsConfigDict

from models import AnalysisRun, CodeComponent, ComponentRelation
from routes.analysis import router as analysis_router

class Settings(BaseSettings):
    mongodb_password: str = ""
    mongodb_username: str = ""
    mongodb_uri_dev: str = "mongodb://localhost:27017"
    mongodb_uri_production: str = ""
    host: str = "127.0.0.1"
    port: int = 8001
    
    @property
    def mongodb_uri(self) -> str:
        if self.mongodb_uri_production:
            return self.mongodb_uri_production.format(
                MONGODB_USERNAME=self.mongodb_username,
                MONGODB_PASSWORD=self.mongodb_password
            ).rstrip('/')
        return self.mongodb_uri_dev.rstrip('/')
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    mongodb_uri = settings.mongodb_uri
    client = AsyncIOMotorClient(f"{mongodb_uri}/react_arch_analyzer")
    client.append_metadata = None
    
    await init_beanie(
        database=client.react_arch_analyzer, 
        document_models=[AnalysisRun, CodeComponent, ComponentRelation]
    )
    print("🚀 Beanie ORM initialized successfully!")
    yield 
    client.close()
    print("🛑 Database connection closed.")

app = FastAPI(
    title="React Architecture Analyzer API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router)

@app.get("/", tags=["Root"])
async def root():
    return {"status": "online", "message": "Backend is running with Beanie Lifespan!"}

if __name__ == '__main__':
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
