FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY damage_detector.py .
COPY image_quality.py .
COPY annotator.py .
COPY yolov8_damage.pt .

EXPOSE 5002

ENV PORT=5002

CMD ["python", "app.py"]
