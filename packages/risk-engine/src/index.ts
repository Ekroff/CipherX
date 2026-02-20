// ============================================
// CipherX – Risk Engine: Entry Point
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import riskRoutes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.RISK_ENGINE_PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Rate limit AI calls
app.use('/risk', rateLimit({
    windowMs: 60 * 1000,
    max: parseInt(process.env.OPENAI_RATE_LIMIT_RPM || '60'),
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'AI rate limit exceeded.' } },
}));

app.use('/risk', riskRoutes);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'risk-engine', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🧠 CipherX Risk Engine running on port ${PORT}`);
});

export default app;
