// ============================================
// CipherX – Gatekeeper Service: Entry Point
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import gatekeeperRoutes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.GATEKEEPER_SERVICE_PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/gatekeeper', gatekeeperRoutes);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'gatekeeper-service', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🛑 CipherX Gatekeeper Service running on port ${PORT}`);
});

export default app;
