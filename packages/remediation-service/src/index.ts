// ============================================
// CipherX – Remediation Service: Entry Point
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import remediationRoutes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.REMEDIATION_SERVICE_PORT || 3004;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/remediation', rateLimit({
    windowMs: 60 * 1000,
    max: parseInt(process.env.OPENAI_RATE_LIMIT_RPM || '30'),
    message: { success: false, error: { code: 'RATE_LIMIT', message: 'Remediation rate limit exceeded.' } },
}));

app.use('/remediation', remediationRoutes);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'remediation-service', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🧩 CipherX Remediation Service running on port ${PORT}`);
});

export default app;
