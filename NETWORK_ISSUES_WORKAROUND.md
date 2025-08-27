# 🌐 Network Issues Workaround

## Problem
You're getting network connectivity issues when running `stripe listen`:
```
FATAL Error while authenticating with Stripe: Post "https://api.stripe.com/v1/stripecli/sessions": dial tcp: lookup api.stripe.com: no such host
```

## Solutions (Try in Order)

### 🚀 **Quick Start (Skip Webhooks for Now)**

1. **Set up your backend without webhooks:**
   ```bash
   cd backend
   
   # Install dependencies
   npm install
   
   # Edit the .env file I just created
   # Replace the placeholder values with your actual Stripe keys
   ```

2. **Get your Stripe keys:**
   - Go to https://dashboard.stripe.com/apikeys
   - Copy your "Publishable key" (starts with `pk_test_`)
   - Copy your "Secret key" (starts with `sk_test_`)
   - Put them in `backend/.env`

3. **Start your backend:**
   ```bash
   npm run dev
   ```

4. **Test it works:**
   ```bash
   # In another terminal
   ./test-api.sh
   ```

### 🔧 **Network Troubleshooting**

If you continue having network issues:

#### Option 1: Check Network Connection
```bash
# Test if you can reach Stripe
curl -I https://api.stripe.com

# Test DNS resolution
nslookup api.stripe.com
```

#### Option 2: Use Different Network
- Try switching to a different WiFi network
- Try using mobile hotspot
- Check if you're behind a corporate firewall

#### Option 3: Manual Webhook Testing
Instead of `stripe listen`, you can:
1. Use Stripe's webhook testing in the dashboard
2. Use ngrok to expose your local server:
   ```bash
   # Install ngrok
   brew install ngrok
   
   # Expose your local server
   ngrok http 3001
   
   # Use the ngrok URL for webhooks in Stripe dashboard
   ```

### 🎯 **What You Can Test Without Webhooks**

Even without webhooks working, you can still test:

1. **Creating checkout sessions** ✅
2. **Redirecting to Stripe** ✅  
3. **Completing payments** ✅
4. **Manual credit addition** (temporarily)

### 📝 **Temporary Credit Addition**

Until webhooks work, you can manually add credits by calling:
```bash
# After a successful payment, manually add credits
curl -X POST http://localhost:3001/api/user/YOUR_USER_ID/add-credits \
  -H "Content-Type: application/json" \
  -d '{"credits": 50}'
```

Let me add this endpoint to your server...