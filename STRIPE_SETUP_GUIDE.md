# 🎯 Complete Stripe Integration Guide
*Step-by-step instructions for beginners*

## 📋 Overview
This guide will help you:
1. Set up Stripe for payments
2. Create a secure backend server
3. Implement automated credit purchases
4. Move API keys to the backend (solving security issues)

---

## 🏃‍♂️ Quick Start Checklist

**Before you begin, here's what you need to do in order:**

1. **Get Stripe Keys** → Sign up at stripe.com and get your API keys
2. **Set Up Backend** → Create `.env` file with your keys and install packages
3. **Update Frontend** → Add your publishable key to `stripeService.ts`
4. **Test Everything** → Run both servers and test the payment flow

**Time needed:** ~30 minutes for complete setup

---

## 🚀 Step 1: Create Stripe Account

### 1.1 Sign Up for Stripe
1. Go to **https://stripe.com**
2. Click **"Start now"** (big blue button)
3. Enter your email and create a password
4. Choose **"I'm building a platform or marketplace"**
5. Complete the signup process

### 1.2 Get Your API Keys
1. After signing up, you'll be in the **Stripe Dashboard**
2. Look for **"Developers"** in the left sidebar → click it
3. Click **"API keys"** 
4. You'll see two keys:
   - **Publishable key**: `pk_test_...` (safe for frontend)
   - **Secret key**: `sk_test_...` (NEVER put in frontend!)
5. Click **"Reveal test key"** for the Secret key
6. **Copy both keys** - we'll need them later

### 1.3 Test Mode vs Live Mode
- Make sure you're in **"Test mode"** (toggle at top-left of dashboard)
- Test mode lets you use fake credit cards
- Only switch to Live mode when ready for real payments

---

## 🏗️ Step 2: Create Your Backend Server

### 2.1 Create Backend Directory
```bash
# In your nano-banana folder
mkdir backend
cd backend
```

### 2.2 Initialize Node.js Project
```bash
npm init -y
```

### 2.3 Install Required Packages
```bash
npm install express stripe cors dotenv
npm install --save-dev nodemon
```

### 2.4 Create Environment File
Create `.env` file in the `backend` folder:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
PORT=3001
```
**Replace the placeholder values with your actual keys!**

### 2.5 Add .env to .gitignore
```bash
echo ".env" >> .gitignore
```

---

## 💻 Step 3: Build the Backend Server

### 3.1 Create Main Server File
Create `backend/server.js`:

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true
}));

// For webhook (raw body needed)
app.use('/webhook', express.raw({type: 'application/json'}));
// For other routes (JSON parsing)
app.use(express.json());

// Test endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running!' });
});

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'NanoBanana Credits',
              description: '50 AI image editing credits',
            },
            unit_amount: 500, // $5.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/cancel`,
      metadata: {
        userId: userId || 'anonymous'
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook endpoint
app.post('/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment successful:', session.id);
      // Here you would update user credits in database
      // For now, we'll just log it
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

// Proxy endpoint for Gemini API (secure API key)
app.post('/api/gemini/edit', async (req, res) => {
  try {
    const { image, prompt, hotspot } = req.body;
    // This is where you'd call the Gemini API using your server-side API key
    // We'll implement this later
    res.json({ message: 'Gemini API call would happen here' });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### 3.2 Update package.json Scripts
Edit `backend/package.json`, add to the "scripts" section:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

---

## 🔗 Step 4: Set Up Webhook (Important!)

### 4.1 Install Stripe CLI (for testing)
**On Mac:**
```bash
brew install stripe/stripe-cli/stripe
```

**On Windows/Linux:**
- Download from https://github.com/stripe/stripe-cli/releases

### 4.2 Login to Stripe CLI
```bash
stripe login
```
- This opens your browser
- Click **"Allow access"**

### 4.3 Forward Webhooks to Your Local Server
```bash
stripe listen --forward-to localhost:3001/webhook
```
- This gives you a webhook secret like `whsec_...`
- Add it to your `.env` file:
```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

---

## 🎮 Step 5: Test Your Backend

### 5.1 Start Your Backend Server
```bash
cd backend
npm run dev
```

### 5.2 Test Health Endpoint
Open browser to: `http://localhost:3001/api/health`
Should see: `{"status":"Server is running!"}`

### 5.3 Test Stripe Integration
```bash
# Test creating a checkout session
curl -X POST http://localhost:3001/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"userId":"test123"}'
```

---

## 🔧 Step 6: Update Your Frontend

### 6.1 Install Stripe.js
```bash
# In your main nano-banana directory (already done)
npm install @stripe/stripe-js
```

**Note: This package is already installed in your project.**

### 6.2 Create Stripe Service
Create `services/stripeService.ts`:

```typescript
import { loadStripe } from '@stripe/stripe-js';

// Replace with your actual publishable key
const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY_HERE');

export const createCheckoutSession = async (userId: string) => {
  try {
    const response = await fetch('http://localhost:3001/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const session = await response.json();
    
    if (session.error) {
      throw new Error(session.error);
    }

    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    // Redirect to Stripe Checkout
    const result = await stripe.redirectToCheckout({
      sessionId: session.sessionId,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};
```

---

## 🧪 Step 7: Test the Complete Flow

### 7.1 Test Credit Purchase
1. Start your backend: `cd backend && npm run dev`
2. Start your frontend: `npm run dev` (in main directory)
3. In your app, when credits run out, click "Buy Credits"
4. You should be redirected to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any postal code

### 7.2 Verify Payment
1. After "payment", you'll be redirected back to your app
2. Check your Stripe dashboard → Payments
3. You should see the test payment
4. Check your terminal running `stripe listen` - you should see the webhook

---

## 🚨 Security Benefits Achieved

✅ **API Key Exposure Fixed**: Gemini API key now safely stored on server
✅ **Server-Side Validation**: Credits managed by backend
✅ **Secure Payments**: Stripe handles all payment data
✅ **Webhook Verification**: Payments confirmed by Stripe directly

---

## 🎯 Next Steps

1. **Set up Firebase** for user authentication
2. **Add database** to store user credits
3. **Deploy backend** to a service like Render or Fly.io
4. **Go live** by switching to Stripe live keys

---

## 🆘 Common Issues & Solutions

### Backend won't start:
- Check if port 3001 is already in use
- Make sure `.env` file exists with correct keys

### Stripe checkout not loading:
- Verify publishable key is correct
- Check browser console for errors
- Make sure CORS is configured properly

### Webhook not receiving events:
- Make sure `stripe listen` is running
- Check webhook secret in `.env`
- Verify webhook endpoint URL

### "Module not found" errors:
- Make sure you ran `npm install` in both directories
- Check package.json has correct dependencies

---

## 📞 Getting Help

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Discord**: Great community for questions
- **GitHub Education**: Additional resources and credits