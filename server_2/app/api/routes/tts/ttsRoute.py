# tts_stream_module.py
import os
import uuid
import jwt
import logging
from fastapi import APIRouter, Cookie
from fastapi.responses import JSONResponse
from typing import List, Optional
from pydantic import BaseModel

# -------------------------------
# Logging
# -------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TTS-Service")

router = APIRouter()

# -------------------------------
# Config
# -------------------------------
ACCESS_SECRET_KEY = os.getenv("ACCESS_SECRET_KEY")
INTERVIEW_SECRET_KEY = os.getenv("INTERVIEW_SECRET_KEY")
ALGORITHM = "HS256"

if not ACCESS_SECRET_KEY or not INTERVIEW_SECRET_KEY:
    raise RuntimeError("JWT secret keys are not set in environment variables")

# -------------------------------
# Request Schemas
# -------------------------------
class SessionCreateRequest(BaseModel):
    role: str
    interview_type: str
    skills: Optional[List[str]] = None
    name: str

# -------------------------------
# Create session endpoint
# -------------------------------
@router.post("/api/v1/tts/create-session")
async def create_tts_session(
    body: SessionCreateRequest,
    accessToken: str = Cookie(None),
    refreshToken: str = Cookie(None)
):
    # ✅ Token check
    if not accessToken or not refreshToken:
        return JSONResponse(
            content={"success": False, "message": "Unauthorized to perform the action"},
            status_code=401
        )

    # ✅ Decode token safely
    try:
        payload = jwt.decode(accessToken, ACCESS_SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.InvalidTokenError:
        return JSONResponse(
            content={"success": False, "message": "Invalid access token"},
            status_code=401
        )

    user_id = payload.get("id")

    # ✅ Validate body fields
    if not body.role or not body.interview_type:
        return JSONResponse(
            content={"success": False, "message": "Role and interview_type are required"},
            status_code=400
        )

    # ✅ Generate session
    session_id = str(uuid.uuid4())
    session_payload = {
        "session_id": session_id,
        "user_id": user_id,
        "role": body.role,
        "interview_type": body.interview_type,
        "name": body.name,
    }

    if getattr(body, "skills", None):
        session_payload["skills"] = body.skills

    session_jwt = jwt.encode(session_payload, INTERVIEW_SECRET_KEY, algorithm=ALGORITHM)

    response = JSONResponse(
        content={
            "success": True,
            "message": "Session created successfully",
            "data": {
                "user_id": user_id,
                "role": body.role,
                "interview_type": body.interview_type,
                "skills": body.skills or [],
            },
        }
    )
    response.set_cookie(
        key="sessionID",
        value=session_jwt,
        httponly=True,
        samesite="lax",
        secure=True,  # ✅ enforce HTTPS in production
        path="/",
        max_age=3600
    )
    return response

# -------------------------------
# Verify token endpoint
# -------------------------------
@router.get("/api/v1/getInterviewDetails")
async def verify_token(accessToken: str = Cookie(None), sessionID: str = Cookie(None)):
    """
    Verify JWT token from cookie and return decoded payload.
    """
    if not accessToken:
        return JSONResponse(
            content={"success": False, "message": "Unauthorized to perform the action", "data": {}},
            status_code=401
        )

    if not sessionID:
        return JSONResponse(
            content={"success": False, "message": "Session ID missing", "data": {}},
            status_code=401
        )

    try:
        decoded = jwt.decode(sessionID, INTERVIEW_SECRET_KEY, algorithms=[ALGORITHM])
        return JSONResponse(
            content={"success": True, "message": "Token valid", "data": decoded}
        )
    except jwt.ExpiredSignatureError:
        return JSONResponse(
            content={"success": False, "message": "Token expired", "data": {}},
            status_code=403
        )
    except jwt.InvalidTokenError:
        return JSONResponse(
            content={"success": False, "message": "Invalid token", "data": {}},
            status_code=403
        )

# -------------------------------
# End session endpoint
# -------------------------------
@router.post("/api/v1/tts/end-session")
async def end_tts_session(sessionID: str = Cookie(None)):
    """
    End interview session by clearing sessionID cookie.
    """
    if not sessionID:
        return JSONResponse(
            content={"success": False, "message": "No active session found"},
            status_code=400,
        )

    response = JSONResponse(
        content={"success": True, "message": "Session ended successfully"}
    )

    response.delete_cookie(
        key="sessionID",
        path="/",
    )
    return response