from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db import init_db
from app.routers import bureaucracy, health, readbuddy, ai_settings


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=(
        "HumanBridge API reúne dois produtos: "
        "BridgeForm (tradução de burocracia) e ReadBuddy (tutor de leitura)."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

app.include_router(health.router, prefix=settings.api_v1_prefix, tags=["health"])
app.include_router(bureaucracy.router, prefix=settings.api_v1_prefix, tags=["bureaucracy"])
app.include_router(readbuddy.router, prefix=settings.api_v1_prefix, tags=["readbuddy"])
app.include_router(ai_settings.router, prefix=settings.api_v1_prefix, tags=["ai-settings"])
