/**
 * Sets required environment variables before any integration test modules load.
 * This file runs as part of jest-integration.json setupFilesAfterFramework.
 */

// These must be set before NestJS modules initialize
process.env.JWT_SECRET = 'integration-test-secret-at-least-32-chars';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.FRONTEND_URL = 'http://localhost:4000';
process.env.NODE_ENV = 'test';
