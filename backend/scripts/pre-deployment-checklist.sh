#!/bin/bash

##############################################
# Pre-Deployment Checklist Script
# Run this before deploying to staging/production
##############################################

set -e  # Exit on error

echo "========================================="
echo "🚀 SkyCrop Pre-Deployment Checklist"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Function to check and report
check_step() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $1"
    else
        echo -e "${RED}❌ FAIL${NC}: $1"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "Step 1: Checking Backend Tests..."
echo "-----------------------------------"
cd backend
npm test > /dev/null 2>&1
check_step "Backend tests passing"

echo ""
echo "Step 2: Checking Test Coverage..."
echo "-----------------------------------"
COVERAGE=$(npm run test:coverage 2>&1 | grep "All files" | awk '{print $10}' | tr -d '%')
if [ -n "$COVERAGE" ] && [ "$COVERAGE" -ge 80 ]; then
    echo -e "${GREEN}✅ PASS${NC}: Backend coverage >80% (${COVERAGE}%)"
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Backend coverage <80% (${COVERAGE}%)"
fi

echo ""
echo "Step 3: Checking Environment Configuration..."
echo "-----------------------------------"
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✅ PASS${NC}: .env.production file exists"
else
    echo -e "${RED}❌ FAIL${NC}: .env.production file missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "Step 4: Checking Required Environment Variables..."
echo "-----------------------------------"
REQUIRED_VARS=("DATABASE_URL" "REDIS_URL" "JWT_SECRET" "OPENWEATHER_API_KEY" "ML_SERVICE_URL")

for VAR in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${VAR}=" .env.production 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $VAR is configured"
    else
        echo -e "${RED}❌${NC} $VAR is MISSING"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "Step 5: Checking OpenAPI Documentation..."
echo "-----------------------------------"
if [ -f "src/api/openapi.yaml" ]; then
    LINES=$(wc -l < src/api/openapi.yaml)
    if [ "$LINES" -gt 2000 ]; then
        echo -e "${GREEN}✅ PASS${NC}: OpenAPI spec exists ($LINES lines)"
    else
        echo -e "${YELLOW}⚠️  WARN${NC}: OpenAPI spec seems incomplete ($LINES lines)"
    fi
else
    echo -e "${RED}❌ FAIL${NC}: OpenAPI spec missing"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "Step 6: Checking Documentation..."
echo "-----------------------------------"
DOCS=(
    "docs/DEPLOYMENT_GUIDE.md"
    "docs/SENTRY_SETUP.md"
    "docs/PERFORMANCE_OPTIMIZATION.md"
    "../README.md"
)

for DOC in "${DOCS[@]}"; do
    if [ -f "$DOC" ]; then
        echo -e "${GREEN}✅${NC} $DOC exists"
    else
        echo -e "${RED}❌${NC} $DOC missing"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "Step 7: Checking Dependencies..."
echo "-----------------------------------"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ PASS${NC}: node_modules exists"
else
    echo -e "${RED}❌ FAIL${NC}: node_modules missing. Run: npm install"
    ERRORS=$((ERRORS + 1))
fi

# Check for Sentry packages
if grep -q "@sentry/node" package.json; then
    echo -e "${GREEN}✅${NC} Sentry packages installed"
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Sentry packages not found"
fi

echo ""
echo "Step 8: Checking Database Migrations..."
echo "-----------------------------------"
if [ -d "migrations" ] || [ -f "src/config/schema.sql" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Database migrations/schema exists"
else
    echo -e "${YELLOW}⚠️  WARN${NC}: No migrations found"
fi

echo ""
echo "Step 9: Checking Linter..."
echo "-----------------------------------"
npm run lint > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: Code passes linting"
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Linting errors found"
fi

echo ""
echo "Step 10: Security Check..."
echo "-----------------------------------"
if [ -f ".env" ] && grep -q "JWT_SECRET=change-this" .env; then
    echo -e "${RED}❌ FAIL${NC}: JWT_SECRET is still default value!"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS${NC}: JWT_SECRET is configured"
fi

# Check for exposed secrets in code
if git grep -i "api.key\|secret\|password" src/ | grep -v "process.env" | grep -q "="; then
    echo -e "${RED}❌ FAIL${NC}: Potential hardcoded secrets found in code!"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ PASS${NC}: No hardcoded secrets detected"
fi

echo ""
echo "========================================="
echo "📊 Pre-Deployment Checklist Summary"
echo "========================================="
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED! Ready for deployment! 🚀${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review deployment guide: backend/docs/DEPLOYMENT_GUIDE.md"
    echo "  2. Deploy to Railway: railway up"
    echo "  3. Run smoke tests: backend/scripts/smoke-tests.sh"
    exit 0
else
    echo -e "${RED}❌ $ERRORS CHECKS FAILED! Fix issues before deploying.${NC}"
    echo ""
    echo "Please address the failures above before proceeding with deployment."
    exit 1
fi

