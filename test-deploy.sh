#!/bin/bash

# --- Configuration ---
SMEE_URL="https://smee.io/deployment-manager"
REPO_NAME="deployment-manager-test"

echo "------------------------------------------------"
echo "📡 Sending Fake Push Event to Smee.io..."
echo "🔗 Target: $SMEE_URL"
echo "------------------------------------------------"

# This sends the POST request mimicking GitHub's structure
curl -X POST "$SMEE_URL" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d "{
    \"ref\": \"refs/heads/main\",
    \"repository\": {
      \"name\": \"$REPO_NAME\"
    },
    \"pusher\": {
      \"name\": \"LocalDevUser\"
    }
  }"

echo -e "\n\n✅ Webhook sent! Switch to your Node.js terminal to see the Docker logs."