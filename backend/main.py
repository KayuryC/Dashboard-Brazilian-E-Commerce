from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router as dashboard_router

app = FastAPI(
    title="Dashboard Giras API",
    version="0.1.0",
    description="Backend API for dashboard metrics.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router)


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {"message": "Dashboard Giras API is running"}
