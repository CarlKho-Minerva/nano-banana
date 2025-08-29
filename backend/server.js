// Load environment variables FIRST - look in parent directory
require('dotenv').config({ path: '../.env' });

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Add request logging
app.use((req, res, next) => {
  next();
});

// Middleware - IMPORTANT ORDER!
// Webhook needs raw body, so it comes first
app.use('/webhook', express.raw({type: 'application/json'}));
// All other routes use JSON parsing
app.use(express.json({ limit: '10mb' })); // Increase limit for images

// Simple in-memory user storage (replace with database in production)
const users = new Map();

// Helper function to get or create user
const getUser = (userId) => {
  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      credits: 3, // 3 free credits to start
      createdAt: new Date(),
      purchases: []
    });
  }
  return users.get(userId);
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running!',
    timestamp: new Date().toISOString(),
    users: users.size
  });
});

// Get user credits
app.get('/api/user/:userId/credits', (req, res) => {
  try {
    const { userId } = req.params;
    const user = getUser(userId);
    res.json({ credits: user.credits });
  } catch (error) {
    console.error('Error getting user credits:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual credit addition (for testing without webhooks)
app.post('/api/user/:userId/add-credits', (req, res) => {
  try {
    const { userId } = req.params;
    const { credits } = req.body;
    
    if (!credits || credits <= 0) {
      return res.status(400).json({ error: 'Valid credit amount is required' });
    }
    
    const user = getUser(userId);
    user.credits += credits;
    
    res.json({ 
      message: `Added ${credits} credits`, 
      totalCredits: user.credits 
    });
  } catch (error) {
    console.error('Error adding credits:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { userId, credits = 50, sessionId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const priceInCents = Math.round(credits * 10); // 10 cents per credit

    // Build success URL with session ID in path
    let successUrl, cancelUrl;
    
    if (sessionId) {
      successUrl = `${process.env.FRONTEND_URL}/edit/${sessionId}?payment=success&session_id={CHECKOUT_SESSION_ID}&user_id=${userId}`;
      cancelUrl = `${process.env.FRONTEND_URL}/edit/${sessionId}?payment=cancelled`;
    } else {
      // Fallback for purchases without active editing session
      successUrl = `${process.env.FRONTEND_URL}/?payment=success&session_id={CHECKOUT_SESSION_ID}&user_id=${userId}`;
      cancelUrl = `${process.env.FRONTEND_URL}/?payment=cancelled`;
    }


    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'NanoBanana Credits',
              description: `${credits} AI image editing credits`,
              images: ['https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Credits'],
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        credits: credits.toString(),
        editingSession: sessionId || ''
      }
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook endpoint - handles payment confirmation
app.post('/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.metadata.userId;
      const credits = parseInt(session.metadata.credits);


      // Add credits to user account
      const user = getUser(userId);
      user.credits += credits;
      user.purchases.push({
        sessionId: session.id,
        credits: credits,
        amount: session.amount_total,
        timestamp: new Date()
      });

      break;

    case 'payment_intent.succeeded':
      break;

    default:
  }

  res.json({received: true});
});

// Proxy endpoint for Gemini API calls (secure)
app.post('/api/gemini/edit', async (req, res) => {
  try {
    const { userId, image, prompt, hotspot } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check user credits
    const user = getUser(userId);
    if (user.credits <= 0) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    // TODO: Implement actual Gemini API call here
    // For now, return a mock response

    // Deduct credit
    user.credits -= 1;

    // Mock successful response (replace with actual Gemini API call)
    const mockEditedImage = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;

    res.json({
      success: true,
      editedImage: mockEditedImage,
      creditsRemaining: user.credits
    });

  } catch (error) {
    console.error('Error processing Gemini API call:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get checkout session details (for success page)
app.get('/api/checkout-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {

  if (!process.env.STRIPE_SECRET_KEY) {
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
  }
});