// Mock all dependencies
jest.mock('dotenv');
jest.mock('http');
jest.mock('../../src/config/database.config');
jest.mock('../../src/utils/logger');
jest.mock('../../src/scripts/migrate');
jest.mock('../../src/jobs');
jest.mock('../../src/websocket/server');

// Mock models to prevent database initialization
jest.mock('../../src/models', () => ({}));

// Mock the app as an express app
const mockApp = {};
jest.mock('../../src/app', () => mockApp);

const http = require('http');
const { _initDatabase } = require('../../src/config/database.config');
const { logger } = require('../../src/utils/logger');
const { _runMigrations } = require('../../src/scripts/migrate');
const { _initializeJobs, _startJobs, stopJobs } = require('../../src/jobs');
const { initializeWebSocket } = require('../../src/websocket/server');

// Mock server instance
const mockServer = {
  listen: jest.fn(),
  close: jest.fn(callback => {
    if (callback) callback();
  }),
  on: jest.fn(),
};
http.createServer.mockReturnValue(mockServer);

// Mock WebSocket
const mockIO = {
  close: jest.fn(),
};
initializeWebSocket.mockReturnValue(mockIO);

// Mock logger
logger.info = jest.fn();
logger.warn = jest.fn();
logger.error = jest.fn();

// Mock process.env
process.env.PORT = '3000';
process.env.NODE_ENV = 'test';

describe('Server', () => {
  let originalExit;
  let originalOn;

  beforeAll(() => {
    jest.useFakeTimers();
    // Mock process.exit
    originalExit = process.exit;
    process.exit = jest.fn();
    // Mock process.on
    originalOn = process.on;
    process.on = jest.fn();

    // Import server after mocks are set up
    require('../../src/server');
  });

  afterAll(() => {
    process.exit = originalExit;
    process.on = originalOn;
    jest.useRealTimers();
  });

  describe('start function', () => {
    test('starts server on specified port', () => {
      // Verify server.listen was called with correct port
      expect(mockServer.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    });

    test('initializes WebSocket server', () => {
      expect(initializeWebSocket).toHaveBeenCalledWith(mockServer);
      expect(logger.info).toHaveBeenCalledWith('WebSocket server initialized');
    });

    test('sets up signal handlers', () => {
      expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });
  });

  describe('shutdown function', () => {
    test('stops jobs and closes WebSocket on SIGTERM', () => {
      // Import to trigger the process.on setup
      require('../../src/server');

      // Get the shutdown handler
      const shutdownHandler = process.on.mock.calls.find(call => call[0] === 'SIGTERM')[1];

      shutdownHandler();

      expect(stopJobs).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Closing WebSocket connections...');
      expect(mockIO.close).toHaveBeenCalled();
      expect(mockServer.close).toHaveBeenCalled();
    });

    test('stops jobs and closes WebSocket on SIGINT', () => {
      require('../../src/server');

      const shutdownHandler = process.on.mock.calls.find(call => call[0] === 'SIGINT')[1];

      shutdownHandler();

      expect(stopJobs).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Closing WebSocket connections...');
      expect(mockIO.close).toHaveBeenCalled();
      expect(mockServer.close).toHaveBeenCalled();
    });

    test('logs shutdown signal', () => {
      require('../../src/server');

      const shutdownHandler = process.on.mock.calls.find(call => call[0] === 'SIGTERM')[1];

      shutdownHandler();

      expect(logger.warn).toHaveBeenCalledWith(
        '[%s] received. Shutting down gracefully...',
        'SIGTERM'
      );
    });

    test('closes WebSocket and logs', () => {
      require('../../src/server');

      const shutdownHandler = process.on.mock.calls.find(call => call[0] === 'SIGTERM')[1];

      shutdownHandler();

      expect(logger.info).toHaveBeenCalledWith('Closing WebSocket connections...');
      expect(mockIO.close).toHaveBeenCalledWith(expect.any(Function));
    });

    test('closes HTTP server and exits', () => {
      require('../../src/server');

      const shutdownHandler = process.on.mock.calls.find(call => call[0] === 'SIGTERM')[1];

      shutdownHandler();

      expect(mockServer.close).toHaveBeenCalledWith(expect.any(Function));
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    test('forces exit on timeout', () => {
      // Mock server.close to not call callback immediately
      mockServer.close.mockImplementationOnce(() => {});

      require('../../src/server');

      const shutdownHandler = process.on.mock.calls.find(call => call[0] === 'SIGTERM')[1];

      shutdownHandler();

      // Fast-forward timers
      jest.runOnlyPendingTimers();

      expect(logger.error).toHaveBeenCalledWith('Forcing shutdown due to timeout.');
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});
