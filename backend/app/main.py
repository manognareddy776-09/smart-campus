from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, get_db
from app.models import Campus, User
from app.auth import get_password_hash
from app.routers import (
    auth,
    campuses,
    items,
    claims,
    contact,
    favorites,
    notifications,
    flags,
    admin,
)

def init_db():
    Base.metadata.create_all(bind=engine)
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    
    # Seed default campuses if empty
    db = next(get_db())
    try:
        if db.query(Campus).count() == 0:
            default_campuses = [
                Campus(name="Main Campus (Engineering & Science)", location="Block A & B, Academic Road", code="MC-01"),
                Campus(name="North Campus (Arts, Humanities & Management)", location="North Gate, Tech Park", code="NC-02"),
                Campus(name="South Campus (Health & Applied Sciences)", location="South Boulevard, Medical Square", code="SC-03"),
            ]
            db.add_all(default_campuses)
            db.commit()

        # Seed initial admin user if none exists
        admin_user = db.query(User).filter(User.role == "admin").first()
        if not admin_user:
            admin_user = User(
                email="admin@campus.edu",
                hashed_password=get_password_hash("Admin@123456"),
                display_name="Campus Admin Office",
                role="admin",
                contact_preferences="email",
                college_id="ADM-001"
            )
            db.add(admin_user)
            db.commit()
    except Exception as e:
        print(f"Database initialization warning: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Centralized online platform for university students to report and recover lost belongings with smart similarity matching.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local development and preview
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for user uploaded images
upload_path = Path(settings.UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

# Health check endpoint
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "database": "connected"
    }

# Include all sub-routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(campuses.router, prefix=settings.API_V1_STR)
app.include_router(items.router, prefix=settings.API_V1_STR)
app.include_router(claims.router, prefix=settings.API_V1_STR)
app.include_router(contact.router, prefix=settings.API_V1_STR)
app.include_router(favorites.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(flags.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
