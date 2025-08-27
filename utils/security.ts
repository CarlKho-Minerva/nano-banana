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

// Session management for enhanced security
export const sessionManager = {
  generateSessionId: (): string => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  },
  
  initializeSession: (): void => {
    const existingSession = secureStorage.getItem('sessionId');
    if (!existingSession) {
      const sessionId = sessionManager.generateSessionId();
      secureStorage.setItem('sessionId', sessionId, 480); // 8 hours session
    }
    
    // Set last activity timestamp
    secureStorage.setItem('lastActivity', Date.now(), 480);
  },
  
  updateActivity: (): void => {
    secureStorage.setItem('lastActivity', Date.now(), 480);
  },
  
  isSessionValid: (): boolean => {
    const sessionId = secureStorage.getItem('sessionId');
    const lastActivity = secureStorage.getItem('lastActivity');
    const now = Date.now();
    
    if (!sessionId || !lastActivity) return false;
    
    // Session expires after 30 minutes of inactivity
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
    return (now - lastActivity) < INACTIVITY_TIMEOUT;
  },
  
  clearSession: (): void => {
    secureStorage.removeItem('sessionId');
    secureStorage.removeItem('lastActivity');
    secureStorage.clear(); // Clear all app data
  }
};

// Simple XOR-based obfuscation for client-side data
// NOTE: This is obfuscation, not encryption - do not store truly sensitive data
const simpleObfuscate = (data: string): string => {
  const key = 'NanoBananaSecure2024'; // Static key for obfuscation
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
};

const simpleDeobfuscate = (obfuscated: string): string => {
  try {
    const data = atob(obfuscated);
    const key = 'NanoBananaSecure2024';
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return '';
  }
};

// Enhanced localStorage wrapper with expiration and better obfuscation
export const secureStorage = {
  setItem: (key: string, value: any, expirationMinutes?: number): void => {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        expires: expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : null
      };
      const obfuscated = simpleObfuscate(JSON.stringify(data));
      localStorage.setItem(`nb_${key}`, obfuscated);
    } catch (error) {
      console.warn('Failed to store data securely:', error);
    }
  },
  
  getItem: (key: string): any => {
    try {
      const obfuscated = localStorage.getItem(`nb_${key}`);
      if (!obfuscated) return null;
      
      const dataStr = simpleDeobfuscate(obfuscated);
      if (!dataStr) return null;
      
      const data = JSON.parse(dataStr);
      
      // Check expiration
      if (data.expires && Date.now() > data.expires) {
        localStorage.removeItem(`nb_${key}`);
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.warn('Failed to retrieve data securely:', error);
      // Clean up corrupted data
      localStorage.removeItem(`nb_${key}`);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    localStorage.removeItem(`nb_${key}`);
  },
  
  clear: (): void => {
    // Only clear our prefixed items
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('nb_')) {
        localStorage.removeItem(key);
      }
    });
  },
  
  // Clean expired items
  cleanExpired: (): void => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('nb_')) {
        try {
          const obfuscated = localStorage.getItem(key);
          if (obfuscated) {
            const dataStr = simpleDeobfuscate(obfuscated);
            if (dataStr) {
              const data = JSON.parse(dataStr);
              if (data.expires && Date.now() > data.expires) {
                localStorage.removeItem(key);
              }
            }
          }
        } catch {
          // Remove corrupted data
          localStorage.removeItem(key);
        }
      }
    });
  }
};