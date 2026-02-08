FROM python:3.11-slim

WORKDIR /app

COPY inference/requirements.txt /app/inference/requirements.txt
RUN pip install --no-cache-dir -r /app/inference/requirements.txt

COPY inference/app /app/inference/app

WORKDIR /app/inference

ENV INFERENCE_SERVICE_VERSION=0.1.0

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
