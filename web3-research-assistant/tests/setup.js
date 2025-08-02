// Global test timeout
jest.setTimeout(30000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JULIAOS_API_KEY = 'test_api_key';
process.env.JULIAOS_API_URL = 'https://mock-api.juliaos.com';

// Suppress console output during tests
const originalLog = console.log;
const originalError = console.error;

beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
});

afterAll(() => {
    console.log = originalLog;
    console.error = originalError;
});

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
});