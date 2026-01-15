#!/bin/bash
#
# DA (Document Authoring) Publish Script
#
# Uploads HTML content to DA and publishes it to preview/live.
# Uses service account credentials from .env for authentication.
#
# Usage:
#   ./scripts/da-publish.sh <path> <html-file>
#
# Example:
#   ./scripts/da-publish.sh /test-blocks/my-block /tmp/test-page.html
#

set -e

# Check arguments
if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <path> <html-file>"
  echo "Example: $0 /test-blocks/my-block /tmp/test-page.html"
  exit 1
fi

PAGE_PATH="$1"
HTML_FILE="$2"

# Check if HTML file exists
if [ ! -f "$HTML_FILE" ]; then
  echo "Error: HTML file not found: $HTML_FILE"
  exit 1
fi

# Load environment variables from .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

# Source .env file
set -a
source "$ENV_FILE"
set +a

# Verify required credentials
if [ -z "$DA_CLIENT_ID" ] || [ -z "$DA_CLIENT_SECRET" ] || [ -z "$DA_SERVICE_TOKEN" ]; then
  echo "Error: DA credentials not configured in .env"
  echo "Required: DA_CLIENT_ID, DA_CLIENT_SECRET, DA_SERVICE_TOKEN"
  exit 1
fi

# Configuration
ORG="${DA_ORG:-paolomoz}"
REPO="${DA_REPO:-vitamix-gensite}"
IMS_TOKEN_ENDPOINT="https://ims-na1.adobelogin.com/ims/token/v3"
DA_ADMIN_URL="https://admin.da.live"
AEM_ADMIN_URL="https://admin.hlx.page"

echo "=== DA Publish Script ==="
echo "Path: $PAGE_PATH"
echo "File: $HTML_FILE"
echo "Org: $ORG"
echo "Repo: $REPO"
echo ""

# Exchange credentials for access token
echo "=== Exchanging credentials for access token ==="
TOKEN_RESPONSE=$(curl -s -X POST "$IMS_TOKEN_ENDPOINT" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=${DA_CLIENT_ID}" \
  -d "client_secret=${DA_CLIENT_SECRET}" \
  -d "code=${DA_SERVICE_TOKEN}")

# Extract access token
ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"//;s/"//')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Error: Failed to get access token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "Got access token (${#ACCESS_TOKEN} chars)"
echo ""

# Upload to DA
echo "=== Uploading to DA ==="
UPLOAD_URL="${DA_ADMIN_URL}/source/${ORG}/${REPO}${PAGE_PATH}.html"
echo "URL: $UPLOAD_URL"

UPLOAD_RESULT=$(curl -s -w "\n%{http_code}" -X PUT "$UPLOAD_URL" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -F "data=@${HTML_FILE};type=text/html")

HTTP_CODE=$(echo "$UPLOAD_RESULT" | tail -1)
RESPONSE_BODY=$(echo "$UPLOAD_RESULT" | sed '$d')

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
  echo "Error: Upload failed with HTTP $HTTP_CODE"
  echo "Response: $RESPONSE_BODY"
  exit 1
fi

echo "Upload successful (HTTP $HTTP_CODE)"
echo ""

# Trigger preview
echo "=== Triggering preview ==="
PREVIEW_URL="${AEM_ADMIN_URL}/preview/${ORG}/${REPO}/main${PAGE_PATH}"
PREVIEW_RESULT=$(curl -s -w "\n%{http_code}" -X POST "$PREVIEW_URL" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

HTTP_CODE=$(echo "$PREVIEW_RESULT" | tail -1)
if [ "$HTTP_CODE" != "200" ]; then
  echo "Warning: Preview returned HTTP $HTTP_CODE"
fi
echo "Preview triggered"
echo ""

# Wait for preview
echo "=== Waiting for preview... ==="
sleep 3

# Publish to live
echo "=== Publishing to live ==="
LIVE_URL="${AEM_ADMIN_URL}/live/${ORG}/${REPO}/main${PAGE_PATH}"
LIVE_RESULT=$(curl -s -w "\n%{http_code}" -X POST "$LIVE_URL" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

HTTP_CODE=$(echo "$LIVE_RESULT" | tail -1)
if [ "$HTTP_CODE" != "200" ]; then
  echo "Warning: Publish returned HTTP $HTTP_CODE"
fi
echo "Published"
echo ""

# Done
echo "=== Done! ==="
echo ""
echo "Preview: https://main--${REPO}--${ORG}.aem.page${PAGE_PATH}"
echo "Live:    https://main--${REPO}--${ORG}.aem.live${PAGE_PATH}"
echo "Edit:    https://da.live/edit#/${ORG}/${REPO}${PAGE_PATH}"
