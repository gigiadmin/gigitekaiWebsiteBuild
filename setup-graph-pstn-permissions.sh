#!/bin/bash

################################################################################
# Microsoft Graph PSTN Call Permissions Setup
# 
# Verifies and grants required permissions for PSTN call log access.
# 
# Requirements:
#   - Azure CLI (az command)
#   - jq (JSON processor)
#   - curl
# 
# Usage:
#   ./setup-graph-pstn-permissions.sh -t <TENANT_ID> [-a <APP_ID>] [-g]
# 
# Examples:
#   ./setup-graph-pstn-permissions.sh -t "b7595a11-d451-46a6-aff1-c98ee3bda4f9" -g
#   ./setup-graph-pstn-permissions.sh -t "b7595a11-d451-46a6-aff1-c98ee3bda4f9" -a "12345678-1234-1234-1234-123456789012" -g
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Defaults
TENANT_ID=""
APP_ID=""
GRANT_CONSENT=false

# ─── Parse Arguments ──────────────────────────────────────────────────────────

while getopts "t:a:gh" opt; do
    case $opt in
        t) TENANT_ID="$OPTARG" ;;
        a) APP_ID="$OPTARG" ;;
        g) GRANT_CONSENT=true ;;
        h)
            echo "Usage: $0 -t <TENANT_ID> [-a <APP_ID>] [-g]"
            echo ""
            echo "Options:"
            echo "  -t  Tenant ID (required)"
            echo "  -a  App ID (optional, will search for 'GigitekAI' if not provided)"
            echo "  -g  Grant consent for missing permissions"
            echo ""
            echo "Example:"
            echo "  $0 -t b7595a11-d451-46a6-aff1-c98ee3bda4f9 -g"
            exit 0
            ;;
        *)
            echo "Invalid option: -$OPTARG" >&2
            exit 1
            ;;
    esac
done

if [ -z "$TENANT_ID" ]; then
    echo -e "${RED}Error: Tenant ID is required (-t)${NC}"
    exit 1
fi

# ─── Helper Functions ─────────────────────────────────────────────────────────

log_info() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

# ─── Step 1: Check Dependencies ───────────────────────────────────────────────

log_info "Checking dependencies..."

if ! command -v az &> /dev/null; then
    log_error "Azure CLI not found. Please install it: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    log_error "jq not found. Please install it: sudo apt-get install jq (Linux) or brew install jq (macOS)"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    log_error "curl not found. Please install it."
    exit 1
fi

log_success "All dependencies found"

# ─── Step 2: Login to Azure ───────────────────────────────────────────────────

log_info "Checking Azure CLI login status..."

if ! az account show --tenant "$TENANT_ID" &> /dev/null; then
    log_info "Logging in to Azure..."
    az login --tenant "$TENANT_ID"
fi

log_success "Authenticated with Azure"

# ─── Step 3: Find or verify the app registration ──────────────────────────────

if [ -z "$APP_ID" ]; then
    log_info "Searching for 'GigitekAI' app registration..."
    
    APP_OBJECT_ID=$(az ad app list --filter "displayName eq 'GigitekAI'" --query "[0].id" -o tsv 2>/dev/null || echo "")
    
    if [ -z "$APP_OBJECT_ID" ]; then
        log_error "Could not find app registration named 'GigitekAI'. Please provide -a <APP_ID>"
        exit 1
    fi
    
    APP_ID=$(az ad app show --id "$APP_OBJECT_ID" --query "appId" -o tsv)
    log_success "Found app: GigitekAI (AppId: $APP_ID)"
else
    log_info "Verifying app registration with AppId: $APP_ID..."
    
    APP_OBJECT_ID=$(az ad app show --id "$APP_ID" --query "id" -o tsv 2>/dev/null || echo "")
    
    if [ -z "$APP_OBJECT_ID" ]; then
        log_error "App registration not found with AppId: $APP_ID"
        exit 1
    fi
    
    log_success "Found app: $APP_ID"
fi

# ─── Step 4: Get the service principal ─────────────────────────────────────────

log_info "Getting service principal for app..."

SP_OBJECT_ID=$(az ad sp list --filter "appId eq '$APP_ID'" --query "[0].id" -o tsv 2>/dev/null || echo "")

if [ -z "$SP_OBJECT_ID" ]; then
    log_error "Service principal not found. The app may not have been consented yet."
    log_warning "Please go to https://portal.azure.com → Azure AD → Enterprise applications"
    exit 1
fi

log_success "Found service principal (ObjectId: $SP_OBJECT_ID)"

# ─── Step 5: Get access token ─────────────────────────────────────────────────

log_info "Getting access token..."

TOKEN=$(az account get-access-token --resource "https://graph.microsoft.com" --query "accessToken" -o tsv)

if [ -z "$TOKEN" ]; then
    log_error "Failed to get access token"
    exit 1
fi

log_success "Access token obtained"

# ─── Step 6: Check current permissions ─────────────────────────────────────────

log_info "Checking current permissions..."

REQUIRED_PERMISSIONS=(
    "CallRecords.Read.All"
    "Communications.Read.All"
)

CURRENT_ROLES=()
MISSING_ROLES=()

for PERMISSION in "${REQUIRED_PERMISSIONS[@]}"; do
    # Get the app role ID from Microsoft Graph
    ROLE_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
        "https://graph.microsoft.com/v1.0/servicePrincipals?filter=appId%20eq%20'00000003-0000-0000-c000-000000000000'" \
        | jq -r ".value[0].appRoles[] | select(.value == \"$PERMISSION\") | .id" 2>/dev/null || echo "")
    
    if [ -z "$ROLE_ID" ]; then
        log_warning "  ⚠️  $PERMISSION - Could not find in Microsoft Graph"
        continue
    fi
    
    # Check if the role is already assigned
    ASSIGNMENT=$(curl -s -H "Authorization: Bearer $TOKEN" \
        "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_OBJECT_ID/appRoleAssignments" \
        | jq ".value[] | select(.appRoleId == \"$ROLE_ID\")" 2>/dev/null || echo "")
    
    if [ -n "$ASSIGNMENT" ]; then
        CURRENT_ROLES+=("$PERMISSION")
        log_success "  $PERMISSION"
    else
        MISSING_ROLES+=("$PERMISSION|$ROLE_ID")
        log_warning "  $PERMISSION [MISSING]"
    fi
done

# ─── Step 7: Grant missing permissions ─────────────────────────────────────────

if [ ${#MISSING_ROLES[@]} -eq 0 ]; then
    log_success "All required permissions are already granted!"
    exit 0
fi

if [ "$GRANT_CONSENT" = false ]; then
    log_warning "Missing ${#MISSING_ROLES[@]} permissions. Run with -g to grant them."
    exit 0
fi

log_info "Granting missing permissions..."

GRAPH_SP_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "https://graph.microsoft.com/v1.0/servicePrincipals?filter=appId%20eq%20'00000003-0000-0000-c000-000000000000'" \
    | jq -r ".value[0].id")

for ROLE_INFO in "${MISSING_ROLES[@]}"; do
    IFS='|' read -r PERMISSION ROLE_ID <<< "$ROLE_INFO"
    
    PAYLOAD=$(jq -n \
        --arg appRoleId "$ROLE_ID" \
        --arg resourceId "$GRAPH_SP_ID" \
        --arg principalId "$SP_OBJECT_ID" \
        '{appRoleId: $appRoleId, resourceId: $resourceId, principalId: $principalId}')
    
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" \
        "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_OBJECT_ID/appRoleAssignments")
    
    ERROR=$(echo "$RESPONSE" | jq -r ".error.message" 2>/dev/null || echo "")
    
    if [ -n "$ERROR" ] && [ "$ERROR" != "null" ]; then
        log_error "  Failed to grant $PERMISSION: $ERROR"
    else
        log_success "  Granted: $PERMISSION"
    fi
done

# ─── Step 8: Verify permissions were granted ───────────────────────────────────

log_info "Verifying permissions..."
sleep 2

VERIFIED=true
for ROLE_INFO in "${MISSING_ROLES[@]}"; do
    IFS='|' read -r PERMISSION ROLE_ID <<< "$ROLE_INFO"
    
    ASSIGNMENT=$(curl -s -H "Authorization: Bearer $TOKEN" \
        "https://graph.microsoft.com/v1.0/servicePrincipals/$SP_OBJECT_ID/appRoleAssignments" \
        | jq ".value[] | select(.appRoleId == \"$ROLE_ID\")" 2>/dev/null || echo "")
    
    if [ -n "$ASSIGNMENT" ]; then
        log_success "  Verified: $PERMISSION"
    else
        log_error "  Verification failed: $PERMISSION"
        VERIFIED=false
    fi
done

if [ "$VERIFIED" = true ]; then
    log_success "All permissions granted successfully!"
    log_info "The PSTN call poller should now be able to fetch call records."
    log_info "Note: It may take 5-10 minutes for permissions to propagate."
else
    log_warning "Some permissions could not be verified. Please check the Azure Portal."
    exit 1
fi
