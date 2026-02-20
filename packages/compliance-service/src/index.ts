// ============================================
// CipherX – Compliance Service: Entry Point
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import complianceRoutes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.COMPLIANCE_SERVICE_PORT || 3006;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/compliance', complianceRoutes);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'compliance-service', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`📊 CipherX Compliance Service running on port ${PORT}`);
});

export default app;
