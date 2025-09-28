// Token API Service for Dynamic Token Data (CoinGecko Only)
import { TokenInfo } from './token-management';

// No rate limiting needed for local API routes

// Token API Service
export class TokenAPIService {
  private static instance: TokenAPIService;
  private cache = new Map<string, TokenInfo>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): TokenAPIService {
    if (!TokenAPIService.instance) {
      TokenAPIService.instance = new TokenAPIService();
    }
    return TokenAPIService.instance;
  }

  // Get token from cache if valid
  private getCachedToken(address: string): TokenInfo | null {
    const cached = this.cache.get(address);
    const expiry = this.cacheExpiry.get(address);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    // Remove expired cache
    if (expiry && Date.now() >= expiry) {
      this.cache.delete(address);
      this.cacheExpiry.delete(address);
    }
    
    return null;
  }

  // Cache token data
  private cacheToken(address: string, token: TokenInfo): void {
    this.cache.set(address, token);
    this.cacheExpiry.set(address, Date.now() + this.CACHE_DURATION);
  }

  // Search tokens using local API route
  async searchTokens(query: string, limit: number = 20): Promise<TokenInfo[]> {
    try {
      const response = await fetch(
        `/api/tokens/search?query=${encodeURIComponent(query)}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching tokens:', error);
      return [];
    }
  }

  // Get token metadata by contract address using local API route
  async getTokenByAddress(address: string, chainId?: string): Promise<TokenInfo | null> {
    // Check cache first
    const cached = this.getCachedToken(address);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `/api/tokens/metadata?address=${encodeURIComponent(address)}`
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const token = data.token;

      if (token) {
        this.cacheToken(address, token);
      }

      return token;
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return null;
    }
  }



  // Get popular EVM tokens using local API route
  async getPopularTokens(limit: number = 8): Promise<TokenInfo[]> {
    try {
      const response = await fetch(
        `/api/tokens/popular?limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Popular tokens API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching popular tokens:', error);
      return [];
    }
  }

  // Get token price using local API route
  async getTokenPrice(address: string): Promise<number | null> {
    try {
      const response = await fetch(
        `/api/tokens/price?address=${encodeURIComponent(address)}`
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.price;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return null;
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const tokenAPI = TokenAPIService.getInstance();

// Utility functions
export const tokenAPIUtils = {
  // Format token address for display
  formatAddress: (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },

  // Validate Ethereum address
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  // Get chain name (Unichain Sepolia only)
  getChainName: (): string => {
    return 'Unichain Sepolia';
  }
};
