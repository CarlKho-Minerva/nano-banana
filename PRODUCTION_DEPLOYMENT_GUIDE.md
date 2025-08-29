# Production Deployment Guide

This guide will help you deploy NanoBanana to production with proper environment variables and live Stripe integration.

## 🚀 Pre-Deployment Checklist

- [x] Console logs cleaned from codebase
- [x] Compelling headline added
- [x] Mobile responsiveness verified  
- [x] Favicon created
- [x] Environment variables configured for production

## 📋 Environment Variables Setup

### Backend Environment Variables

Your backend (Node.js server) needs these environment variables in production:

```bash
# Stripe Configuration (LIVE MODE)
STRIPE_SECRET_KEY=sk_live_XXXXXX  # Get from Stripe Dashboard > Live Mode
STRIPE_WEBHOOK_SECRET=whsec_XXXXXX  # Create new webhook for production

# Google AI Configuration
GEMINI_API_KEY=XXXXXX  # Your Google AI API key

# Frontend URL
FRONTEND_URL=https://your-app-name.vercel.app  # Replace with your actual frontend URL

# Optional: Port (if not using default)
PORT=3001
```

### Frontend Environment Variables

Your frontend (Vite/React app) needs these environment variables:

```bash
# Stripe Configuration (LIVE MODE)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXX  # Get from Stripe Dashboard > Live Mode

# Backend URL  
VITE_BACKEND_URL=https://your-backend-name.onrender.com  # Replace with your actual backend URL

# Google AI Configuration
VITE_API_KEY=XXXXXX  # Your Google AI API key (same as GEMINI_API_KEY)
```

## 🏗️ Deployment Platforms

### Option 1: Vercel (Frontend) + Render (Backend)

#### Deploy Frontend to Vercel:
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Set environment variables in Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add each `VITE_` variable from above
4. Deploy

#### Deploy Backend to Render:
1. Create new Web Service on Render
2. Connect your GitHub repo
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && node server.js`
5. Set environment variables in Render dashboard
6. Deploy

### Option 2: Railway (Full Stack)

1. Connect your GitHub repo to Railway
2. Railway will auto-detect both frontend and backend
3. Set environment variables in Railway dashboard
4. Deploy both services

### Option 3: Heroku (Backend) + Netlify (Frontend)

Similar process - connect repos and set environment variables in each platform's dashboard.

## 💳 Stripe Live Mode Setup

### CRITICAL: Switch to Live Mode

1. **Go to Stripe Dashboard**
2. **Toggle from "Test mode" to "Live mode"** (top right corner)
3. **Get Live API Keys:**
   - Dashboard > Developers > API keys
   - Copy `Publishable key` (starts with `pk_live_`)
   - Copy `Secret key` (starts with `sk_live_`)

### Create Live Webhook

1. **In Stripe Dashboard (Live Mode):**
   - Go to Developers > Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-backend-url.com/webhook`
   - Events to send: Select `checkout.session.completed`
   - Copy the webhook signing secret (starts with `whsec_`)

## 🔧 Platform-Specific Instructions

### Vercel Environment Variables
```bash
# In Vercel Dashboard > Your Project > Settings > Environment Variables
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXX
VITE_BACKEND_URL=https://your-backend.onrender.com
VITE_API_KEY=XXXXXX
```

### Render Environment Variables
```bash
# In Render Dashboard > Your Service > Environment
STRIPE_SECRET_KEY=sk_live_XXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXX
GEMINI_API_KEY=XXXXXX
FRONTEND_URL=https://your-app.vercel.app
PORT=3001
```

### Railway Environment Variables
```bash
# Backend service variables:
STRIPE_SECRET_KEY=sk_live_XXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXX
GEMINI_API_KEY=XXXXXX
FRONTEND_URL=https://your-app.railway.app

# Frontend service variables:
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXX
VITE_BACKEND_URL=https://backend-production-XXXX.railway.app
VITE_API_KEY=XXXXXX
```

## ✅ Post-Deployment Verification

### 1. Test Basic Functionality
- [ ] Website loads correctly
- [ ] Image upload works
- [ ] File validation works
- [ ] Mobile layout looks good

### 2. Test Stripe Integration
- [ ] Credit purchase button works
- [ ] Redirects to Stripe checkout
- [ ] Test with Stripe test card: `4242 4242 4242 4242`
- [ ] Successfully redirects back after payment
- [ ] Credits are added to user account
- [ ] Webhook receives payment confirmation

### 3. Test AI Integration
- [ ] Image editing requests work
- [ ] Credits are deducted properly
- [ ] Edited images are returned

## 🔐 Security Notes

1. **Never commit secrets to git**
2. **Use different API keys for test vs live**
3. **Verify webhook signatures**
4. **Use HTTPS in production**
5. **Keep backups of your environment variables**

## 🆘 Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure `FRONTEND_URL` exactly matches your deployed frontend URL
2. **Stripe Webhooks Failing**: Verify webhook URL and signing secret
3. **Environment Variables Not Loading**: Check variable names match exactly (case-sensitive)
4. **404 Errors**: Verify your backend routes match the frontend API calls

### Debug Steps:
1. Check browser console for errors
2. Check server logs in hosting platform
3. Verify environment variables are set correctly
4. Test API endpoints directly with curl/Postman

## 🎉 You're Live!

Once deployed successfully, your Magic Eraser app will be:
- ✅ Live on the internet
- ✅ Accepting real payments via Stripe
- ✅ Processing images with AI
- ✅ Mobile-responsive
- ✅ Professional-looking

Share your live URL and start getting users! 🚀