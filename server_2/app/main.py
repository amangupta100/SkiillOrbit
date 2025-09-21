from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import face_verification
import os
from app.api.routes.proctoring import socket
from app.api.routes import parseResume
from app.api.routes.tts import ttsRoute
app = FastAPI()

# Get allowed origins from environment
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

# Add WebSocket protocols to allowed origins
websocket_origins = [origin.replace("http://", "ws://").replace("https://", "wss://") 
                    for origin in allowed_origins]
all_allowed_origins = allowed_origins + websocket_origins

# Configure CORS with WebSocket support
app.add_middleware(
    CORSMiddleware,
    allow_origins=all_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include routers
app.include_router(face_verification.router)
app.include_router(socket.router)
app.include_router(parseResume.router)
app.include_router(ttsRoute.router)

@app.get("/")
async def root():
    return {"message": "API is working"}