module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    // Sprint 2 + Sprint 3 scope: include health indices and recommendation services coverage
    'src/services/field.service.js',
    'src/services/satellite.service.js',
    'src/services/mlGateway.service.js',
    'src/services/weather.service.js',
    'src/services/health.service.js',
    // Sprint 3 Recommendation Engine
    'src/services/recommendation.service.js',
    'src/api/controllers/recommendation.controller.js',
    'src/api/routes/recommendation.routes.js',

    'src/api/controllers/field.controller.js',
    'src/api/controllers/satellite.controller.js',
    'src/api/controllers/ml.controller.js',
    'src/api/controllers/weather.controller.js',
    'src/api/routes/field.routes.js',
    'src/api/routes/satellite.routes.js',
    'src/api/routes/ml.routes.js',
    'src/api/routes/weather.routes.js',
    'src/errors/custom-errors.js',
  ],
  // Exclude files outside Sprint 2 scope that are auto-required by app bootstrap
  coveragePathIgnorePatterns: [
    '<rootDir>/src/app.js',
    '<rootDir>/src/server.js',
    '<rootDir>/src/api/middleware/',
    '<rootDir>/src/config/',
    '<rootDir>/src/models/',
    '<rootDir>/src/utils/',
    '<rootDir>/src/api/controllers/(auth|health|fieldHealth)\\.controller\\.js',
    '<rootDir>/src/api/routes/(auth|health|fieldHealth)\\.routes\\.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text-summary', 'lcov'],
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/load/', // Exclude k6 load tests (they use ES modules for k6)
  ],
  moduleFileExtensions: ['js', 'json'],
  verbose: false,
};
