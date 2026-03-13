const express = require('express');
const config = require('./config');
const webhookRoutes = require('./routes/webhook');

const app = express();

// THIS IS THE FIX: It saves the exact bytes GitHub sent
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.locals.deploymentStatus = {
    lastDeploy: 'Never',
    status: 'Idle',
    repo: 'N/A'
};

app.get('/status', (req, res) => {
    res.json({
        manager: "Online",
        uptime: `${Math.floor(process.uptime())}s`,
        lastEvent: app.locals.deploymentStatus
    });
});

app.use('/webhook', webhookRoutes);

app.listen(config.port, () => {
    console.log(`🚀 Manager live on http://localhost:${config.port}`);
});