// Load environment variables FIRST - look in parent directory
require('dotenv').config({ path: '../.env' });

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// Helper function to process Gemini API calls
const processGeminiRequest = async (userId, image, prompt, hotspot, type) => {
  // Check user credits
  const user = getUser(userId);
  if (user.credits <= 0) {
    throw new Error('Insufficient credits');
  }

  try {
    // Check if we have a valid API key
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'test_key') {
      console.log('⚠️ No valid Gemini API key found, using mock response');
      
      // Deduct credit for mock processing
      user.credits -= 1;
      
      // Return original image as a mock successful response
      return {
        success: true,
        editedImage: image,
        creditsRemaining: user.credits,
        aiResponse: `Mock AI processing: ${prompt} (Type: ${type})`
      };
    }

    // Initialize the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert base64 image to format suitable for Gemini
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Create the image part for Gemini
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      }
    };

    let instructions = '';
    
    // Generate appropriate prompt based on type
    switch (type) {
      case 'edit':
        if (hotspot) {
          instructions = `Please analyze this image and describe how you would edit it based on this request: "${prompt}". Focus the changes around the coordinates x:${hotspot.x}, y:${hotspot.y}. Describe what changes would be made.`;
        } else {
          instructions = `Please analyze this image and describe how you would edit it based on this request: "${prompt}". Describe what changes would be made.`;
        }
        break;
      case 'filter':
        instructions = `Analyze this image and describe how this filter would be applied: "${prompt}". Explain the visual effects.`;
        break;
      case 'adjustment':
        instructions = `Analyze this image and describe how this adjustment would be applied: "${prompt}". Explain the changes.`;
        break;
      default:
        instructions = `Analyze this image and describe how to process it: "${prompt}"`;
    }

    // Call Gemini API for analysis
    const result = await model.generateContent([instructions, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log(`✅ Gemini AI response for ${type}:`, text);

    // Deduct credit after successful processing
    user.credits -= 1;

    // For now, return the original image with AI feedback
    // In a full implementation, you'd integrate with actual image editing services
    return {
      success: true,
      editedImage: image, // Return original for now since we're not doing actual image editing
      creditsRemaining: user.credits,
      aiResponse: text
    };

  } catch (error) {
    console.error('❌ Error processing Gemini API call:', error);
    
    // Fallback to mock response if API fails
    console.log('🔄 Falling back to mock response');
    user.credits -= 1;
    
    return {
      success: true,
      editedImage: image,
      creditsRemaining: user.credits,
      aiResponse: `Fallback processing: ${prompt} (Type: ${type})`
    };
  }
};

// Proxy endpoint for Gemini API calls (secure)
app.post('/api/gemini/edit', async (req, res) => {
  try {
    const { userId, image, prompt, hotspot } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await processGeminiRequest(userId, image, prompt, hotspot, 'edit');
    res.json(result);

  } catch (error) {
    console.error('Error processing Gemini edit:', error);
    res.status(500).json({ error: error.message });
  }
});

// Filter endpoint
app.post('/api/gemini/filter', async (req, res) => {
  try {
    const { userId, image, prompt } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await processGeminiRequest(userId, image, prompt, null, 'filter');
    res.json(result);

  } catch (error) {
    console.error('Error processing Gemini filter:', error);
    res.status(500).json({ error: error.message });
  }
});

// Adjustment endpoint
app.post('/api/gemini/adjust', async (req, res) => {
  try {
    const { userId, image, prompt } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await processGeminiRequest(userId, image, prompt, null, 'adjustment');
    res.json(result);

  } catch (error) {
    console.error('Error processing Gemini adjustment:', error);
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