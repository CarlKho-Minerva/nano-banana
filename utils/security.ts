/**
 * Security utilities for input validation and sanitization
 */

export const sanitizePrompt = (prompt: string): string => {
  // Remove potentially harmful characters and limit length
  const MAX_PROMPT_LENGTH = 500;
  const sanitized = prompt
    .replace(/[<>\"'&]/g, '') // Remove HTML/script injection chars
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim()
    .substring(0, MAX_PROMPT_LENGTH);
  
  return sanitized;
};

export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_DIMENSIONS = { width: 4096, height: 4096 };
  
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please upload a valid image file (JPEG, PNG, or WebP)'
    };
  }
  
  // Check file size
  if (file.size > MAX_SIZE) {
    return {
      isValid: false,
      error: 'File size must be less than 10MB'
    };
  }
  
  // Check if file has suspicious extensions in name
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.jar'];
  const fileName = file.name.toLowerCase();
  if (suspiciousExtensions.some(ext => fileName.includes(ext))) {
    return {
      isValid: false,
      error: 'Invalid file name detected'
    };
  }
  
  return { isValid: true };
};

export const validateImageDimensions = (file: File): Promise<{ isValid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_DIMENSIONS = { width: 4096, height: 4096 };
      
      if (img.width > MAX_DIMENSIONS.width || img.height > MAX_DIMENSIONS.height) {
        resolve({
          isValid: false,
          error: `Image dimensions must be less than ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height} pixels`
        });
      } else {
        resolve({ isValid: true });
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: 'Invalid image file'
      });
    };
    
    img.src = url;
  });
};

// Rate limiting utility
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  
  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the time window
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const userRequests = this.requests.get(identifier) || [];
    const now = Date.now();
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

export const apiRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

// Secure localStorage wrapper
export const secureStorage = {
  setItem: (key: string, value: any): void => {
    try {
      const encrypted = btoa(JSON.stringify(value)); // Basic encoding (not secure encryption)
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.warn('Failed to store data securely:', error);
    }
  },
  
  getItem: (key: string): any => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return JSON.parse(atob(encrypted));
    } catch (error) {
      console.warn('Failed to retrieve data securely:', error);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },
  
  clear: (): void => {
    localStorage.clear();
  }
};