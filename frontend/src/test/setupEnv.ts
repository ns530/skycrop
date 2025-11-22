process.env.NODE_ENV = 'test';

// Set Vite environment variables for tests
process.env.VITE_API_BASE_URL = 'http://localhost:3000/api/v1';
process.env.MODE = 'test';
process.env.DEV = 'false';
process.env.PROD = 'false';
process.env.SSR = 'false';