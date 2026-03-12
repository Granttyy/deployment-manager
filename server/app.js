const express = require('express');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// This is crucial! GitHub sends payloads as JSON. 
// This middleware allows Express to read the req.body
app.use(express.json());

// Route all /webhook requests to our dedicated router
app.use('/webhook', webhookRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Deployment Manager running on port ${PORT}`);
});