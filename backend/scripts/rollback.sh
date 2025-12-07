#!/bin/bash

##############################################
# Rollback Script for Railway Deployments
# Rolls back to previous stable deployment
##############################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_NAME="${RAILWAY_PROJECT_NAME:-skycrop-backend}"
ENVIRONMENT="${1:-production}"
REASON="${2:-manual_rollback}"

echo "========================================="
echo "⏪ Rolling back $ENVIRONMENT deployment"
echo "========================================="
echo "Project: $PROJECT_NAME"
echo "Reason: $REASON"
echo ""

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Install with: npm install -g @railway/cli${NC}"
    exit 1
fi

# Login check
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Railway. Run: railway login${NC}"
    exit 1
fi

# Link project if not linked
if ! railway status &> /dev/null; then
    echo -e "${BLUE}🔗 Linking to Railway project...${NC}"
    railway link --project "$PROJECT_NAME"
fi

# Get current deployment info
echo -e "${BLUE}📊 Getting current deployment info...${NC}"
CURRENT_DEPLOYMENT=$(railway deployments | head -2 | tail -1 | awk '{print $1}')
CURRENT_STATUS=$(railway deployments | head -2 | tail -1 | awk '{print $2}')

echo "Current deployment: $CURRENT_DEPLOYMENT"
echo "Current status: $CURRENT_STATUS"
echo ""

# Get deployment history
echo -e "${BLUE}📜 Getting deployment history...${NC}"
DEPLOYMENTS=$(railway deployments | tail -n +2 | head -10)

echo "Recent deployments:"
echo "$DEPLOYMENTS"
echo ""

# Find previous successful deployment
PREVIOUS_DEPLOYMENT=$(echo "$DEPLOYMENTS" | awk '$2 == "SUCCESS" {print $1; exit}')

if [ -z "$PREVIOUS_DEPLOYMENT" ]; then
    echo -e "${RED}❌ No previous successful deployment found${NC}"
    exit 1
fi

echo -e "${YELLOW}🎯 Rolling back to deployment: $PREVIOUS_DEPLOYMENT${NC}"
echo ""

# Confirm rollback
echo -e "${YELLOW}⚠️  This will rollback the $ENVIRONMENT environment${NC}"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}ℹ️  Rollback cancelled${NC}"
    exit 0
fi

# Perform rollback
echo -e "${BLUE}🔄 Performing rollback...${NC}"

if railway rollback "$PREVIOUS_DEPLOYMENT"; then
    echo -e "${GREEN}✅ Rollback initiated successfully${NC}"

    # Wait for rollback to complete
    echo -e "${YELLOW}⏳ Waiting for rollback to complete...${NC}"
    sleep 30

    # Verify rollback
    NEW_CURRENT=$(railway deployments | head -2 | tail -1 | awk '{print $1}')

    if [ "$NEW_CURRENT" = "$PREVIOUS_DEPLOYMENT" ]; then
        echo -e "${GREEN}✅ Rollback completed successfully${NC}"

        # Run smoke tests
        echo -e "${BLUE}🧪 Running smoke tests on rolled back deployment...${NC}"

        # Get the URL after rollback
        ROLLBACK_URL=$(railway domain)

        export STAGING_URL="$ROLLBACK_URL"

        if npm run smoke-test; then
            echo -e "${GREEN}✅ Rollback smoke tests passed${NC}"

            # Notify monitoring systems
            echo -e "${BLUE}📢 Notifying monitoring systems...${NC}"

            # Sentry notification
            if [ -n "$SENTRY_AUTH_TOKEN" ]; then
                curl -X POST \
                    "https://sentry.io/api/0/organizations/${SENTRY_ORG}/releases/" \
                    -H "Authorization: Bearer ${SENTRY_AUTH_TOKEN}" \
                    -H "Content-Type: application/json" \
                    -d "{\"version\":\"rollback-${PREVIOUS_DEPLOYMENT}\",\"refs\":[{\"commit\":\"${PREVIOUS_DEPLOYMENT}\"}],\"projects\":[\"${SENTRY_PROJECT}\"]}" \
                    2>/dev/null || true
            fi

        else
            echo -e "${RED}❌ Rollback smoke tests failed!${NC}"
            echo -e "${YELLOW}⚠️  Manual verification required${NC}"
        fi

    else
        echo -e "${RED}❌ Rollback verification failed${NC}"
        echo "Expected: $PREVIOUS_DEPLOYMENT"
        echo "Actual: $NEW_CURRENT"
        exit 1
    fi

else
    echo -e "${RED}❌ Rollback failed${NC}"
    exit 1
fi

echo ""
echo "========================================="
echo "📋 Rollback Summary"
echo "========================================="
echo "Environment: $ENVIRONMENT"
echo "Rolled back to: $PREVIOUS_DEPLOYMENT"
echo "Reason: $REASON"
echo "Status: Success"
echo "========================================="

# Log rollback event
echo "$(date): Rollback performed on $ENVIRONMENT - $REASON - $PREVIOUS_DEPLOYMENT" >> rollback.log