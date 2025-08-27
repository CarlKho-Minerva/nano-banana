#!/bin/bash

echo "🚀 Setting up Stripe Integration for NanoBanana"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "\n${YELLOW}Step 1: Check if you have Stripe keys${NC}"
echo "You need to:"
echo "1. Go to https://dashboard.stripe.com/apikeys"
echo "2. Copy your 'Publishable key' (starts with pk_test_)"
echo "3. Copy your 'Secret key' (starts with sk_test_)"
echo ""

# Check if .env exists and has keys
if [ -f "backend/.env" ]; then
    if grep -q "sk_test_YOUR_SECRET_KEY_HERE" backend/.env; then
        echo -e "${RED}⚠️  You need to update backend/.env with your actual Stripe secret key${NC}"
        echo "Edit: backend/.env"
        echo "Replace: sk_test_YOUR_SECRET_KEY_HERE"
        echo "With your actual secret key from Stripe dashboard"
    else
        echo -e "${GREEN}✓ Backend .env file looks good${NC}"
    fi
else
    echo -e "${RED}✗ Backend .env file not found${NC}"
fi

echo -e "\n${YELLOW}Step 2: Install dependencies${NC}"
cd backend
if npm list express > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
else
    echo "Installing backend dependencies..."
    npm install
fi

cd ..

echo -e "\n${YELLOW}Step 3: Start your servers${NC}"
echo "Run these commands in separate terminals:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  npm run dev"
echo ""

echo -e "\n${YELLOW}Step 4: Test the integration${NC}"
echo "After both servers are running:"
echo "1. Go to http://localhost:5173"
echo "2. Upload an image"
echo "3. Try to edit (should work with free credits)"
echo "4. When credits run out, try buying more"
echo ""

echo -e "\n${GREEN}🎉 Setup complete!${NC}"
echo "Follow the steps above to test your Stripe integration."
echo ""
echo "Need help? Check:"
echo "- STRIPE_SETUP_GUIDE.md (complete tutorial)"
echo "- NETWORK_ISSUES_WORKAROUND.md (if you have network problems)"