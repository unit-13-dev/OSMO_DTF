/**
 * Centralized Token Metadata Cache System
 * Prevents duplicate API calls and provides efficient caching
 */

import { makeRateLimitedRequest } from './api-rate-limiter';

export interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  isVerified: boolean;
  isTestnet?: boolean;
  coingeckoId?: string;
  marketCap?: number;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  description?: string;
}

interface CacheEntry {
  data: TokenMetadata;
  timestamp: number;
  expiresAt: number;
}

interface BatchRequest {
  addresses: string[];
  promise: Promise<TokenMetadata[]>;
  timestamp: number;
}

class TokenMetadataCache {
  private static instance: TokenMetadataCache;
  private cache = new Map<string, CacheEntry>();
  private pendingBatchRequests = new Map<string, BatchRequest>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private readonly BATCH_TIMEOUT = 5 * 1000; // 5 seconds to collect batch requests

  static getInstance(): TokenMetadataCache {
    if (!TokenMetadataCache.instance) {
      TokenMetadataCache.instance = new TokenMetadataCache();
    }
    return TokenMetadataCache.instance;
  }

  private constructor() {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() < entry.expiresAt;
  }

  private generateBatchKey(addresses: string[]): string {
    return addresses.sort().join(',');
  }

  // Get single token metadata
  async getTokenMetadata(address: string): Promise<TokenMetadata | null> {
    const cacheKey = address.toLowerCase();
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log(`[TokenCache] Cache hit for: ${address}`);
      return cached.data;
    }

    // If not in cache, fetch it
    const result = await this.getBatchTokenMetadata([address]);
    return result.length > 0 ? result[0] : null;
  }

  // Get multiple token metadata (with batching optimization)
  async getBatchTokenMetadata(addresses: string[]): Promise<TokenMetadata[]> {
    if (addresses.length === 0) return [];

    const now = Date.now();
    const batchKey = this.generateBatchKey(addresses);
    
    // Check if batch request is already pending
    const pendingBatch = this.pendingBatchRequests.get(batchKey);
    if (pendingBatch && (now - pendingBatch.timestamp) < this.BATCH_TIMEOUT) {
      console.log(`[TokenCache] Reusing pending batch request for ${addresses.length} tokens`);
      return pendingBatch.promise;
    }

    // Check cache for individual tokens
    const uncachedAddresses: string[] = [];
    const cachedResults: TokenMetadata[] = [];

    for (const address of addresses) {
      const cacheKey = address.toLowerCase();
      const cached = this.cache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached)) {
        cachedResults.push(cached.data);
      } else {
        uncachedAddresses.push(address);
      }
    }

    // If all tokens are cached, return cached results
    if (uncachedAddresses.length === 0) {
      console.log(`[TokenCache] All ${addresses.length} tokens found in cache`);
      return cachedResults;
    }

    // Create batch request for uncached tokens
    const batchPromise = this.fetchBatchFromAPI(uncachedAddresses);
    
    // Store pending batch request
    this.pendingBatchRequests.set(batchKey, {
      addresses: uncachedAddresses,
      promise: batchPromise,
      timestamp: now
    });

    try {
      const apiResults = await batchPromise;
      
      // Cache the results
      for (const token of apiResults) {
        this.cacheToken(token);
      }

      // Combine cached and API results
      const allResults = [...cachedResults, ...apiResults];
      
      console.log(`[TokenCache] Fetched ${apiResults.length} tokens from API, ${cachedResults.length} from cache`);
      return allResults;
    } finally {
      // Clean up pending batch request
      this.pendingBatchRequests.delete(batchKey);
    }
  }

  private async fetchBatchFromAPI(addresses: string[]): Promise<TokenMetadata[]> {
    try {
      console.log(`[TokenCache] Fetching ${addresses.length} tokens from CoinGecko API`);
      
      const response = await makeRateLimitedRequest<{ tokens: TokenMetadata[] }>(
        '/api/tokens/batch-metadata',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ addresses }),
        }
      );

      return response.tokens || [];
    } catch (error) {
      console.error('[TokenCache] Error fetching batch metadata:', error);
      return [];
    }
  }

  private cacheToken(token: TokenMetadata): void {
    const cacheKey = token.address.toLowerCase();
    const now = Date.now();
    
    this.cache.set(cacheKey, {
      data: token,
      timestamp: now,
      expiresAt: now + this.CACHE_DURATION
    });
  }

  // Preload popular tokens
  async preloadPopularTokens(): Promise<void> {
    try {
      console.log('[TokenCache] Preloading popular tokens...');
      
      const response = await makeRateLimitedRequest<{ tokens: TokenMetadata[] }>(
        '/api/tokens/popular?limit=20'
      );

      for (const token of response.tokens || []) {
        this.cacheToken(token);
      }

      console.log(`[TokenCache] Preloaded ${response.tokens?.length || 0} popular tokens`);
    } catch (error) {
      console.error('[TokenCache] Error preloading popular tokens:', error);
    }
  }

  // Search tokens
  async searchTokens(query: string, limit: number = 20): Promise<TokenMetadata[]> {
    try {
      const response = await makeRateLimitedRequest<TokenMetadata[]>(
        `/api/tokens/search?query=${encodeURIComponent(query)}&limit=${limit}`
      );

      // Cache the search results
      for (const token of response) {
        this.cacheToken(token);
      }

      return response;
    } catch (error) {
      console.error('[TokenCache] Error searching tokens:', error);
      return [];
    }
  }

  // Get cache statistics
  getCacheStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    pendingBatches: number;
  } {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now < entry.expiresAt) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      pendingBatches: this.pendingBatchRequests.size
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    this.pendingBatchRequests.clear();
  }

  // Clear expired entries
  clearExpiredEntries(): void {
    this.cleanupExpiredEntries();
  }
}

// Export singleton instance
export const tokenMetadataCache = TokenMetadataCache.getInstance();

// Convenience functions
export async function getTokenMetadata(address: string): Promise<TokenMetadata | null> {
  return tokenMetadataCache.getTokenMetadata(address);
}

export async function getBatchTokenMetadata(addresses: string[]): Promise<TokenMetadata[]> {
  return tokenMetadataCache.getBatchTokenMetadata(addresses);
}

export async function searchTokens(query: string, limit?: number): Promise<TokenMetadata[]> {
  return tokenMetadataCache.searchTokens(query, limit);
}

export async function preloadPopularTokens(): Promise<void> {
  return tokenMetadataCache.preloadPopularTokens();
}

export function getTokenCacheStats() {
  return tokenMetadataCache.getCacheStats();
}
