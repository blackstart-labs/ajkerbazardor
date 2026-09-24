process.env.NODE_ENV = 'test';
process.env.TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || 'file::memory:';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-min-32-characters-long!';
process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.local';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password-12345';
