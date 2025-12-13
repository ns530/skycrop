// Manual mock for bull module
module.exports = jest.fn().mockImplementation(() => ({
  add: jest.fn(),
  process: jest.fn(),
  on: jest.fn(),
  close: jest.fn(),
  getJob: jest.fn(),
  getJobs: jest.fn(),
}));
