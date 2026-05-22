#!/bin/bash

#
# ACS Call Recording Event Grid Setup Script
# 
# This script sets up an Event Grid subscription to route ACS call recording
# completion events to the GigitekAI webhook for automatic transcription.
#
# Usage:
#   ./setup-acs-eventgrid.sh -t <tenant-id> -s <subscription-id> [-r <resource-group>] [-a <acs-resource>] [-w <webhook-url>]
#
# Example:
#   ./setup-acs-eventgrid.sh \
#     -t "b7595a11-d451-46a6-aff1-c98ee3bda4f9" \
#     -s "e3f8a5e6-3b0d-4e9c-9c6e-6f8e8e8e8e8e"
#

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Default values
RESOURCE_GROUP="GigitekAI"
ACS_RESOURCE="acs-d365-voice-v2"
WEBHOOK_URL="https://gigitekai.com/api/acs/recording-webhook"
EVENT_SUBSCRIPTION_NAME="GigitekAI-CallRecordingWebhook"
EVENT_TYPE="Microsoft.Communication.RecordingFileStatusUpdated"
API_VERSION="2022-06-15"

# Parse arguments
while getopts "t:s:r:a:w:h" opt; do
    case $opt in
        t) TENANT_ID="$OPTARG" ;;
        s) SUBSCRIPTION_ID="$OPTARG" ;;
        r) RESOURCE_GROUP="$OPTARG" ;;
        a) ACS_RESOURCE="$OPTARG" ;;
        w) WEBHOOK_URL="$OPTARG" ;;
        h) 
            echo "Usage: $0 -t <tenant-id> -s <subscription-id> [-r <resource-group>] [-a <acs-resource>] [-w <webhook-url>]"
            exit 0
            ;;
        *) echo "Invalid option: -$OPTARG" >&2; exit 1 ;;
    esac
done

# Validate required arguments
if [ -z "$TENANT_ID" ] || [ -z "$SUBSCRIPTION_ID" ]; then
    echo -e "${RED}❌ Error: Tenant ID and Subscription ID are required${NC}"
    echo "Usage: $0 -t <tenant-id> -s <subscription-id> [-r <resource-group>] [-a <acs-resource>] [-w <webhook-url>]"
    exit 1
fi

echo -e "${CYAN}🔐 ACS Event Grid Setup Script${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

# Step 1: Login to Azure
echo -e "${YELLOW}📝 Step 1: Authenticating with Azure...${NC}"
if ! az account show &>/dev/null; then
    echo -e "${GRAY}  Launching Azure login...${NC}"
    az login --tenant "$TENANT_ID" > /dev/null
fi
echo -e "${GREEN}  ✅ Authenticated with Azure${NC}"

# Step 2: Set subscription context
echo ""
echo -e "${YELLOW}📝 Step 2: Setting subscription context...${NC}"
az account set --subscription "$SUBSCRIPTION_ID"
echo -e "${GREEN}  ✅ Subscription set to: $SUBSCRIPTION_ID${NC}"

# Step 3: Get ACS resource ID
echo ""
echo -e "${YELLOW}📝 Step 3: Verifying ACS resource...${NC}"
ACS_RESOURCE_ID=$(az resource show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACS_RESOURCE" \
    --resource-type "Microsoft.Communication/communicationServices" \
    --query id -o tsv 2>/dev/null)

if [ -z "$ACS_RESOURCE_ID" ]; then
    echo -e "${RED}  ❌ Failed to find ACS resource: $ACS_RESOURCE${NC}"
    exit 1
fi
echo -e "${GREEN}  ✅ Found ACS resource: $ACS_RESOURCE${NC}"
echo -e "${GRAY}     Resource ID: $ACS_RESOURCE_ID${NC}"

# Step 4: Validate webhook URL
echo ""
echo -e "${YELLOW}📝 Step 4: Validating webhook URL...${NC}"
echo -e "${GRAY}  Testing webhook accessibility...${NC}"
if curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d '{"validationCode":"test"}' \
    --max-time 10 > /dev/null 2>&1; then
    echo -e "${GREEN}  ✅ Webhook is accessible${NC}"
else
    echo -e "${YELLOW}  ⚠️  Could not reach webhook (OK if site not deployed yet)${NC}"
fi

# Step 5: Create Event Grid subscription
echo ""
echo -e "${YELLOW}📝 Step 5: Creating Event Grid subscription...${NC}"

# Build the subscription body
SUBSCRIPTION_BODY=$(cat <<EOF
{
  "properties": {
    "destination": {
      "endpointType": "WebHook",
      "properties": {
        "endpointUrl": "$WEBHOOK_URL"
      }
    },
    "filter": {
      "includedEventTypes": [
        "$EVENT_TYPE"
      ]
    },
    "eventDeliverySchema": "CloudEventSchemaV1_0"
  }
}
EOF
)

echo -e "${GRAY}  Subscription body:${NC}"
echo -e "${GRAY}  $SUBSCRIPTION_BODY${NC}"

# Create the subscription
SUBSCRIPTION_URI="https://management.azure.com$ACS_RESOURCE_ID/providers/Microsoft.EventGrid/eventSubscriptions/$EVENT_SUBSCRIPTION_NAME?api-version=$API_VERSION"

echo -e "${GRAY}  Creating subscription...${NC}"
RESPONSE=$(az rest --method PUT \
    --uri "$SUBSCRIPTION_URI" \
    --body "$SUBSCRIPTION_BODY" \
    --headers "Content-Type=application/json" 2>&1)

if echo "$RESPONSE" | grep -q "provisioningState"; then
    echo -e "${GREEN}  ✅ Event Grid subscription created successfully${NC}"
    echo -e "${GRAY}     Subscription Name: $EVENT_SUBSCRIPTION_NAME${NC}"
    echo -e "${GRAY}     Event Type: $EVENT_TYPE${NC}"
    echo -e "${GRAY}     Webhook URL: $WEBHOOK_URL${NC}"
    PROVISIONING_STATE=$(echo "$RESPONSE" | jq -r '.properties.provisioningState' 2>/dev/null || echo "Unknown")
    echo -e "${GRAY}     Provisioning State: $PROVISIONING_STATE${NC}"
else
    echo -e "${RED}  ❌ Failed to create Event Grid subscription${NC}"
    echo -e "${RED}  Response: $RESPONSE${NC}"
    exit 1
fi

# Step 6: Verify subscription
echo ""
echo -e "${YELLOW}📝 Step 6: Verifying subscription...${NC}"
VERIFY_RESPONSE=$(az rest --method GET \
    --uri "$SUBSCRIPTION_URI" \
    --headers "Content-Type=application/json" 2>&1)

if echo "$VERIFY_RESPONSE" | grep -q "provisioningState"; then
    echo -e "${GREEN}  ✅ Subscription verified${NC}"
    STATUS=$(echo "$VERIFY_RESPONSE" | jq -r '.properties.provisioningState' 2>/dev/null || echo "Unknown")
    ENDPOINT=$(echo "$VERIFY_RESPONSE" | jq -r '.properties.destination.properties.endpointUrl' 2>/dev/null || echo "Unknown")
    echo -e "${GRAY}     Status: $STATUS${NC}"
    echo -e "${GRAY}     Endpoint: $ENDPOINT${NC}"
else
    echo -e "${YELLOW}  ⚠️  Could not verify subscription${NC}"
fi

# Final summary
echo ""
echo -e "${CYAN}================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo -e "${GRAY}1. Make a test PSTN call to your Teams phone number${NC}"
echo -e "${GRAY}2. Hang up the call${NC}"
echo -e "${GRAY}3. Wait 30-60 seconds for the recording to be processed${NC}"
echo -e "${GRAY}4. Check the Call Review page - transcript should appear automatically${NC}"
echo ""
echo -e "${CYAN}Troubleshooting:${NC}"
echo -e "${GRAY}• Check logs: tail -f /home/ubuntu/gigitekai/.manus-logs/devserver.log${NC}"
echo -e "${GRAY}• Verify webhook: curl -X POST $WEBHOOK_URL -d '{\"validationCode\":\"test\"}'${NC}"
echo -e "${GRAY}• View subscription: az eventgrid event-subscription show --name $EVENT_SUBSCRIPTION_NAME --source-resource-id $ACS_RESOURCE_ID${NC}"
