from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

from database import engine, Base
import models  # noqa: F401 — ensures all models are registered before create_all

# Import all route modules
from routes import auth_routes, photo_routes, garment_routes, tryon_routes, credit_routes, stylist_routes

load_dotenv()

# ── Create all database tables on startup ────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Create upload directories ────────────────────────────────────────────────
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
for subfolder in ["user_photos", "garments", "results"]:
    os.makedirs(os.path.join(UPLOAD_DIR, subfolder), exist_ok=True)


# ── FastAPI App instance ─────────────────────────────────────────────────────
app = FastAPI(
    title="Virtual Try-On API",
    description="Backend API for the AI-powered Virtual Try-On Web Application.",
    version="1.0.0",
    docs_url="/docs",       # Swagger UI at /docs
    redoc_url="/redoc"      # ReDoc UI at /redoc
)

# ── CORS Middleware (allows React frontend to call this API) ─────────────────
origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
# Robust parsing: strip whitespace and trailing slashes
allowed_origins = [origin.strip().rstrip("/") for origin in origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Serve uploaded images as static files ────────────────────────────────────
# Access at: http://localhost:8000/uploads/garments/filename.jpg
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ── Register all API routers ─────────────────────────────────────────────────
app.include_router(auth_routes.router, prefix="/api")
app.include_router(photo_routes.router, prefix="/api")
app.include_router(garment_routes.router, prefix="/api")
app.include_router(tryon_routes.router, prefix="/api")
app.include_router(credit_routes.router, prefix="/api")
app.include_router(stylist_routes.router, prefix="/api")


# ── Health check endpoint ────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "message": "Virtual Try-On API is running!",
        "docs": "/docs"
    }
