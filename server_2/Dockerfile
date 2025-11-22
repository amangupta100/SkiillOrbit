# ---------- Base Image ----------
FROM python:3.10-bullseye

# ---------- Set Working Directory ----------
WORKDIR /app

# ---------- Environment ----------
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive
ENV TESSERACT_CMD=/usr/bin/tesseract

# ---------- Install System Dependencies ----------
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    g++ \
    cmake \
    ffmpeg \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# ---------- Copy and Install Python Packages ----------
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.txt

# ---------- Copy Source Code and .env ----------
COPY . . 

# ---------- Expose Port ----------
EXPOSE 8000

# ---------- Run FastAPI ----------
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]