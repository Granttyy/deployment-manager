require('dotenv').config();

const config = {
  // Server Port for the Manager itself
  port: process.env.PORT || 3000,

  // Webhook Security
  webhookSecret: process.env.WEBHOOK_SECRET || 'fallback_secret_change_me',

  // Docker Configuration
  docker: {
    imageName: process.env.IMAGE_NAME || 'my-devops-app',
    containerName: process.env.CONTAINER_NAME || 'my-running-app',
    
    // The port the outside world sees : The port your Node app listens on inside Docker
    portMapping: process.env.PORT_MAPPING || '8080:3000',
  },

  // Deployment Logic
  deploy: {
    branch: process.env.DEPLOY_BRANCH || 'refs/heads/main',
  },

  // Environment State
  isProduction: process.env.NODE_ENV === 'production',
};

// Quick validation to warn you if secrets are missing
if (!process.env.WEBHOOK_SECRET) {
  console.warn('⚠️ WARNING: WEBHOOK_SECRET is not set in .env. Security is compromised!');
}

module.exports = config;