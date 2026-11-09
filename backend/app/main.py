from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine
from .routers import memories


@asynccontextmanager
async def lifespan(app: FastAPI):
    # v1: create tables on startup. Switch to Alembic migrations once the schema starts changing.
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="Personal Memory Hub", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(memories.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
