const express = require('express');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// This is crucial! GitHub sends payloads as JSON. 
// This middleware allows Express to read the req.body
app.use(express.json());

// For testing purposes, you can also add a simple route to check if the server is running
app.get('/', (req, res) => {
    res.send('Deployment Manager is up and running!');
});

// Route all /webhook requests to our dedicated router
app.use('/webhook', webhookRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Deployment Manager running on port ${PORT}`);
});

