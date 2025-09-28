/**
 * Global API Rate Limiter and Request Deduplication System
 * Prevents excessive CoinGecko API requests
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  cooldownMs: number;
  hasApiKey: boolean;
}

class APIRateLimiter {
  private static instance: APIRateLimiter;
  private pendingRequests = new Map<string, PendingRequest>();
  private requestHistory: number[] = [];
  private isCooldown = false;
  private cooldownTimeout: NodeJS.Timeout | null = null;

  // CoinGecko rate limits: 10-50 calls/minute for free tier, 500 calls/minute for pro
  private readonly config: RateLimitConfig = {
    maxRequests: this.getMaxRequests(),
    windowMs: 60 * 1000, // 1 minute window
    cooldownMs: this.getCooldownMs(),
    hasApiKey: this.hasApiKey(),
  };

  static getInstance(): APIRateLimiter {
    if (!APIRateLimiter.instance) {
      APIRateLimiter.instance = new APIRateLimiter();
    }
    return APIRateLimiter.instance;
  }

  private constructor() {
    // Clean up old request history every minute
    setInterval(() => {
      this.cleanupRequestHistory();
    }, 60 * 1000);
  }

  private hasApiKey(): boolean {
    return !!process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
  }

  private getMaxRequests(): number {
    // Free tier: 30 calls/minute (conservative)
    // Pro tier: 100 calls/minute (conservative for 500 limit)
    return this.hasApiKey() ? 100 : 30;
  }

  private getCooldownMs(): number {
    // Shorter cooldown with API key
    return this.hasApiKey() ? 1000 : 2000;
  }

  private cleanupRequestHistory(): void {
    const cutoff = Date.now() - this.config.windowMs;
    this.requestHistory = this.requestHistory.filter(timestamp => timestamp > cutoff);
  }

  private canMakeRequest(): boolean {
    if (this.isCooldown) {
      return false;
    }

    this.cleanupRequestHistory();
    return this.requestHistory.length < this.config.maxRequests;
  }

  private recordRequest(): void {
    this.requestHistory.push(Date.now());
    
    // Start cooldown
    this.isCooldown = true;
    if (this.cooldownTimeout) {
      clearTimeout(this.cooldownTimeout);
    }
    
    this.cooldownTimeout = setTimeout(() => {
      this.isCooldown = false;
    }, this.config.cooldownMs);
  }

  private generateRequestKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  async makeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    const requestKey = this.generateRequestKey(url, options);

    // Check if request is already pending
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (pendingRequest) {
      console.log(`[RateLimiter] Reusing pending request for: ${url}`);
      return pendingRequest.promise;
    }

    // Check rate limit
    if (!this.canMakeRequest()) {
      const waitTime = this.config.cooldownMs;
      console.warn(`[RateLimiter] Rate limit exceeded, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Create new request
    const requestPromise = this.executeRequest<T>(url, options);
    
    // Store pending request
    this.pendingRequests.set(requestKey, {
      promise: requestPromise,
      timestamp: Date.now()
    });

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(requestKey);
    }
  }

  private async executeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    this.recordRequest();
    
    console.log(`[RateLimiter] Making request to: ${url}`);
    
    // Add API key if it's a CoinGecko request
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'OSMO-DTF-Platform/1.0',
      ...(options?.headers as Record<string, string>),
    };

    // Add CoinGecko API key if available
    if (url.includes('api.coingecko.com')) {
      const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
      if (apiKey) {
        headers['x-cg-demo-api-key'] = apiKey;
        console.log(`[RateLimiter] Using CoinGecko API key: ${apiKey.slice(0, 8)}...`);
      } else {
        console.warn(`[RateLimiter] No CoinGecko API key found. Using free tier limits.`);
      }
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      
      // Provide specific error messages for common issues
      if (response.status === 401) {
        errorMessage = 'CoinGecko API key is invalid or missing. Please check your NEXT_PUBLIC_COINGECKO_API_KEY environment variable.';
      } else if (response.status === 429) {
        errorMessage = 'CoinGecko API rate limit exceeded. Please wait before making more requests.';
      } else if (response.status === 403) {
        errorMessage = 'CoinGecko API access forbidden. Check your API key permissions.';
      }
      
      console.error(`[RateLimiter] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Get current rate limit status
  getStatus(): {
    canMakeRequest: boolean;
    requestsInWindow: number;
    maxRequests: number;
    isCooldown: boolean;
    pendingRequests: number;
    hasCoinGeckoAPIKey: boolean;
  } {
    this.cleanupRequestHistory();
    
    return {
      canMakeRequest: this.canMakeRequest(),
      requestsInWindow: this.requestHistory.length,
      maxRequests: this.config.maxRequests,
      isCooldown: this.isCooldown,
      pendingRequests: this.pendingRequests.size,
      hasCoinGeckoAPIKey: !!process.env.NEXT_PUBLIC_COINGECKO_API_KEY
    };
  }

  // Clear all pending requests (useful for cleanup)
  clearPendingRequests(): void {
    this.pendingRequests.clear();
  }

  // Reset rate limiter (useful for testing)
  reset(): void {
    this.requestHistory = [];
    this.pendingRequests.clear();
    this.isCooldown = false;
    if (this.cooldownTimeout) {
      clearTimeout(this.cooldownTimeout);
      this.cooldownTimeout = null;
    }
  }
}

// Export singleton instance
export const apiRateLimiter = APIRateLimiter.getInstance();

// Utility function for making rate-limited requests
export async function makeRateLimitedRequest<T>(url: string, options?: RequestInit): Promise<T> {
  return apiRateLimiter.makeRequest<T>(url, options);
}

// Debug function to check rate limiter status
export function getRateLimiterStatus() {
  return apiRateLimiter.getStatus();
}
