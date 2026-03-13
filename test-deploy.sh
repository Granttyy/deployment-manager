#!/bin/bash

# 1. Configuration
SMEE_URL="${SMEE_URL:-https://smee.io/deployment-manager}"
WEBHOOK_SECRET="${WEBHOOK_SECRET:-MySuperSecret123}"

if [[ -z "$WEBHOOK_SECRET" ]]; then
    echo "❌ WEBHOOK_SECRET is not set."
    echo "   Set it to match your server .env, e.g.:"
    echo "   WEBHOOK_SECRET='your_secret' bash test-deploy.sh"
    exit 1
fi

# 2. Payload
PAYLOAD='{"ref":"refs/heads/main","repository":{"name":"deployment-manager"}}'

# 3. Calculate HMAC-SHA256 signature
SIGNATURE=$(printf '%s' "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/.*= //')

echo "📡 Sending to: $SMEE_URL"
echo "🔑 Signature:  sha256=$SIGNATURE"

# 4. Send request
curl -sS -X POST "$SMEE_URL" \
    -H "Content-Type: application/json" \
    -H "X-GitHub-Event: push" \
    -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
    -d "$PAYLOAD"

echo -e "\n✅ Done."