#!/bin/bash

##############################################
# Staging Deployment Script for Railway
# Deploys backend and ML service to Railway staging
##############################################

set -e  # Exit on error

echo "========================================="
echo "🚀 SkyCrop Staging Deployment"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
    echo -e "${GREEN}✅ Railway CLI installed${NC}"
fi

# Check if logged in to Railway
echo -e "${BLUE}🔐 Checking Railway authentication...${NC}"
railway whoami > /dev/null 2>&1 || {
    echo "Not logged in to Railway. Please login:"
    railway login
}
echo -e "${GREEN}✅ Railway authentication verified${NC}"
echo ""

# Deploy Backend
echo "========================================="
echo "📦 Deploying Backend Service"
echo "========================================="
echo ""

cd backend

# Check if project is linked
if [ ! -f ".railway" ]; then
    echo -e "${YELLOW}⚠️  Project not linked. Please link or create project:${NC}"
    echo "  - Link existing: railway link"
    echo "  - Create new: railway init"
    exit 1
fi

# Set environment to staging
echo -e "${BLUE}🔧 Setting environment variables...${NC}"
railway variables:set NODE_ENV=staging --service backend || true
echo -e "${GREEN}✅ Environment configured${NC}"
echo ""

# Deploy backend
echo -e "${BLUE}🚀 Deploying backend service...${NC}"
railway up --service backend --detach

# Wait for deployment
echo -e "${YELLOW}⏳ Waiting for deployment to complete (30s)...${NC}"
sleep 30

# Get deployment status
echo -e "${BLUE}📊 Checking deployment status...${NC}"
railway status --service backend

# Get deployment URL
BACKEND_URL=$(railway domain --service backend 2>/dev/null || echo "")
if [ -n "$BACKEND_URL" ]; then
    echo -e "${GREEN}✅ Backend deployed to: https://${BACKEND_URL}${NC}"
else
    echo -e "${YELLOW}⚠️  Unable to retrieve deployment URL${NC}"
fi
echo ""

# Run database migrations (if applicable)
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
railway run --service backend npm run migrate 2>/dev/null || {
    echo -e "${YELLOW}⚠️  No migrations to run or migration script not found${NC}"
}
echo ""

# Check backend health
echo -e "${BLUE}🏥 Checking backend health...${NC}"
if [ -n "$BACKEND_URL" ]; then
    sleep 5  # Give backend time to start
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${BACKEND_URL}/health" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Backend health check passed (200 OK)${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend health check returned: $HTTP_STATUS${NC}"
        echo "Check logs: railway logs --service backend"
    fi
fi
echo ""

# Deploy ML Service
echo "========================================="
echo "🤖 Deploying ML Service"
echo "========================================="
echo ""

cd ../ml-service

# Deploy ML service
echo -e "${BLUE}🚀 Deploying ML service...${NC}"
railway up --service ml-service --detach || {
    echo -e "${YELLOW}⚠️  ML service deployment skipped (not configured or not found)${NC}"
    echo "To deploy ML service:"
    echo "  1. cd ml-service"
    echo "  2. railway up --service ml-service"
}

# Wait for deployment
echo -e "${YELLOW}⏳ Waiting for ML service deployment (30s)...${NC}"
sleep 30

# Get ML service URL
ML_URL=$(railway domain --service ml-service 2>/dev/null || echo "")
if [ -n "$ML_URL" ]; then
    echo -e "${GREEN}✅ ML service deployed to: https://${ML_URL}${NC}"
    
    # Check ML service health
    echo -e "${BLUE}🏥 Checking ML service health...${NC}"
    sleep 5
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${ML_URL}/health" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ ML service health check passed (200 OK)${NC}"
    else
        echo -e "${YELLOW}⚠️  ML service health check returned: $HTTP_STATUS${NC}"
    fi
fi
echo ""

# Summary
echo "========================================="
echo "📊 Deployment Summary"
echo "========================================="
echo ""
echo "Backend Service:"
if [ -n "$BACKEND_URL" ]; then
    echo "  URL: https://${BACKEND_URL}"
    echo "  Health: https://${BACKEND_URL}/health"
    echo "  API Docs: https://${BACKEND_URL}/api-docs"
else
    echo "  Status: Check Railway dashboard"
fi
echo ""

if [ -n "$ML_URL" ]; then
    echo "ML Service:"
    echo "  URL: https://${ML_URL}"
    echo "  Health: https://${ML_URL}/health"
    echo ""
fi

echo "Next Steps:"
echo "  1. Run smoke tests: ./backend/scripts/smoke-tests.sh"
echo "  2. Check logs: railway logs --service backend"
echo "  3. Monitor Sentry: https://sentry.io"
echo ""
echo -e "${GREEN}✅ Deployment Complete! 🎉${NC}"

