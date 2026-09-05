process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "mysql://unused:unused@localhost:3306/unused";
process.env.JWT_SECRET = "test-only-jwt-secret-that-is-at-least-32-characters";
process.env.RESEND_API_KEY = "test-resend-key";
process.env.MIDTRANS_SERVER_KEY = "test-midtrans-server-key";
process.env.MIDTRANS_CLIENT_KEY = "test-midtrans-client-key";
process.env.FRONTEND_URL = "http://localhost:3000";
