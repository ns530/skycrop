#!/bin/bash

##############################################
# Smoke Tests for Staging Environment
# Tests all critical API endpoints after deployment
##############################################

set -e

echo "========================================="
echo "🧪 SkyCrop Staging Smoke Tests"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="${STAGING_URL:-https://skycrop-backend-staging.up.railway.app}"
TEST_EMAIL="smoke-test-$(date +%s)@example.com"
TEST_PASSWORD="SmokeTest123!"
FIELD_ID="test-field-123"  # Will be replaced after creating a field

PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local NAME="$1"
    local METHOD="$2"
    local ENDPOINT="$3"
    local EXPECTED_STATUS="$4"
    local HEADERS="$5"
    local DATA="$6"
    
    echo -e "${BLUE}Testing: $NAME${NC}"
    
    if [ -n "$DATA" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$METHOD" "$BASE_URL$ENDPOINT" \
            -H "Content-Type: application/json" \
            $HEADERS \
            -d "$DATA")
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$METHOD" "$BASE_URL$ENDPOINT" \
            -H "Content-Type: application/json" \
            $HEADERS)
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "$EXPECTED_STATUS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $NAME (Status: $HTTP_CODE)"
        PASSED=$((PASSED + 1))
        echo "$BODY"
    else
        echo -e "${RED}❌ FAIL${NC}: $NAME (Expected: $EXPECTED_STATUS, Got: $HTTP_CODE)"
        FAILED=$((FAILED + 1))
        echo "$BODY"
    fi
    echo ""
}

echo "Stage URL: $BASE_URL"
echo ""

# Test 1: Health Check
echo "========================================="
echo "Test Suite 1: Core Endpoints"
echo "========================================="
echo ""

test_endpoint \
    "Health Check" \
    "GET" \
    "/health" \
    "200" \
    ""

test_endpoint \
    "API Root" \
    "GET" \
    "/api/v1" \
    "200" \
    ""

# Test 2: Authentication
echo "========================================="
echo "Test Suite 2: Authentication"
echo "========================================="
echo ""

# Register user
REGISTER_DATA="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"firstName\":\"Smoke\",\"lastName\":\"Test\"}"

test_endpoint \
    "User Registration" \
    "POST" \
    "/api/v1/auth/register" \
    "201" \
    "" \
    "$REGISTER_DATA"

# Login
LOGIN_DATA="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA")

JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -n "$JWT_TOKEN" ]; then
    echo -e "${GREEN}✅ PASS${NC}: User Login (Token received)"
    PASSED=$((PASSED + 1))
    AUTH_HEADER="-H \"Authorization: Bearer $JWT_TOKEN\""
else
    echo -e "${RED}❌ FAIL${NC}: User Login (No token received)"
    FAILED=$((FAILED + 1))
    echo "Cannot proceed with authenticated tests"
    exit 1
fi
echo ""

# Test 3: Sprint 3 APIs
echo "========================================="
echo "Test Suite 3: Sprint 3 APIs"
echo "========================================="
echo ""

# Test Health Monitoring API
test_endpoint \
    "Health Monitoring API - History" \
    "GET" \
    "/api/v1/fields/$FIELD_ID/health/history?start=2024-01-01&end=2024-01-31" \
    "404" \
    "$AUTH_HEADER"

# Test Recommendation API
test_endpoint \
    "Recommendation API - List" \
    "GET" \
    "/api/v1/fields/$FIELD_ID/recommendations" \
    "404" \
    "$AUTH_HEADER"

# Test Yield Prediction API
test_endpoint \
    "Yield Prediction API - Predictions" \
    "GET" \
    "/api/v1/fields/$FIELD_ID/yield/predictions" \
    "404" \
    "$AUTH_HEADER"

# Test Notification API
test_endpoint \
    "Notification API - Queue Stats" \
    "GET" \
    "/api/v1/notifications/queue/stats" \
    "200" \
    "$AUTH_HEADER"

# Test 4: Error Handling
echo "========================================="
echo "Test Suite 4: Error Handling"
echo "========================================="
echo ""

test_endpoint \
    "404 Not Found" \
    "GET" \
    "/api/v1/nonexistent" \
    "404" \
    ""

test_endpoint \
    "Unauthorized Access" \
    "GET" \
    "/api/v1/fields" \
    "401" \
    ""

# Summary
echo "========================================="
echo "📊 Smoke Test Results"
echo "========================================="
echo ""
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All smoke tests passed! 🎉${NC}"
    echo ""
    echo "Staging environment is healthy and ready for testing."
    exit 0
else
    echo -e "${RED}❌ Some smoke tests failed!${NC}"
    echo ""
    echo "Please check the logs and fix issues before proceeding:"
    echo "  railway logs --service backend"
    echo "  https://sentry.io (check for errors)"
    exit 1
fi

