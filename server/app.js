const express = require('express');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const localtunnel = require('localtunnel');

const config = require('./config');
const persistence = require('./utils/persistence');
const { deploy } = require('./services/deployService');
const deploymentsRouter = require('./routes/deployments');
const webhookRouter = require('./routes/webhook');

const app = express();

// Ensure clones directory exists at startup
const clonesDir = path.join(__dirname, '../clones');
if (!fs.existsSync(clonesDir)) fs.mkdirSync(clonesDir, { recursive: true });

// Capture raw body for webhook signature verification (GitHub HMAC)
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api/deployments', deploymentsRouter);
app.use('/webhook', webhookRouter);

app.get('/api/tunnel-password', async (req, res) => {
    try {
        // localtunnel uses your public IPv4 as the password.
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) throw new Error('Failed to resolve public IP');
        const data = await response.json();
        res.json({ password: data.ip });
    } catch (e) {
        res.status(500).json({ error: e.message || 'Failed to get tunnel password' });
    }
});

app.post('/deploy-guest', async (req, res) => {
    // Keep this endpoint for the UI, but use the new /api/deployments pipeline.
    // The UI will poll /api/deployments/:id until status becomes live/failed.
    const { repoUrl, envContent } = req.body || {};
    res.status(202).json({
        repoUrl,
        env: envContent,
        next: {
            method: 'POST',
            url: '/api/deployments',
            body: { repoUrl, env: envContent },
        },
    });
});

app.get('/healthz', (req, res) => {
    res.status(200).json({ ok: true });
});

app.get('/history', (req, res) => {
    res.json(persistence.getHistory());
});

app.listen(config.port, () => {
    console.log(`🚀 Manager live on http://localhost:${config.port}`);
});