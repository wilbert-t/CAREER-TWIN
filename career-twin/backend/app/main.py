from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.api.upload import router as upload_router
from app.api.profile import router as profile_router
from app.api.roles import router as roles_router

load_dotenv()

app = FastAPI(title="Career Twin API", version="0.1.0")

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(profile_router)
app.include_router(roles_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "career-twin-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
