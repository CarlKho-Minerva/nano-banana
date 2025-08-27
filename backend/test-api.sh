#!/bin/bash

echo "🧪 Testing NanoBanana Backend API"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"

# Test 1: Health Check
echo -e "\n${YELLOW}1. Testing Health Check...${NC}"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" $BASE_URL/api/health)
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Health check failed (HTTP $http_code)${NC}"
fi

# Test 2: Get User Credits
echo -e "\n${YELLOW}2. Testing Get User Credits...${NC}"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" $BASE_URL/api/user/test123/credits)
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Get credits passed${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Get credits failed (HTTP $http_code)${NC}"
fi

# Test 3: Create Checkout Session
echo -e "\n${YELLOW}3. Testing Create Checkout Session...${NC}"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST $BASE_URL/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123","credits":50}')
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Create checkout session passed${NC}"
    echo "Response: $body"
else
    echo -e "${RED}✗ Create checkout session failed (HTTP $http_code)${NC}"
    echo "Response: $body"
fi

echo -e "\n${YELLOW}=================================="
echo -e "🏁 Testing Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure your Stripe keys are in the .env file"
echo "2. Run 'stripe listen --forward-to localhost:3001/webhook' for webhooks"
echo "3. Test the frontend integration"