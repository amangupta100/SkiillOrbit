# app/api/routes/overlay_detection.py
import base64
from typing import Optional, Tuple
from io import BytesIO
import cv2
import numpy as np
import pytesseract
from PIL import Image
from fastapi import APIRouter, Header, HTTPException

router = APIRouter(prefix="/overlay", tags=["overlay-detection"])

# Tesseract configuration (adjust path if needed for your server environment)
# pytesseract.pytesseract.tesseract_cmd = r'/usr/bin/tesseract'  # Example for Linux; auto-detected on most systems

def detect_overlay(image: Image.Image) -> Tuple[bool, Optional[Tuple[int, int, int, int]], str]:
    """
    Detects potential AI overlays using color segmentation to find dark boxes
    and then uses OCR to confirm keywords. Returns detection result and base64-encoded processed image.
    """
    try:
        # Convert PIL Image to an OpenCV-compatible BGR format
        cv_image = np.array(image.convert('RGB'))
        cv_image = cv_image[:, :, ::-1].copy()  # RGB to BGR and make a writable copy
    except Exception as e:
        raise ValueError(f"Error converting image for OpenCV: {e}")

    # Color-based segmentation approach (looking for dark rectangles)
    hsv = cv2.cvtColor(cv_image, cv2.COLOR_BGR2HSV)

    # HSV range for very dark/black areas (V <= 100)
    lower_dark = np.array([0, 0, 0])
    upper_dark = np.array([180, 255, 100]) 

    # Create a binary mask to isolate the dark areas
    mask = cv2.inRange(hsv, lower_dark, upper_dark)

    # Find the outlines (contours) of the isolated shapes
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Get a grayscale version of the original image for OCR
    gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
    
    # Calculate minimum area threshold dynamically (1% of total image area)
    min_area_threshold = cv_image.shape[0] * cv_image.shape[1] * 0.01

    detected = False
    coords = None

    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        
        # Filter by size and aspect ratio
        area = w * h
        aspect_ratio = w / h if h > 0 else 0
        
        # Heuristic 1: Must be a substantial size
        if area < min_area_threshold:
             continue

        # Heuristic 2: Must be roughly a rectangle
        if not (0.5 < aspect_ratio < 20):
             continue
        
        # OCR on the potential region
        roi = gray[y:y+h, x:x+w]
        
        # Apply pre-processing: Invert the ROI (Tesseract prefers black text on white)
        inverted_roi = cv2.bitwise_not(roi) 
        
        config = r'--oem 3 --psm 6'  # psm 6: Assume a single uniform block of text
        
        try:
            text = pytesseract.image_to_string(inverted_roi, config=config).lower()
        except pytesseract.TesseractNotFoundError:
            raise RuntimeError("Tesseract Not Found! Ensure Tesseract-OCR is installed and path is configured.")

        # Check if any of the target keywords are in the extracted text
        keywords = ['parakeet', 'cluely', 'final coder', 'summarized question', 'answer question', 'talking points', 'real-time assistance']
        
        if any(keyword in text for keyword in keywords):
            # Draw a green rectangle on the detected area
            cv2.rectangle(cv_image, (x, y), (x + w, y + h), (0, 255, 0), 5)
            detected = True
            coords = (x, y, w, h)
            break  # Stop after first detection (can modify to find all if needed)

    # Encode the processed cv_image (with rect if detected) to base64 PNG
    _, buffer = cv2.imencode('.png', cv_image)
    processed_b64 = base64.b64encode(buffer).decode('utf-8')

    return detected, coords, processed_b64

@router.post("/detect")
async def detect_overlay_endpoint(
    screenshot: str,  # Base64-encoded image in request body (JSON: {"screenshot": "base64_string"})
    socket_id: str = Header(..., alias="X-Socket-ID")  # Socket ID from header
):
    """
    Detect AI overlays in the provided base64 screenshot.
    Expects JSON body: {"screenshot": "base64_string"}
    Header: X-Socket-ID: "socket_id"
    Returns: {"detected": bool, "coords": tuple|None, "processed_screenshot_b64": str, "socket_id": str}
    """
    try:
        # Decode base64 to PIL Image
        img_data = base64.b64decode(screenshot)
        img = Image.open(BytesIO(img_data))
        
        # Detect overlay
        detected, coords, processed_b64 = detect_overlay(img)
        
        return {
            "detected": detected,
            "coords": coords,
            "processed_screenshot_b64": processed_b64,
            "socket_id": socket_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Detection failed: {str(e)}")