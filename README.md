# SkyCrop

## Overview
SkyCrop is a comprehensive ML-powered agricultural platform designed for precision farming. This repository contains the backend API, ML service, and training infrastructure.

## Repository Structure

### Backend
- **Backend API**: RESTful API for field management, satellite data processing, and ML gateway
- **Technologies**: Node.js, Express, PostgreSQL, MongoDB, Redis
- **Testing**: Comprehensive unit and integration tests with Jest

### ML Service
- **ML Inference API**: Production-ready ML service for:
  - Field boundary detection (U-Net)
  - Yield prediction (Random Forest)  
  - Disaster impact analysis
- **Technologies**: Python, Flask, ONNX Runtime, OpenCV
- **Integration**: Direct ONNX model consumption

### ML Training
- **Training Pipeline**: TensorFlow/Keras U-Net training
- **Data Processing**: Satellite imagery tiling and augmentation
- **Model Export**: ONNX format for production deployment
- **Features**: Automated training with validation and early stopping

## Development

### Backend Setup
```bash
cd backend
npm install
npm test
npm start
```

### ML Service Setup
```bash
cd ml-service
pip install -r requirements.txt
python main.py
```

### ML Training Setup
```bash
cd ml-training
pip install -r requirements.txt
python train_unet.py --config config.yaml
```

## Architecture

The system follows a microservices architecture:
- **Backend**: Handles user management, field CRUD, external API integration
- **ML Service**: Provides AI inference capabilities  
- **ML Training**: Handles model training and deployment
- **Database**: Polyglot persistence (PostgreSQL + PostGIS, MongoDB, Redis)

## API Documentation

Backend API follows OpenAPI 3.0 specification. See `backend/src/api/openapi.yaml` for details.

ML Service provides RESTful endpoints for:
- `POST /api/v1/ml/segmentation/predict` - Field boundary detection
- `POST /api/v1/ml/yield/predict` - Yield prediction
- `POST /api/v1/ml/disaster/analyze` - Disaster impact analysis

## Testing

- **Backend**: `npm test` (unit + integration tests)
- **ML Service**: `pytest` (comprehensive test suite)
- **ML Training**: `pytest` (unit tests for training pipeline)

## Deployment

### Docker Compose
All services can be deployed together:
```bash
docker-compose up
```

### Individual Services
Each service has its own Dockerfile and can be deployed independently.

## Features

- **Field Management**: Create, update, delete fields with GPS boundaries
- **Satellite Data**: Integration with Sentinel Hub for satellite imagery
- **AI/ML**: Field boundary detection, yield prediction, disaster analysis
- **Weather Integration**: Historical and forecast weather data
- **Health Monitoring**: NDVI, NDWI, TDVI calculation and tracking
- **Recommendations**: Automated farming recommendations based on satellite data

## Contributing

Please follow the existing code style and add tests for new features. Run all tests before submitting PRs.

## License

This project is licensed under the MIT License.
