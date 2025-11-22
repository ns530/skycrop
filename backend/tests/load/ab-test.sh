#!/bin/bash

##############################################
# Apache Bench (ab) Load Testing Script
# For quick performance testing of SkyCrop APIs
##############################################

# Configuration
BASE_URL="http://localhost:3000"
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Replace with valid token
FIELD_ID="test-field-123"

# Test parameters
CONCURRENCY=50      # Number of concurrent requests
TOTAL_REQUESTS=1000 # Total requests to make

echo "========================================="
echo "🚀 SkyCrop API Load Testing with Apache Bench"
echo "========================================="
echo ""
echo "Configuration:"
echo "  Base URL: $BASE_URL"
echo "  Concurrency: $CONCURRENCY"
echo "  Total Requests: $TOTAL_REQUESTS"
echo ""

# Create temp header file
HEADER_FILE=$(mktemp)
echo "Authorization: Bearer $JWT_TOKEN" > $HEADER_FILE

echo "========================================="
echo "Test 1: Health Monitoring API"
echo "========================================="
ab -n $TOTAL_REQUESTS -c $CONCURRENCY \
   -H "Authorization: Bearer $JWT_TOKEN" \
   -g health-results.tsv \
   "$BASE_URL/api/v1/fields/$FIELD_ID/health/history?start=2024-01-01&end=2024-01-31"

echo ""
echo "========================================="
echo "Test 2: Recommendation API"
echo "========================================="
ab -n $TOTAL_REQUESTS -c $CONCURRENCY \
   -H "Authorization: Bearer $JWT_TOKEN" \
   -g recommendation-results.tsv \
   "$BASE_URL/api/v1/fields/$FIELD_ID/recommendations?page=1&pageSize=10"

echo ""
echo "========================================="
echo "Test 3: Yield Prediction API"
echo "========================================="
ab -n $TOTAL_REQUESTS -c $CONCURRENCY \
   -H "Authorization: Bearer $JWT_TOKEN" \
   -g yield-results.tsv \
   "$BASE_URL/api/v1/fields/$FIELD_ID/yield/predictions?limit=5"

echo ""
echo "========================================="
echo "Test 4: Notification API"
echo "========================================="
ab -n $TOTAL_REQUESTS -c $CONCURRENCY \
   -H "Authorization: Bearer $JWT_TOKEN" \
   -g notification-results.tsv \
   "$BASE_URL/api/v1/notifications/queue/stats"

# Cleanup
rm -f $HEADER_FILE

echo ""
echo "========================================="
echo "✅ Load Testing Complete!"
echo "========================================="
echo ""
echo "Results saved to:"
echo "  - health-results.tsv"
echo "  - recommendation-results.tsv"
echo "  - yield-results.tsv"
echo "  - notification-results.tsv"
echo ""
echo "To visualize results, import TSV files into Excel or use gnuplot."

