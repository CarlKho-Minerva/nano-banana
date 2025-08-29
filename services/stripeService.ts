/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { loadStripe } from '@stripe/stripe-js';
import { imageStateManager, type ImageState } from '../utils/security';

// Replace with your actual publishable key from Stripe Dashboard
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51PaXLV2KefGXrZX2IqX3cNM7iJEfkkBN0rAquVGFtO9YG0PIwB8aCMut5OHrKVFVze82LSf8OQKKHvQYYzSol72H00EDRX0L05';
const BACKEND_URL = 'http://localhost:3001';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

/**
 * Creates a checkout session via the backend.
 * This function now RETURNS the checkout URL instead of redirecting.
 * @returns {Promise<string>} The URL to redirect the user to for payment.
 */
export const purchaseCredits = async (
  userId: string,
  credits: number = 50,
  imageState?: Omit<ImageState, 'timestamp'>,
  sessionId?: string
): Promise<string> => {
  try {
    // Save image state before creating the session. This is the critical first step.
    if (imageState) {
      console.log('💾 Preserving image state before payment...');
      const saveSuccess = await imageStateManager.saveImageState(imageState);
      if (!saveSuccess) {
        // If saving fails, we should not proceed to payment to avoid data loss.
        throw new Error('Could not save your current editing session. Please try again.');
      }
      console.log('✅ Image state preserved successfully.');
    }

    const response = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        credits,
        sessionId: sessionId || imageState?.sessionId
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { url } = await response.json();

    if (!url) {
        throw new Error('Backend did not return a checkout URL.');
    }

    console.log('✅ Checkout session created. URL received.');
    return url; // Return the URL for the component to handle redirection.

  } catch (error) {
    console.error('❌ Error in purchaseCredits service:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend server at ${BACKEND_URL}. Make sure the backend is running.`);
    }

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
 * Gets the user's stable ID from localStorage, or creates a new one if it doesn't exist.
 * This is the single source of truth for the user's identity.
 */
export const getUserId = (): string => {
  const USER_ID_KEY = 'pixshop_user_id';
  let userId = localStorage.getItem(USER_ID_KEY);
  
  if (!userId) {
    userId = `user_${Math.random().toString(36).substring(2)}_${Date.now().toString(36)}`;
    localStorage.setItem(USER_ID_KEY, userId);
    console.log('🔑 New User ID generated:', userId);
  }
  
  return userId;
};