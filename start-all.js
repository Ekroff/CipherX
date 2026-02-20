// ============================================
// CipherX – Start All Services (Development)
// ============================================
const { spawn, execSync } = require('child_process');
const path = require('path');

require('dotenv').config();

// Build @cipherx/common first — all services depend on it
console.log('📦 Building @cipherx/common...');
try {
  execSync('npm run build', {
    cwd: path.join(__dirname, 'packages', 'common'),
    stdio: 'inherit',
  });
  console.log('✅ @cipherx/common built successfully.\n');
} catch (err) {
  console.error('❌ Failed to build @cipherx/common:', err.message);
  process.exit(1);
}

const services = [
  { name: 'auth-service', port: process.env.AUTH_SERVICE_PORT || 3001, emoji: '🔐' },
  { name: 'scanner-service', port: process.env.SCANNER_SERVICE_PORT || 3002, emoji: '🔎' },
  { name: 'risk-engine', port: process.env.RISK_ENGINE_PORT || 3003, emoji: '🧠' },
  { name: 'remediation-service', port: process.env.REMEDIATION_SERVICE_PORT || 3004, emoji: '🧩' },
  { name: 'gatekeeper-service', port: process.env.GATEKEEPER_SERVICE_PORT || 3005, emoji: '🛑' },
  { name: 'compliance-service', port: process.env.COMPLIANCE_SERVICE_PORT || 3006, emoji: '📊' },
  { name: 'api-gateway', port: process.env.PORT || 3000, emoji: '🚀' },
  { name: 'frontend', port: process.env.FRONTEND_PORT || 5173, emoji: '🌐', cmd: 'npm', args: ['run', 'dev'] },
];

console.log('');
console.log('============================================');
console.log('  CipherX – Starting All Services');
console.log('============================================');
console.log('');

const processes = [];

services.forEach((svc, i) => {
  setTimeout(() => {
    const svcDir = path.join(__dirname, 'packages', svc.name);
    const spawnCmd = svc.cmd || 'npx';
    const spawnArgs = svc.args || ['ts-node-dev', '--respawn', '--transpile-only', 'src/index.ts'];
    const child = spawn(spawnCmd, spawnArgs, {
      cwd: svcDir,
      shell: true,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) console.log(`[${svc.name}] ${line}`);
      });
    });

    child.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim() && !line.includes('Using ts-node') && !line.includes('Compilation')) {
          console.log(`[${svc.name}] ${line}`);
        }
      });
    });

    child.on('error', (err) => {
      console.error(`[${svc.name}] Failed to start: ${err.message}`);
    });

    child.on('exit', (code) => {
      if (code !== null && code !== 0) {
        console.error(`[${svc.name}] Exited with code ${code}`);
      }
    });

    processes.push(child);
  }, i * 2000); // Stagger starts by 2 seconds
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down all services...');
  processes.forEach(p => p.kill());
  process.exit(0);
});

process.on('SIGTERM', () => {
  processes.forEach(p => p.kill());
  process.exit(0);
});
