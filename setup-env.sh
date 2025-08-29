#!/bin/bash

# NanoBanana Environment Setup Script
echo "🚀 Setting up NanoBanana environment variables..."
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Your existing .env file is unchanged."
        exit 0
    fi
fi

# Copy .env.example to .env
if [ ! -f ".env.example" ]; then
    echo "❌ .env.example file not found! Make sure you're in the project root directory."
    exit 1
fi

cp .env.example .env
echo "✅ Created .env file from .env.example"
echo ""

echo "📝 Next steps:"
echo "1. Edit the .env file with your actual API keys:"
echo "   - Get Stripe keys from: https://dashboard.stripe.com/apikeys" 
echo "   - Get Gemini API key from: https://aistudio.google.com/app/apikey"
echo ""
echo "2. For development, use TEST keys (pk_test_... and sk_test_...)"
echo "3. For production, use LIVE keys (pk_live_... and sk_live_...)"
echo ""
echo "⚠️  NEVER commit your .env file to git!"
echo ""
echo "🎉 Run 'npm run dev' when your .env is configured!"