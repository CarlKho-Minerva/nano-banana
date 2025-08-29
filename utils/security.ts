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
    }
  },
  
  getItem: (key: string): any => {
    try {
      const obfuscated = localStorage.getItem(`nb_${key}`);
      if (!obfuscated) {
        console.log('🔍 No data found for key:', `nb_${key}`);
        return null;
      }
      
      const dataStr = simpleDeobfuscate(obfuscated);
      if (!dataStr) {
        console.log('🔍 Failed to deobfuscate data for key:', `nb_${key}`);
        return null;
      }
      
      const data = JSON.parse(dataStr);
      
      // Check expiration
      if (data.expires && Date.now() > data.expires) {
        console.log('🔍 Data expired for key:', `nb_${key}`, 'expired at:', new Date(data.expires));
        localStorage.removeItem(`nb_${key}`);
        return null;
      }
      
      console.log('🔍 Successfully retrieved data for key:', `nb_${key}`);
      return data.value;
    } catch (error) {
      console.log('🔍 Error retrieving data for key:', `nb_${key}`, error);
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

// Image state preservation utilities
export interface ImageState {
  currentImage: string; // base64
  originalImage: string; // base64
  history: string[]; // base64 array
  historyIndex: number;
  editHotspot: { x: number, y: number } | null;
  activeTab: string;
  prompt: string;
  timestamp: number;
  sessionId: string; // unique session identifier
  userId: string; // user identifier
}

export const imageStateManager = {
  // Compress base64 image data to reduce storage size
  compressImage: (base64: string, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1024x1024 for storage)
        const maxSize = 1024;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } else {
          resolve(base64);
        }
      };
      
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  },

  // Generate unique session ID
  generateSessionId: (): string => {
    return `session_${Math.random().toString(36).substring(2)}_${Date.now().toString(36)}`;
  },

  // Save image state before payment redirect
  saveImageState: async (imageState: Omit<ImageState, 'timestamp'>): Promise<boolean> => {
    try {
      
      // Compress images to reduce storage footprint
      const compressedState: ImageState = {
        ...imageState,
        currentImage: await imageStateManager.compressImage(imageState.currentImage),
        originalImage: await imageStateManager.compressImage(imageState.originalImage),
        history: await Promise.all(
          imageState.history.map(img => imageStateManager.compressImage(img))
        ),
        timestamp: Date.now()
      };
      
      // Calculate storage size
      const stateSize = JSON.stringify(compressedState).length;
      
      // Use session-based key for storage
      const storageKey = `imageState_${imageState.userId}_${imageState.sessionId}`;
      
      
      // Check localStorage capacity (approximate 5MB limit)
      const maxSize = 4 * 1024 * 1024; // 4MB to be safe
      if (stateSize > maxSize) {
        
        // Try with lower quality compression
        const lowerQualityState = {
          ...compressedState,
          currentImage: await imageStateManager.compressImage(imageState.currentImage, 0.6),
          originalImage: await imageStateManager.compressImage(imageState.originalImage, 0.6),
          history: await Promise.all(
            imageState.history.map(img => imageStateManager.compressImage(img, 0.6))
          )
        };
        
        secureStorage.setItem(storageKey, lowerQualityState, 10080); // 7 days expiry
      } else {
        secureStorage.setItem(storageKey, compressedState, 10080); // 7 days expiry
      }
      
      // Also save a reference to the latest session for this user
      secureStorage.setItem(`latestSession_${imageState.userId}`, imageState.sessionId, 10080); // 7 days expiry
      
      return true;
    } catch (error) {
      console.error('❌ Failed to save image state:', error);
      return false;
    }
  },

  // Restore image state by session ID
  restoreImageStateBySession: (userId: string, sessionId: string): ImageState | null => {
    try {
      const storageKey = `imageState_${userId}_${sessionId}`;
      const state = secureStorage.getItem(storageKey);
      
      if (state && imageStateManager.validateImageState(state)) {
        return state;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to restore image state:', error);
      return null;
    }
  },

  // Restore latest image state for user (fallback)
  restoreLatestImageState: (userId: string): ImageState | null => {
    try {
      
      // Get the latest session ID for this user
      const latestSessionId = secureStorage.getItem(`latestSession_${userId}`);
      
      if (latestSessionId) {
        return imageStateManager.restoreImageStateBySession(userId, latestSessionId);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to restore latest image state:', error);
      return null;
    }
  },

  // Legacy method for backward compatibility
  restoreImageState: (): ImageState | null => {
    try {
      const state = secureStorage.getItem('imageState');
      
      if (state && imageStateManager.validateImageState(state)) {
        return state;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to restore legacy image state:', error);
      return null;
    }
  },

  // Clear saved image state by session
  clearImageState: (userId?: string, sessionId?: string): void => {
    try {
      if (userId && sessionId) {
        const storageKey = `imageState_${userId}_${sessionId}`;
        secureStorage.removeItem(storageKey);
        secureStorage.removeItem(`latestSession_${userId}`);
      } else {
        // Legacy cleanup
        secureStorage.removeItem('imageState');
      }
    } catch (error) {
      console.error('❌ Failed to clear image state:', error);
    }
  },

  // Clean up expired sessions for a user
  cleanExpiredSessions: (userId: string): void => {
    try {
      const keys = Object.keys(localStorage);
      let cleaned = 0;
      
      keys.forEach(key => {
        if (key.startsWith(`nb_imageState_${userId}_`)) {
          try {
            const obfuscated = localStorage.getItem(key);
            if (obfuscated) {
              const dataStr = secureStorage.getItem(key.replace('nb_', ''));
              if (!dataStr) {
                localStorage.removeItem(key);
                cleaned++;
              }
            }
          } catch {
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      });
      
      if (cleaned > 0) {
      }
    } catch (error) {
      console.error('❌ Failed to clean expired sessions:', error);
    }
  },

  // Validate image state structure and data
  validateImageState: (state: any): state is ImageState => {
    if (!state || typeof state !== 'object') return false;
    
    // Required fields for new format
    const newRequired = ['currentImage', 'originalImage', 'history', 'historyIndex', 'timestamp', 'sessionId', 'userId'];
    const hasNewRequired = newRequired.every(key => key in state);
    
    // Required fields for legacy format
    const legacyRequired = ['currentImage', 'originalImage', 'history', 'historyIndex', 'timestamp'];
    const hasLegacyRequired = legacyRequired.every(key => key in state);
    
    if (!hasNewRequired && !hasLegacyRequired) {
      return false;
    }
    
    // Validate base64 format
    const base64Regex = /^data:image\/(jpeg|jpg|png|webp);base64,/;
    if (!base64Regex.test(state.currentImage) || !base64Regex.test(state.originalImage)) {
      return false;
    }
    
    // Check if state is too old (older than 2 hours)
    const twoHours = 2 * 60 * 60 * 1000;
    if (Date.now() - state.timestamp > twoHours) {
      return false;
    }
    
    return true;
  },

  // Convert File to base64
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  },

  // Convert base64 to File
  base64ToFile: (base64: string, filename: string): File => {
    const arr = base64.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type");
    
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, {type: mime});
  },

  // Get all sessions for a user (for recent sessions list)
  getAllUserSessions: (userId: string): ImageState[] => {
    try {
      const sessions: ImageState[] = [];
      const keys = Object.keys(localStorage);
      
      console.log('🔍 DEBUG getAllUserSessions:', {
        userId,
        totalKeys: keys.length,
        sampleKeys: keys.filter(k => k.includes('imageState')).slice(0, 5)
      });
      
      // Find all session keys for this user (accounting for nb_ prefix from secureStorage)
      const userSessionKeys = keys.filter(key => 
        key.includes(`imageState_${userId}_`) && key.includes('session_')
      );
      
      console.log('🔍 Found matching keys:', userSessionKeys);
      
      // Get each session state
      for (const key of userSessionKeys) {
        console.log('🔍 Trying to get state for key:', key);
        // Remove the nb_ prefix since secureStorage.getItem adds it
        const keyWithoutPrefix = key.replace('nb_', '');
        const state = secureStorage.getItem(keyWithoutPrefix);
        console.log('🔍 Retrieved state:', !!state, state ? 'valid' : 'null');
        
        if (state) {
          console.log('🔍 State validation:', imageStateManager.validateImageState(state));
          if (imageStateManager.validateImageState(state)) {
            sessions.push(state);
            console.log('✅ Added session:', state.sessionId);
          }
        }
      }
      
      console.log('🔍 Final sessions array:', sessions.length, sessions.map(s => s.sessionId));
      
      // Sort by timestamp (newest first)
      sessions.sort((a, b) => b.timestamp - a.timestamp);
      
      // Return up to 10 most recent sessions
      return sessions.slice(0, 10);
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }
};