# Use official Python image
FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Prevent Python from writing pyc files & buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential

# Upgrade pip and install dependencies with relaxed resolver
COPY requirements.txt .
RUN pip install --upgrade pip setuptools wheel \
    && pip install --no-cache-dir --use-deprecated=legacy-resolver --ignore-installed -r requirements.txt

# Copy project files
COPY . .

# Expose port (Render will inject $PORT automatically)
EXPOSE 8000

# Run FastAPI with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${PORT}"]
