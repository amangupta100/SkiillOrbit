from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import cv2
import numpy as np
import base64
import mediapipe as mp
from ultralytics import YOLO
import logging
from typing import Optional, Dict

router = APIRouter(prefix="/api/v1", tags=["Proctoring"])

# Configure logging
logging.basicConfig(level=logging.ERROR)  # Only show error logs
logger = logging.getLogger(__name__)


class ProctoringVerifier:
    def __init__(self, detection_interval: int = 5):
        # Initialize MediaPipe FaceMesh
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=2,
            refine_landmarks=True,
            min_detection_confidence=0.5
        )
        # Initialize YOLOv8 with a lightweight model
        self.yolo_model = YOLO("yolov8s.pt")
        self.reference_image = None
        self.reference_landmarks = None

        # Internal counters
        self.frame_counter = 0
        self.detection_interval = detection_interval  # run YOLO every Nth frame

    def set_reference(self, image_data: str) -> bool:
        """Set the reference image for verification"""
        img = self._decode_image(image_data)
        if img is None:
            return False

        results = self.face_mesh.process(img)
        if not results.multi_face_landmarks:
            return False

        self.reference_image = img
        self.reference_landmarks = np.array([
            [lm.x, lm.y, lm.z] for lm in results.multi_face_landmarks[0].landmark
        ])
        return True

    def _decode_image(self, image_data: str) -> Optional[np.ndarray]:
        """Decode base64 image data to numpy array"""
        try:
            if image_data.startswith("data:image"):
                _, encoded = image_data.split(",", 1)
                img = cv2.imdecode(
                    np.frombuffer(base64.b64decode(encoded), np.uint8), cv2.IMREAD_COLOR
                )
                return cv2.cvtColor(img, cv2.COLOR_BGR2RGB) if img is not None else None
            return None
        except Exception as e:
            logger.error(f"Image decode error: {str(e)}")
            return None

    def _check_prohibited_objects(self, frame_img: np.ndarray, conf_threshold: float = 0.6) -> Optional[Dict]:
        """Check for prohibited objects with YOLOv8"""
        try:
            self.frame_counter += 1
            # Run YOLO only every Nth frame
            if self.frame_counter % self.detection_interval != 0:
                return None

            results = self.yolo_model(frame_img, verbose=False, conf=conf_threshold)
            for cls_id, conf, box in zip(results[0].boxes.cls, results[0].boxes.conf, results[0].boxes.xyxy):
                cls_id = int(cls_id)
                label = results[0].names[cls_id].lower()

                if label in ["cell phone", "mobile phone", "phone", "laptop", "tablet"]:
                    # Allow lower threshold for phones
                    if "phone" in label and conf < 0.4:
                        continue

                    w, h = box[2] - box[0], box[3] - box[1]
                    if (w * h) < 500:  # ignore very small detections
                        continue

                    # Relaxed aspect ratio filter (optional)
                    aspect_ratio = h / (w + 1e-6)
                    if not (0.5 < aspect_ratio < 3.0):
                        continue

                    return {
                        "type": "proctoring_result",
                        "success": False,
                        "similarity": 0.0,
                        "issues": [
                            f"Unauthorized object detected: {label} (confidence: {conf:.2f})"
                        ]
                    }
            return None
        except Exception as e:
            logger.error(f"Object detection error: {str(e)}")
            return None

    def verify_frame(self, frame_data: str, face_threshold: float = 0.55) -> Dict:
        """Verify a frame against the reference image with optimized object detection"""
        response = {
            "type": "proctoring_result",
            "success": False,
            "similarity": 0.0,
            "issues": []
        }

        # Validate frame data
        if not frame_data or not isinstance(frame_data, str):
            response["issues"].append("Invalid frame data: empty or wrong format")
            return response

        frame_img = self._decode_image(frame_data)
        if frame_img is None:
            response["issues"].append("Invalid frame data: could not decode image")
            return response

        # FIRST: Check prohibited objects
        object_check = self._check_prohibited_objects(frame_img)
        if object_check is not None:
            return object_check

        # SECOND: Face verification
        try:
            face_results = self.face_mesh.process(frame_img)
        except Exception as e:
            response["issues"].append(f"Face detection error: {str(e)}")
            return response

        if not face_results.multi_face_landmarks:
            response["issues"].append("No face detected in frame")
            return response

        if len(face_results.multi_face_landmarks) > 1:
            response["issues"].append(f"Multiple faces detected ({len(face_results.multi_face_landmarks)})")
            return response

        if self.reference_landmarks is None:
            response["issues"].append("System not initialized with reference image")
            return response

        try:
            frame_landmarks = np.array([
                [lm.x, lm.y, lm.z] for lm in face_results.multi_face_landmarks[0].landmark
            ])
            similarity = float(1 - np.mean(np.abs(frame_landmarks - self.reference_landmarks)))
            response["similarity"] = similarity

            if similarity < face_threshold:
                response["issues"].append(f"Face mismatch (confidence: {similarity:.2f})")
            else:
                response["success"] = True if not response["issues"] else False
        except Exception as e:
            response["issues"].append(f"Verification error: {str(e)}")

        return response


@router.websocket("/ws/proctor")
async def proctor_websocket(websocket: WebSocket):
    await websocket.accept()
    verifier = ProctoringVerifier(detection_interval=5)  # Run YOLO every 5th frame
    reference_set = False

    try:
        while True:
            try:
                data = await websocket.receive_json()

                if data.get("type") == "init":
                    if verifier.set_reference(data.get("referenceImage", "")):
                        reference_set = True
                        response = {"type": "proctoring_result", "success": True, "issues": []}
                    else:
                        response = {
                            "type": "proctoring_result",
                            "success": False,
                            "issues": ["No face detected in reference image"]
                        }
                    await websocket.send_json(response)

                elif data.get("type") == "frame":
                    if not reference_set:
                        response = {
                            "type": "proctoring_result",
                            "success": False,
                            "issues": ["Reference image not set"]
                        }
                    else:
                        response = verifier.verify_frame(data.get("image", ""))
                    await websocket.send_json(response)

                else:
                    response = {
                        "type": "proctoring_result",
                        "success": False,
                        "issues": ["Invalid message type"]
                    }
                    await websocket.send_json(response)

            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Proctoring error: {str(e)}", exc_info=True)
                response = {
                    "type": "proctoring_result",
                    "success": False,
                    "issues": [f"System error: {str(e)}"]
                }
                await websocket.send_json(response)

    finally:
        verifier.face_mesh.close()
