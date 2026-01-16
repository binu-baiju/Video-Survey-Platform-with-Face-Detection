from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api import surveys, submissions
from app.database import engine, Base
import os

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Video Survey Platform API",
    description="Privacy-first video survey platform with face detection",
    version="1.0.0"
)

# CORS configuration
# Allow origins from environment variable or default to localhost
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(surveys.router, prefix="/api", tags=["surveys"])
app.include_router(submissions.router, prefix="/api", tags=["submissions"])

@app.get("/")
async def root():
    return {"message": "Video Survey Platform API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )
