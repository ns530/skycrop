# SkyCrop

> **🎉 Sprint 3 COMPLETE! All intelligent farming APIs delivered and production-ready!**  
> See [Sprint 3 Final Summary](backend/docs/SPRINT3_FINAL_SUMMARY.md) for full details.
> 
> **🎉 Sprint 4 COMPLETE! Mobile app & web dashboard fully functional!**  
> - ✅ Mobile app (React Native) - All features complete (32 E2E tests)
> - ✅ Web dashboard (React) - All features complete (50 E2E tests)
> - ✅ Real-time features (WebSocket, notifications)
> - ✅ Multi-user support (RBAC, team management, field sharing)
> - ✅ Performance optimized (4.2s mobile load, 92 Lighthouse score)
> See [Sprint 4 Final Summary](Doc/Development Phase/SPRINT4_FINAL_SUMMARY.md) for full details.
>
> **🚀 Sprint 5 PLANNED! Ready to launch to production!**  
> - 🧪 Beta testing & feedback
> - 🐛 Bug fixes & stability
> - ✨ UX/UI polish
> - 🚀 Production deployment (iOS, Android, Web)
> - 📊 Monitoring & analytics
> See [Sprint 5 Overview](Doc/Development Phase/SPRINT5_OVERVIEW.md) for the launch plan.

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

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration:
#   - DATABASE_URL (PostgreSQL)
#   - REDIS_URL (Redis)
#   - OPENWEATHER_API_KEY (Weather data)
#   - SENTRY_DSN (Error tracking, optional)
#   - EMAIL_PROVIDER (sendgrid/aws-ses/console)
#   - PUSH_PROVIDER (fcm/console)

# Run tests
npm test

# Run in development mode
npm run dev

# Run in production mode
npm start
```

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT token signing
- `OPENWEATHER_API_KEY` - OpenWeather API key

**Optional (Notifications):**
- `EMAIL_PROVIDER` - Email provider: `sendgrid`, `aws-ses`, or `console`
- `SENDGRID_API_KEY` - SendGrid API key (if using SendGrid)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` - AWS credentials (if using SES)
- `PUSH_PROVIDER` - Push notification provider: `fcm` or `console`
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON (if using FCM)

**Optional (Monitoring):**
- `SENTRY_DSN` - Sentry DSN for error tracking
- `NODE_ENV` - Environment: `development`, `staging`, or `production`

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

Backend API follows **OpenAPI 3.1 specification**. See `backend/src/api/openapi.yaml` for full details.

### Sprint 3 API Endpoints

#### Health Monitoring API
- `GET /api/v1/fields/{fieldId}/health/history` - Get health history with trends

#### Recommendation Engine API
- `POST /api/v1/fields/{fieldId}/recommendations/generate` - Generate recommendations
- `GET /api/v1/fields/{fieldId}/recommendations` - List field recommendations
- `GET /api/v1/recommendations` - List all user recommendations
- `PATCH /api/v1/recommendations/{id}/status` - Update recommendation status
- `DELETE /api/v1/recommendations/{id}` - Delete recommendation

#### Yield Prediction API
- `POST /api/v1/fields/{fieldId}/yield/predict` - Generate yield prediction
- `GET /api/v1/fields/{fieldId}/yield/predictions` - List historical predictions
- `POST /api/v1/fields/{fieldId}/yield` - Add actual yield data
- `GET /api/v1/fields/{fieldId}/yield` - List actual yields
- `GET /api/v1/fields/{fieldId}/yield/statistics` - Yield statistics

#### Notification Service API
- `POST /api/v1/notifications/register` - Register device token for push notifications
- `DELETE /api/v1/notifications/unregister` - Unregister device token
- `POST /api/v1/notifications/test` - Send test notification
- `GET /api/v1/notifications/queue/stats` - Get notification queue statistics

### ML Service API
- `POST /api/v1/ml/segmentation/predict` - Field boundary detection
- `POST /api/v1/ml/yield/predict` - Yield prediction
- `POST /api/v1/ml/disaster/analyze` - Disaster impact analysis

## Testing

### Backend Testing (104+ tests)
```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm test -- unit               # Unit tests only
npm test -- integration        # Integration tests only
npm test -- e2e.real.test.js  # End-to-end tests
npm test -- concurrent-load    # Performance tests
```

**Test Coverage:**
- 51+ unit tests
- 27+ integration tests
- 21 E2E tests
- 5 performance tests

**Test Results:** ✅ All passing

### Performance Testing
```bash
# k6 load testing (requires k6 installation)
cd backend/tests/load
k6 run k6-load-test.js

# Apache Bench (quick tests)
chmod +x ab-test.sh
./ab-test.sh
```

### ML Service Testing
```bash
cd ml-service
pytest
```

### ML Training Testing
```bash
cd ml-training
pytest
```

## Deployment

### Docker Compose
All services can be deployed together:
```bash
docker-compose up
```

### Individual Services
Each service has its own Dockerfile and can be deployed independently.

## Features

### Core Features
- **Field Management**: Create, update, delete fields with GPS boundaries
- **Satellite Data**: Integration with Sentinel Hub for satellite imagery
- **AI/ML**: Field boundary detection, yield prediction, disaster analysis
- **Weather Integration**: Historical and forecast weather data (OpenWeather API)

### Sprint 3 Features (Intelligent Farming APIs) ✨
- **Health Monitoring API**: 
  - Time-series NDVI/NDWI/TDVI analysis
  - Health score calculation (0-100)
  - Trend detection (improving/declining/stable)
  - Anomaly detection with severity classification
  - Historical health tracking with caching
  
- **Recommendation Engine API**:
  - Rule-based recommendation generation
  - Fertilizer recommendations (NPK analysis)
  - Irrigation recommendations (water stress detection)
  - Pest & disease control recommendations
  - Health inspection recommendations
  - Priority scoring (low/medium/high/critical)
  
- **Yield Prediction API**:
  - ML-powered yield predictions using Random Forest
  - Confidence intervals (lower/upper bounds)
  - Revenue estimation based on market price
  - Harvest date estimation
  - Historical prediction tracking with accuracy metrics
  
- **Notification Service**:
  - Email notifications (SendGrid/AWS SES/Console)
  - Push notifications (Firebase Cloud Messaging)
  - Async queue processing (Bull + Redis)
  - Device token management
  - Health alerts, recommendation alerts, yield prediction alerts

## Contributing

Please follow the existing code style and add tests for new features. Run all tests before submitting PRs.

## License

This project is licensed under the MIT License.
