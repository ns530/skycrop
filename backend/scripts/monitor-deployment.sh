#!/bin/bash

##############################################
# Deployment Monitoring Script
# Monitors Railway metrics and health after deployment
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
MONITOR_DURATION="${2:-300}"  # 5 minutes default

echo "========================================="
echo "📊 Monitoring $ENVIRONMENT deployment"
echo "========================================="
echo "Project: $PROJECT_NAME"
echo "Duration: $MONITOR_DURATION seconds"
echo ""

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    exit 1
fi

# Get deployment URL
DEPLOYMENT_URL=$(railway domain)
echo "Monitoring URL: $DEPLOYMENT_URL"
echo ""

# Metrics tracking
ERROR_COUNT=0
SUCCESS_COUNT=0
TOTAL_REQUESTS=0

# Function to check health
check_health() {
    if curl -s --max-time 10 "$DEPLOYMENT_URL/health" | grep -q "healthy"; then
        echo -e "${GREEN}✅ Health check passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Health check failed${NC}"
        return 1
    fi
}

# Function to get Railway metrics (simplified)
get_railway_metrics() {
    echo -e "${BLUE}📈 Railway Metrics:${NC}"

    # Get basic service status
    railway status || echo "Could not get Railway status"

    # Get recent logs for errors
    echo -e "${YELLOW}Recent error logs:${NC}"
    railway logs --tail 10 2>/dev/null | grep -i error || echo "No recent errors"
    echo ""
}

# Initial health check
echo -e "${BLUE}🏥 Initial health check...${NC}"
if ! check_health; then
    echo -e "${RED}❌ Deployment is unhealthy${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}⏳ Starting monitoring for $MONITOR_DURATION seconds...${NC}"
echo ""

START_TIME=$(date +%s)
END_TIME=$((START_TIME + MONITOR_DURATION))

while [ $(date +%s) -lt $END_TIME ]; do
    CURRENT_TIME=$(date +%s)
    REMAINING=$((END_TIME - CURRENT_TIME))

    echo -e "${BLUE}📊 Monitoring... ($REMAINING seconds remaining)${NC}"

    # Health check every 30 seconds
    if ! check_health; then
        ERROR_COUNT=$((ERROR_COUNT + 1))
    else
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    fi

    TOTAL_REQUESTS=$((TOTAL_REQUESTS + 1))

    # Get metrics every 60 seconds
    if [ $((CURRENT_TIME % 60)) -eq 0 ]; then
        get_railway_metrics
    fi

    # Sleep for 30 seconds
    sleep 30
done

echo ""
echo "========================================="
echo "📋 Monitoring Results"
echo "========================================="

SUCCESS_RATE=0
if [ $TOTAL_REQUESTS -gt 0 ]; then
    SUCCESS_RATE=$((SUCCESS_COUNT * 100 / TOTAL_REQUESTS))
fi

echo "Total checks: $TOTAL_REQUESTS"
echo "Successful: $SUCCESS_COUNT"
echo "Failed: $ERROR_COUNT"
echo "Success rate: ${SUCCESS_RATE}%"
echo ""

if [ $SUCCESS_RATE -ge 95 ]; then
    echo -e "${GREEN}✅ Deployment monitoring passed (≥95% success rate)${NC}"

    # Send success notification to Sentry or other monitoring
    echo -e "${BLUE}📢 Sending monitoring success notification...${NC}"

    exit 0
else
    echo -e "${RED}❌ Deployment monitoring failed (<95% success rate)${NC}"
    echo -e "${YELLOW}⚠️  Consider rollback if issues persist${NC}"

    exit 1
fi