/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// 🔒 SECURE: All AI processing now happens on the backend
// No more exposed API keys in the frontend!

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Import getUserId function
import { getUserId } from './stripeService';

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Generates an edited image using the secure backend API.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired edit.
 * @param hotspot The {x, y} coordinates on the image to focus the edit.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    hotspot: { x: number, y: number }
): Promise<string> => {
    try {
        // Convert file to base64 for API transmission
        const imageBase64 = await fileToBase64(originalImage);

        const response = await fetch(`${BACKEND_URL}/api/gemini/edit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: getUserId(),
                image: imageBase64,
                prompt: userPrompt,
                hotspot,
                type: 'edit'
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to edit image');
        }

        const result = await response.json();
        return result.editedImage;
    } catch (error) {
        console.error('Error editing image:', error);
        throw error;
    }
};

/**
 * Generates an image with a filter applied using the secure backend API.
 * @param originalImage The original image file.
 * @param filterPrompt The text prompt describing the desired filter.
 * @returns A promise that resolves to the data URL of the filtered image.
 */
export const generateFilteredImage = async (
    originalImage: File,
    filterPrompt: string,
): Promise<string> => {
    try {
        // Convert file to base64 for API transmission
        const imageBase64 = await fileToBase64(originalImage);

        const response = await fetch(`${BACKEND_URL}/api/gemini/filter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: getUserId(),
                image: imageBase64,
                prompt: filterPrompt,
                type: 'filter'
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to apply filter');
        }

        const result = await response.json();
        return result.editedImage;
    } catch (error) {
        console.error('Error applying filter:', error);
        throw error;
    }
};

/**
 * Generates an image with a global adjustment applied using the secure backend API.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
): Promise<string> => {
    try {
        // Convert file to base64 for API transmission
        const imageBase64 = await fileToBase64(originalImage);

        const response = await fetch(`${BACKEND_URL}/api/gemini/adjust`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: getUserId(),
                image: imageBase64,
                prompt: adjustmentPrompt,
                type: 'adjustment'
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to apply adjustment');
        }

        const result = await response.json();
        return result.editedImage;
    } catch (error) {
        console.error('Error applying adjustment:', error);
        throw error;
    }
};