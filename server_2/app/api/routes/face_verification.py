from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import base64, cv2, numpy as np
from deepface import DeepFace
import logging
from scipy.spatial.distance import cosine

router = APIRouter(prefix="/api/v1", tags=["Face Verification"])

# -------------------------------
# Logger
# -------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------------------
# Request Body Model
# -------------------------------
class FaceVerificationRequest(BaseModel):
    captured_image: str
    user_image: str

# -------------------------------
# Decode base64 -> np.ndarray
# -------------------------------
def decode_base64_image(data_url: str) -> np.ndarray:
    if "," in data_url:
        data_url = data_url.split(",")[1]
    img_bytes = base64.b64decode(data_url)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

# -------------------------------
# Extract embedding with ArcFace
# -------------------------------
def get_embedding(img: np.ndarray) -> np.ndarray:
    face_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    embedding = DeepFace.represent(
        img_path=face_rgb,
        model_name="ArcFace",
        detector_backend="skip",   # 🔑 no face detector
        enforce_detection=False
    )[0]["embedding"]
    return np.array(embedding)

# -------------------------------
# Route: Face Verification
# -------------------------------
@router.post("/verify-face")
async def verify_face(req: FaceVerificationRequest):
    try:
        face1 = decode_base64_image(req.captured_image)
        face2 = decode_base64_image(req.user_image)

        emb1 = get_embedding(face1)
        emb2 = get_embedding(face2)

        distance = cosine(emb1, emb2)
        verified = distance < 0.6  # ArcFace threshold

        logger.info(f"Verification: verified={verified}, distance={distance:.4f}")

        return {
            "success": verified,
            "message": "Face matched" if verified else "Face did not match",
            "distance": distance
        }

    except Exception as e:
        logger.exception("Face verification failed")
        raise HTTPException(status_code=500, detail="Internal Server Error")
