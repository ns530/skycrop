# SkyCrop ML Service - Dockerfile (Sprint 3)
# NOTE: CPU baseline by default. For optional GPU variant, see ARG ENABLE_GPU below.
FROM python:3.11-slim

ARG ENABLE_GPU=false
# If you want to build a GPU variant in future:
# - Set ENABLE_GPU=true at build time and switch base image to an NVIDIA CUDA runtime
# - Example (not implemented here):
#   FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04
#   # and install onnxruntime-gpu instead of onnxruntime
# TODO(sprint4): Provide dedicated GPU Dockerfile or multi-stage build with CUDA + ORT GPU.

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/ml-service

# Install dependencies first (cache-friendly)
COPY requirements.txt /opt/ml-service/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . /opt/ml-service

# Runtime env defaults (can be overridden by compose)
ENV ML_PORT=80 \
    MODEL_NAME=unet \
    MODEL_VERSION=1.0.0 \
    ORT_PROVIDERS=CPUExecutionProvider

EXPOSE 80

# Gunicorn w/ gthread worker, 60s timeout as per contract
CMD ["gunicorn", "wsgi:app", "-w", "2", "-k", "gthread", "-t", "60", "-b", "0.0.0.0:80"]