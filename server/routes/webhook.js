const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { deploy } = require('../services/deployService');
const config = require('../config');

const verifySignature = (req, res, next) => {
    const signature = req.headers['x-hub-signature-256'];
    // This pulls 'MySuperSecret123' from your .env via config.js
    const secret = config.webhookSecret; 

    if (!signature) {
        console.error("⚠️ Rejected: No signature header found.");
        return res.status(401).send('No signature');
    }

    // We use the rawBody buffer we captured in app.js
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

    const trusted = Buffer.from(digest, 'ascii');
    const untrusted = Buffer.from(signature, 'ascii');

    if (trusted.length !== untrusted.length || !crypto.timingSafeEqual(trusted, untrusted)) {
        console.error("❌ Signature Mismatch!");
        console.error(`Expected: ${digest}`);
        console.error(`Received: ${signature}`);
        return res.status(403).send('Invalid signature');
    }

    console.log("🔒 Signature Verified!");
    next();
};

router.post('/', verifySignature, (req, res) => {
    const { ref, repository } = req.body;
    
    // Check if branch matches 'refs/heads/main'
    if (ref === config.deploy.branch) {
        // Update the status dashboard
        req.app.locals.deploymentStatus = {
            lastDeploy: new Date().toLocaleString(),
            status: '⏳ In Progress',
            repo: repository?.name || 'deployment-manager-test'
        };

        deploy(repository?.name, (success) => {
            req.app.locals.deploymentStatus.status = success ? '✅ Success' : '❌ Failed';
        });

        res.status(202).send('Deployment Started');
    } else {
        console.log(`ℹ️ Ignored branch: ${ref}`);
        res.status(200).send('Not main branch');
    }
});

module.exports = router;