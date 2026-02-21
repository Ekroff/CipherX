// ============================================
// CipherX – Auth Service: Entry Point
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.AUTH_SERVICE_PORT || 3001;

// --- Security Middleware ---
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting for auth endpoints
app.use('/auth', rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 50,                    // 50 requests per window
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests. Try again later.' } },
    standardHeaders: true,
    legacyHeaders: false,
}));

// --- Routes ---
app.use('/auth', authRoutes);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🔐 CipherX Auth Service running on port ${PORT}`);
});

export default app;
