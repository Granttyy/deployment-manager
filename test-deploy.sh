#!/bin/bash

# 1. Configuration
SMEE_URL="https://smee.io/deployment-manager"
WEBHOOK_SECRET="MySuperSecret123"

# 2. The Data (No spaces between keys/values for max consistency)
PAYLOAD='{"ref":"refs/heads/main","repository":{"name":"deployment-manager-test"}}'

# 3. Calculate Signature
# We use printf to ensure NO trailing newline is added to the string before hashing
SIGNATURE=$(printf '%s' "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | awk '{print $NF}')

echo "📡 Sending to $SMEE_URL..."
echo "🔑 Signature: $SIGNATURE"

# 4. Execute Curl
curl -X POST "$SMEE_URL" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  -d "$PAYLOAD"

echo -e "\n✅ Done."