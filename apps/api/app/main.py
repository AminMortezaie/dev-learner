from __future__ import annotations

import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("devlearn-api")

app = FastAPI(
    title="DevLearn API",
    description="Programming language learning platform for senior developers",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path.split("?")[0]
    logger.info("%s %s -> %s", request.method, path, response.status_code)
    return response


@app.exception_handler(LookupError)
async def not_found_handler(_request: Request, exc: LookupError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"message": str(exc)})


@app.exception_handler(Exception)
async def unhandled_handler(_request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"message": "Internal server error"})


@app.on_event("startup")
async def startup() -> None:
    port = int(os.environ.get("PORT", "5000"))
    has_db = bool(os.environ.get("DATABASE_URL"))
    logger.info("api listening on port=%s has_database_url=%s", port, has_db)
