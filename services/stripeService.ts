import { loadStripe } from '@stripe/stripe-js';

// Replace with your actual publishable key from Stripe Dashboard
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51PaXLV2KefGXrZX2IqX3cNM7iJEfkkBN0rAquVGFtO9YG0PIwB8aCMut5OHrKVFVze82LSf8OQKKHvQYYzSol72H00EDRX0L05';
const BACKEND_URL = 'http://localhost:3001';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

/**
 * Create a checkout session and redirect user to Stripe
 */
export const purchaseCredits = async (userId: string, credits: number = 50): Promise<void> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, credits }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { sessionId } = await response.json();

    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    // Redirect to Stripe Checkout
    const result = await stripe.redirectToCheckout({
      sessionId: sessionId,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Get user's current credit balance from backend
 */
export const getUserCredits = async (userId: string): Promise<number> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/user/${userId}/credits`);

    if (!response.ok) {
      throw new Error('Failed to fetch user credits');
    }

    const { credits } = await response.json();
    return credits;
  } catch (error) {
    console.error('Error fetching user credits:', error);
    throw error;
  }
};

/**
 * Get checkout session details (for success page)
 */
export const getCheckoutSession = async (sessionId: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/checkout-session/${sessionId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch checkout session');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching checkout session:', error);
    throw error;
  }
};

/**
 * Make a secure API call to edit image (via backend proxy)
 */
export const editImageSecure = async (
  userId: string,
  image: File,
  prompt: string,
  hotspot: { x: number; y: number }
): Promise<{ editedImage: string; creditsRemaining: number }> => {
  try {
    // Convert file to base64 for API transmission
    const imageBase64 = await fileToBase64(image);

    const response = await fetch(`${BACKEND_URL}/api/gemini/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        image: imageBase64,
        prompt,
        hotspot
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to edit image');
    }

    const result = await response.json();
    return {
      editedImage: result.editedImage,
      creditsRemaining: result.creditsRemaining
    };
  } catch (error) {
    console.error('Error editing image:', error);
    throw error;
  }
};

/**
 * Helper function to convert File to base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Generate a simple user ID (replace with real authentication later)
 */
export const generateUserId = (): string => {
  const stored = localStorage.getItem('nb_userId');
  if (stored) {
    return stored;
  }

  const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem('nb_userId', newId);
  return newId;
};