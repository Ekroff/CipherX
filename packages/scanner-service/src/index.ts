// ============================================
// CipherX – Scanner Service: Entry Point
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import scannerRoutes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.SCANNER_SERVICE_PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large payloads for file contents

app.use('/scanner', scannerRoutes);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'scanner-service', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🔎 CipherX Scanner Service running on port ${PORT}`);
});

export default app;
