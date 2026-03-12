const express = require('express');
const router = express.Router();
// 1. Import the service we just wrote
const { deploy } = require('../services/deployService');

router.post('/', (req, res) => {
    const payload = req.body;
    const branch = payload.ref;
    const repoName = payload.repository?.name;

    if (branch === 'refs/heads/main') {
        // 2. Trigger the deployment logic!
        deploy(repoName);
        
        res.status(202).send('Deployment initiated');
    } else {
        res.status(200).send('Ignored: Not main branch');
    }
});

module.exports = router;