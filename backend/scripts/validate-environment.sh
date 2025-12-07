#!/bin/bash

##############################################
# Environment Readiness Validation Script
# Validates staging/production environment configuration
# Checks database, external APIs, Redis, S3, SSL, and env vars
##############################################

set -e

echo "========================================="
echo "🔍 SkyCrop Environment Readiness Validation"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PASSED=0
FAILED=0
WARNINGS=0

# Function to report results
report_result() {
    local NAME="$1"
    local STATUS="$2"
    local MESSAGE="$3"

    case $STATUS in
        "PASS")
            echo -e "${GREEN}✅ PASS${NC}: $NAME"
            PASSED=$((PASSED + 1))
            ;;
        "FAIL")
            echo -e "${RED}❌ FAIL${NC}: $NAME - $MESSAGE"
            FAILED=$((FAILED + 1))
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  WARN${NC}: $NAME - $MESSAGE"
            WARNINGS=$((WARNINGS + 1))
            ;;
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "========================================="
echo "1. Environment Variables Validation"
echo "========================================="
echo ""

# Check required environment variables
REQUIRED_VARS=(
    "NODE_ENV"
    "DATABASE_URL"
    "REDIS_URL"
    "JWT_SECRET"
    "WEATHER_API_KEY"
    "SATELLITE_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        report_result "Environment variable $var" "PASS"
    else
        report_result "Environment variable $var" "FAIL" "Not set"
    fi
done

# Check optional but recommended variables
OPTIONAL_VARS=(
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_S3_BUCKET"
    "SMTP_HOST"
    "GOOGLE_CLIENT_ID"
    "SENTRY_DSN"
)

for var in "${OPTIONAL_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        report_result "Optional variable $var" "PASS"
    else
        report_result "Optional variable $var" "WARN" "Not set (optional)"
    fi
done

echo ""
echo "========================================="
echo "2. Database Connectivity Check"
echo "========================================="
echo ""

# PostgreSQL connectivity check
if command_exists pg_isready; then
    if pg_isready -d "$DATABASE_URL" 2>/dev/null; then
        report_result "PostgreSQL connectivity" "PASS"
    else
        report_result "PostgreSQL connectivity" "FAIL" "Cannot connect to database"
    fi
else
    # Fallback: try to connect using psql
    if command_exists psql; then
        if echo "SELECT 1;" | psql "$DATABASE_URL" --quiet --no-align --tuples-only >/dev/null 2>&1; then
            report_result "PostgreSQL connectivity" "PASS"
        else
            report_result "PostgreSQL connectivity" "FAIL" "Cannot connect to database"
        fi
    else
        report_result "PostgreSQL connectivity" "WARN" "pg_isready/psql not available"
    fi
fi

# MongoDB connectivity check (if MongoDB URL is provided)
if [ -n "$MONGODB_URL" ]; then
    if command_exists mongosh; then
        if mongosh "$MONGODB_URL" --eval "db.runCommand('ping')" --quiet >/dev/null 2>&1; then
            report_result "MongoDB connectivity" "PASS"
        else
            report_result "MongoDB connectivity" "FAIL" "Cannot connect to MongoDB"
        fi
    else
        report_result "MongoDB connectivity" "WARN" "mongosh not available"
    fi
else
    report_result "MongoDB connectivity" "WARN" "MONGODB_URL not set"
fi

echo ""
echo "========================================="
echo "3. Redis Cache Availability"
echo "========================================="
echo ""

# Redis connectivity check
if command_exists redis-cli; then
    if redis-cli -u "$REDIS_URL" ping 2>/dev/null | grep -q "PONG"; then
        report_result "Redis connectivity" "PASS"
    else
        report_result "Redis connectivity" "FAIL" "Cannot connect to Redis"
    fi
else
    report_result "Redis connectivity" "WARN" "redis-cli not available"
fi

echo ""
echo "========================================="
echo "4. External API Accessibility"
echo "========================================="
echo ""

# Sentinel Hub API check
if [ -n "$SATELLITE_API_KEY" ]; then
    SENTINEL_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        "https://services.sentinel-hub.com/api/v1/catalog/search" \
        -H "Authorization: Bearer $SATELLITE_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"bbox":[80.0,5.0,82.0,10.0],"datetime":"2024-01-01T00:00:00Z/2024-01-02T00:00:00Z"}' \
        --max-time 10)

    if [ "$SENTINEL_RESPONSE" = "200" ] || [ "$SENTINEL_RESPONSE" = "201" ]; then
        report_result "Sentinel Hub API" "PASS"
    else
        report_result "Sentinel Hub API" "FAIL" "HTTP $SENTINEL_RESPONSE"
    fi
else
    report_result "Sentinel Hub API" "FAIL" "SATELLITE_API_KEY not set"
fi

# OpenWeatherMap API check
if [ -n "$WEATHER_API_KEY" ]; then
    WEATHER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        "https://api.openweathermap.org/data/2.5/weather?q=Colombo&appid=$WEATHER_API_KEY" \
        --max-time 10)

    if [ "$WEATHER_RESPONSE" = "200" ]; then
        report_result "OpenWeatherMap API" "PASS"
    else
        report_result "OpenWeatherMap API" "FAIL" "HTTP $WEATHER_RESPONSE"
    fi
else
    report_result "OpenWeatherMap API" "FAIL" "WEATHER_API_KEY not set"
fi

echo ""
echo "========================================="
echo "5. AWS S3 Storage Access"
echo "========================================="
echo ""

# AWS S3 access check
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ] && [ -n "$AWS_S3_BUCKET" ]; then
    if command_exists aws; then
        if aws s3 ls "s3://$AWS_S3_BUCKET" --region "${AWS_REGION:-us-east-1}" >/dev/null 2>&1; then
            report_result "AWS S3 access" "PASS"
        else
            report_result "AWS S3 access" "FAIL" "Cannot access S3 bucket"
        fi
    else
        report_result "AWS S3 access" "WARN" "aws CLI not available"
    fi
else
    report_result "AWS S3 access" "WARN" "AWS credentials not set"
fi

echo ""
echo "========================================="
echo "6. SSL Certificate Validation"
echo "========================================="
echo ""

# SSL certificate check for backend URL
if [ -n "$BACKEND_URL" ]; then
    # Extract domain from URL
    DOMAIN=$(echo "$BACKEND_URL" | sed 's|https://||' | sed 's|http://||' | cut -d'/' -f1 | cut -d':' -f1)

    if command_exists openssl; then
        if echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -checkend 86400 >/dev/null 2>&1; then
            report_result "SSL certificate" "PASS"
        else
            report_result "SSL certificate" "FAIL" "Certificate expired or invalid"
        fi
    else
        report_result "SSL certificate" "WARN" "openssl not available"
    fi
else
    report_result "SSL certificate" "WARN" "BACKEND_URL not set"
fi

echo ""
echo "========================================="
echo "7. System Resources Check"
echo "========================================="
echo ""

# Disk space check
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    report_result "Disk space" "PASS"
else
    report_result "Disk space" "FAIL" "Disk usage at ${DISK_USAGE}%"
fi

# Memory check
if command_exists free; then
    MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ "$MEM_USAGE" -lt 90 ]; then
        report_result "Memory usage" "PASS"
    else
        report_result "Memory usage" "FAIL" "Memory usage at ${MEM_USAGE}%"
    fi
else
    report_result "Memory usage" "WARN" "free command not available"
fi

echo ""
echo "========================================="
echo "📊 Validation Results"
echo "========================================="
echo ""
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo "Total checks: $((PASSED + FAILED + WARNINGS))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Environment validation passed! 🎉${NC}"
    echo ""
    echo "Environment is ready for deployment."
    exit 0
else
    echo -e "${RED}❌ Environment validation failed!${NC}"
    echo ""
    echo "Please fix the failed checks before proceeding with deployment."
    exit 1
fi