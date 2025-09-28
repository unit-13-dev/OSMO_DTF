import { readContract } from '@wagmi/core';
import { config } from '@/config/wagmiadapter';
import { DTF_CONSTANTS } from '@/config/contracts';
import { 
  MANUAL_TOKENS, 
  CategorizedTokenInfo, 
  searchManualTokens, 
  getPopularManualTokens, 
  getManualTokenByAddress,
  getAllManualTokens,
  TOKEN_CATEGORIES
} from './manual-tokens';

// Token Information Interface
export interface TokenInfo {
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
}

// ERC20 ABI for token validation
const ERC20_ABI = [
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;


// DTF Templates
export interface DTFTemplate {
  id: string;
  name: string;
  description: string;
  tokens: TokenInfo[];
  weights: number[];
  category: 'defi' | 'stablecoin' | 'bluechip' | 'custom';
}

// Dynamic DTF Templates (completely populated from API)
export const DTF_TEMPLATES: DTFTemplate[] = [
  {
    id: 'defi-bluechip',
    name: 'DeFi Blue Chips',
    description: 'A diversified portfolio of top DeFi tokens',
    tokens: [], // Will be populated dynamically from API
    weights: [], // Will be adjusted dynamically
    category: 'defi'
  },
  {
    id: 'stablecoin-mix',
    name: 'Stablecoin Mix',
    description: 'A balanced portfolio of stablecoins',
    tokens: [], // Will be populated dynamically from API
    weights: [], // Will be adjusted dynamically
    category: 'stablecoin'
  },
  {
    id: 'balanced-portfolio',
    name: 'Balanced Portfolio',
    description: 'A well-diversified portfolio across different asset types',
    tokens: [], // Will be populated dynamically from API
    weights: [], // Will be adjusted dynamically
    category: 'bluechip'
  }
];

// Token Management Functions
export const tokenManagement = {
  // Validate if an address is a valid ERC20 token on Unichain Sepolia
  validateToken: async (address: string): Promise<TokenInfo | null> => {
    try {
      // First check if it's in our manual token list
      const manualToken = getManualTokenByAddress(address);
      if (manualToken) {
        return {
          address: manualToken.address,
          symbol: manualToken.symbol,
          name: manualToken.name,
          decimals: manualToken.decimals,
          logoUrl: manualToken.logoUrl,
          isVerified: manualToken.isVerified,
          isTestnet: manualToken.isTestnet
        };
      }

      // Check if it's a valid contract address
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return null;
      }

      // For ETH
      if (address === '0x0000000000000000000000000000000000000000') {
        return {
          address,
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          isVerified: true
        };
      }

      // Fallback to direct contract reading on Unichain Sepolia
      const [name, symbol, decimals] = await Promise.all([
        readContract(config, {
          address: address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'name',
        }).catch(() => null),
        readContract(config, {
          address: address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }).catch(() => null),
        readContract(config, {
          address: address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }).catch(() => null)
      ]);

      if (!name || !symbol || decimals === null) {
        return null;
      }

      return {
        address,
        symbol: symbol as string,
        name: name as string,
        decimals: Number(decimals),
        isVerified: false // Mark as unverified for custom tokens
      };
    } catch (error) {
      console.error('Error validating token:', error);
      return null;
    }
  },

  // Validate token exists on Unichain Sepolia network
  validateTokenOnNetwork: async (address: string): Promise<boolean> => {
    try {
      // First check if it's in our manual token list
      const manualToken = getManualTokenByAddress(address);
      if (manualToken) {
        // For manual tokens, we trust the list and skip contract validation
        console.log(`Token ${manualToken.symbol} found in manual list, skipping contract validation`);
        return true;
      }

      // For ETH, always return true
      if (address === '0x0000000000000000000000000000000000000000') {
        return true;
      }

      // For other tokens, try to validate via contract call
      await readContract(config, {
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol',
      });
      return true;
    } catch (error) {
      console.warn(`Token ${address} not found on Unichain Sepolia:`, error);
      return false;
    }
  },

  // Search for tokens using manual token list
  searchTokens: async (query: string): Promise<TokenInfo[]> => {
    try {
      const results = searchManualTokens(query);
      return results.map(token => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoUrl: token.logoUrl,
        isVerified: token.isVerified,
        isTestnet: token.isTestnet
      }));
    } catch (error) {
      console.error('Error searching tokens:', error);
      return [];
    }
  },

  // Get token by address (manual tokens only)
  getTokenByAddress: async (address: string): Promise<TokenInfo | null> => {
    try {
      const manualToken = getManualTokenByAddress(address);
      if (manualToken) {
        return {
          address: manualToken.address,
          symbol: manualToken.symbol,
          name: manualToken.name,
          decimals: manualToken.decimals,
          logoUrl: manualToken.logoUrl,
          isVerified: manualToken.isVerified,
          isTestnet: manualToken.isTestnet
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching token by address:', error);
      return null;
    }
  },

  // Get popular tokens from manual token list (8 tokens by default)
  getPopularTokens: async (limit: number = 8): Promise<TokenInfo[]> => {
    try {
      const popularTokens = getPopularManualTokens(limit);
      return popularTokens.map(token => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoUrl: token.logoUrl,
        isVerified: token.isVerified,
        isTestnet: token.isTestnet
      }));
    } catch (error) {
      console.error('Error fetching popular tokens:', error);
      return [];
    }
  },

  // Get token price (manual tokens - no price data)
  getTokenPrice: async (address: string): Promise<number | null> => {
    try {
      // Manual tokens don't have price data
      // You can integrate with a price API later if needed
      return null;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return null;
    }
  },

  // Get token with price data
  getTokenWithPrice: async (address: string): Promise<TokenInfo | null> => {
    try {
      const token = await tokenManagement.validateToken(address);
      if (!token) return null;

      const price = await tokenManagement.getTokenPrice(address);
      return {
        ...token,
        price: price || undefined
      };
    } catch (error) {
      console.error('Error fetching token with price:', error);
      return null;
    }
  },

  // Get DTF templates with manual token population
  getTemplates: async (): Promise<DTFTemplate[]> => {
    try {
      const allTokens = getAllManualTokens();
      
      // If no tokens available, return empty templates
      if (allTokens.length === 0) {
        return DTF_TEMPLATES;
      }
      
      return DTF_TEMPLATES.map(template => {
        switch (template.id) {
          case 'defi-bluechip':
            const defiTokens = allTokens.filter(t => 
              t.category === TOKEN_CATEGORIES.DEFI || 
              ['ETH', 'LINK', 'UNI', 'AAVE'].includes(t.symbol.toUpperCase())
            ).slice(0, 4);
            return {
              ...template,
              tokens: defiTokens.map(t => ({
                address: t.address,
                symbol: t.symbol,
                name: t.name,
                decimals: t.decimals,
                logoUrl: t.logoUrl,
                isVerified: t.isVerified,
                isTestnet: t.isTestnet
              })),
              weights: defiTokens.length > 0 ? 
                tokenManagement.autoBalanceWeights(Array(defiTokens.length).fill(0)) : []
            };
          case 'stablecoin-mix':
            const stableTokens = allTokens.filter(t => 
              t.category === TOKEN_CATEGORIES.STABLECOIN || 
              ['USDC', 'USDT', 'DAI'].includes(t.symbol.toUpperCase())
            ).slice(0, 3);
            return {
              ...template,
              tokens: stableTokens.map(t => ({
                address: t.address,
                symbol: t.symbol,
                name: t.name,
                decimals: t.decimals,
                logoUrl: t.logoUrl,
                isVerified: t.isVerified,
                isTestnet: t.isTestnet
              })),
              weights: stableTokens.length > 0 ? 
                tokenManagement.autoBalanceWeights(Array(stableTokens.length).fill(0)) : []
            };
          case 'balanced-portfolio':
            const balancedTokens = allTokens.filter(t => 
              ['ETH', 'WBTC', 'USDC', 'LINK'].includes(t.symbol.toUpperCase())
            ).slice(0, 4);
            return {
              ...template,
              tokens: balancedTokens.map(t => ({
                address: t.address,
                symbol: t.symbol,
                name: t.name,
                decimals: t.decimals,
                logoUrl: t.logoUrl,
                isVerified: t.isVerified,
                isTestnet: t.isTestnet
              })),
              weights: balancedTokens.length > 0 ? 
                tokenManagement.autoBalanceWeights(Array(balancedTokens.length).fill(0)) : []
            };
          default:
            return template;
        }
      });
    } catch (error) {
      console.error('Error getting templates:', error);
      return DTF_TEMPLATES;
    }
  },

  // Get template by ID
  getTemplateById: async (id: string): Promise<DTFTemplate | null> => {
    try {
      const templates = await tokenManagement.getTemplates();
      return templates.find(template => template.id === id) || null;
    } catch (error) {
      console.error('Error getting template by ID:', error);
      return null;
    }
  },

  // Validate token list for DTF creation
  validateTokenList: (tokens: string[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (tokens.length < DTF_CONSTANTS.MIN_TOKENS) {
      errors.push(`Minimum ${DTF_CONSTANTS.MIN_TOKENS} tokens required`);
    }

    if (tokens.length > DTF_CONSTANTS.MAX_TOKENS) {
      errors.push(`Maximum ${DTF_CONSTANTS.MAX_TOKENS} tokens allowed`);
    }

    // Check for duplicates
    const uniqueTokens = new Set(tokens.map(t => t.toLowerCase()));
    if (uniqueTokens.size !== tokens.length) {
      errors.push('Duplicate tokens not allowed');
    }

    // Check for valid addresses
    const invalidAddresses = tokens.filter(addr => 
      !addr.match(/^0x[a-fA-F0-9]{40}$/) && addr !== '0x0000000000000000000000000000000000000000'
    );
    
    if (invalidAddresses.length > 0) {
      console.error('Invalid token addresses found:', invalidAddresses);
      console.error('All token addresses:', tokens);
      errors.push('Invalid token addresses found');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate weight distribution
  validateWeights: (weights: number[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (weights.length === 0) {
      errors.push('At least one weight is required');
      return { isValid: false, errors };
    }

    // Check if all weights are positive
    const negativeWeights = weights.filter(w => w <= 0);
    if (negativeWeights.length > 0) {
      errors.push('All weights must be greater than 0');
    }

    // Check if weights sum to 10000 (100%)
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight !== DTF_CONSTANTS.BASIC_POINTS) {
      errors.push(`Weights must sum to exactly ${DTF_CONSTANTS.BASIC_POINTS} (100%)`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Auto-balance weights to sum to exactly 10000 (BASIC_POINTS)
  autoBalanceWeights: (weights: number[]): number[] => {
    if (weights.length === 0) return [];
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight === 0) {
      // If all weights are 0, distribute equally with exact 10000 total
      const baseWeight = Math.floor(DTF_CONSTANTS.BASIC_POINTS / weights.length);
      const remainder = DTF_CONSTANTS.BASIC_POINTS - (baseWeight * weights.length);
      
      return weights.map((_, index) => {
        // First 'remainder' tokens get baseWeight + 1
        return index < remainder ? baseWeight + 1 : baseWeight;
      });
    }

    // Scale weights to sum to exactly 10000
    const scaledWeights = weights.map(weight => 
      Math.floor((weight / totalWeight) * DTF_CONSTANTS.BASIC_POINTS)
    );
    
    // Calculate remainder and distribute to first tokens
    const currentTotal = scaledWeights.reduce((sum, weight) => sum + weight, 0);
    const remainder = DTF_CONSTANTS.BASIC_POINTS - currentTotal;
    
    // Distribute remainder to first tokens
    for (let i = 0; i < remainder && i < scaledWeights.length; i++) {
      scaledWeights[i] += 1;
    }
    
    return scaledWeights;
  },

  // Calculate percentage from weight
  weightToPercentage: (weight: number): number => {
    return (weight / DTF_CONSTANTS.BASIC_POINTS) * 100;
  },

  // Calculate weight from percentage
  percentageToWeight: (percentage: number): number => {
    return Math.round((percentage / 100) * DTF_CONSTANTS.BASIC_POINTS);
  }
};

