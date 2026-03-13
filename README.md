# 🚀 CloudDeploy — DevOps Deployment Manager

CloudDeploy is a lightweight **deployment automation platform** that allows developers to instantly deploy Dockerized applications by simply pasting a **GitHub repository URL**.

It acts as a mini **CI/CD deployment system**, automatically cloning repositories, building Docker images, and running containers. CloudDeploy can also listen to **GitHub webhook events** to rebuild and redeploy applications whenever new code is pushed.

This project demonstrates **DevOps concepts such as deployment automation, containerization, webhook-driven CI/CD pipelines, and infrastructure orchestration.**

---

# ✨ Features

### Instant Repository Deployment

Deploy an application by pasting a GitHub repository URL into the web interface.

CloudDeploy will automatically:

* Clone the repository
* Build the Docker image
* Run the container
* Expose the running application

---

### Automated CI/CD with Webhooks

CloudDeploy can listen for **GitHub push events** and automatically redeploy applications when new commits are pushed to the repository.

---

### Docker-based Deployment

Every application is deployed inside a **Docker container**, ensuring consistent environments and reproducible builds.

---

### Deployment History & Logging

The system keeps track of previous deployments and logs so you can monitor deployment activity.

---

# 🧰 Tech Stack

| Category         | Technology          |
| ---------------- | ------------------- |
| Backend          | Node.js, Express.js |
| Containerization | Docker              |
| Version Control  | Git                 |
| CI/CD Trigger    | GitHub Webhooks     |
| Webhook Testing  | Smee.io             |
| Runtime          | Node.js             |

---

# 📦 Project Structure

```
deployment-manager/
│
├── clones/                  # Temporary storage for cloned repositories
│
├── public/                  # Web UI assets
│
├── routes/
│   ├── deployments.js       # API endpoints for deployments
│   └── webhook.js           # GitHub webhook listener
│
├── services/
│   └── deployService.js     # Handles cloning, Docker build, and container startup
│
├── utils/
│   ├── notifier.js          # Deployment status notifications
│   └── persistence.js       # Handles reading/writing deployment history
│
├── server/                  # Server configuration
│
├── app.js                   # Main application entry point
├── config.js                # Environment configuration
├── history.json             # Deployment history database
├── Dockerfile               # Docker image for CloudDeploy
├── test-deploy.sh           # Script for testing deployments
└── package.json
```

---

# 🛠 Prerequisites

Make sure the following tools are installed on your system:

* **Node.js (v18+)**
* **Docker Engine**
* **Git**

### Windows Users

Enable **WSL2 backend for Docker Desktop**.

---

# 🚀 Installation

## 1 Clone the Repository

```
git clone https://github.com/yourusername/clouddeploy.git
cd deployment-manager
```

---

## 2 Install Dependencies

```
npm install
```

---

## 3 Configure Environment Variables

Create a `.env` file in the project root.

```
PORT=3000
IMAGE_NAME=my-devops-app
CONTAINER_NAME=my-running-app
HOST_PORT=8080
TARGET_BRANCH=refs/heads/main
WEBHOOK_SECRET=MySuperSecret123 //change this in production
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/
```

---

## 4 Start the Server

```
npm start
```

The deployment manager will start at:

```
http://localhost:3000
```

---

# 🌐 Deploying an Application

Using the web interface:

1. Open the CloudDeploy dashboard
2. Paste a **GitHub repository URL**
3. Click **Deploy**

CloudDeploy will automatically:

```
Git Clone
   ↓
Docker Build
   ↓
Docker Run
   ↓
Application Live
```

---

# 🔌 API Reference

### Create Deployment

```
POST /api/deployments
```

Example request:

```json
{
  "repoUrl": "https://github.com/user/project",
  "env": "PORT=3000\nDATABASE_URL=example"
}
```

---

### Get Deployment Status

```
GET /api/deployments/:id
```

---

### View Deployment Logs

```
GET /api/deployments/:id/logs
```

---

### View Deployment History

```
GET /history
```

---

### Stop a Deployment

```
POST /api/deployments/:id/stop
```

---

# 🔗 GitHub Webhook Setup

CloudDeploy can automatically redeploy applications when code is pushed.

## Steps

Go to your GitHub repository:

```
Settings → Webhooks → Add Webhook
```

Configure:

Payload URL

```
https://your-manager-url/api/webhook
```

Content Type

```
application/json
```

Secret

```
Same value as WEBHOOK_SECRET
```

Events

```
Just the push event
```

---

# 🧪 Local Webhook Testing

GitHub cannot send webhooks directly to `localhost`, so use **Smee.io**.

Start the Smee client:

```
npx smee-client \
--url https://smee.io/your-id \
--target http://localhost:3000/api/webhook
```

---

# 🧪 Simulating a Deployment

You can test deployments without GitHub using:

```
bash test-deploy.sh
```

---

# 📈 Future Improvements

* Multi-container deployments with Docker Compose
* Live deployment logs
* Deployment dashboard
* Rollback support
* Container health monitoring
* Resource usage tracking

---

# 📜 License

MIT License
