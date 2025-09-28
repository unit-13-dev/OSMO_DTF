export interface ManualTokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  isVerified: boolean;
  isTestnet: boolean;
  description?: string;
  addedBy: string; // Who added this token
  addedAt: string; // When it was added
}

// Manual token list - you can add tokens here
export const MANUAL_TOKENS: ManualTokenInfo[] = [
//   {
//     address: '0x0000000000000000000000000000000000000000',
//     symbol: 'ETH',
//     name: 'Ethereum',
//     decimals: 18,
//     logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
//     isVerified: true,
//     isTestnet: true,
//     description: 'Native Ethereum token',
//     addedBy: 'admin',
//     addedAt: new Date().toISOString()
//   },
  {
    address: '0xaE3D01B14727dB642d1B7A40460faE24d7182d10', 
    symbol: 'SG',
    name: 'SG Coin',
    decimals: 6,
    logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    isVerified: true,
    isTestnet: true,
    description: 'SG Coin testnet token',
    addedBy: 'admin',
    addedAt: new Date().toISOString()
  },
  {
    address: '0x825DE2180C8F953c6A0F117CCBAD26700D302E02',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    isVerified: true,
    isTestnet: true,
    description: 'Tether USD testnet token',
    addedBy: 'admin',
    addedAt: new Date().toISOString()
  },
  {
    address: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
    symbol: 'USDC',
    name: 'USDC',
    decimals: 18,
    logoUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    isVerified: true,
    isTestnet: true,
    description: 'USDC testnet token',
    addedBy: 'admin',
    addedAt: new Date().toISOString()
  },
];

// Token categories for organization
export const TOKEN_CATEGORIES = {
  NATIVE: 'native',
  STABLECOIN: 'stablecoin',
  DEFI: 'defi',
  GOVERNANCE: 'governance',
  UTILITY: 'utility',
  CUSTOM: 'custom'
} as const;

export type TokenCategory = typeof TOKEN_CATEGORIES[keyof typeof TOKEN_CATEGORIES];

// Extended token info with category
export interface CategorizedTokenInfo extends ManualTokenInfo {
  category: TokenCategory;
}

// Function to get tokens by category
export const getTokensByCategory = (category: TokenCategory): CategorizedTokenInfo[] => {
  return MANUAL_TOKENS.map(token => ({
    ...token,
    category: getTokenCategory(token.symbol, token.name)
  })).filter(token => token.category === category);
};

// Function to determine token category based on symbol/name
export const getTokenCategory = (symbol: string, name: string): TokenCategory => {
  const symbolUpper = symbol.toUpperCase();
  const nameUpper = name.toUpperCase();
  
  if (symbolUpper === 'ETH' || nameUpper.includes('ETHEREUM')) {
    return TOKEN_CATEGORIES.NATIVE;
  }
  
  if (symbolUpper.includes('USD') || symbolUpper.includes('USDC') || 
      symbolUpper.includes('USDT') || symbolUpper.includes('DAI') ||
      nameUpper.includes('STABLE') || nameUpper.includes('USD')) {
    return TOKEN_CATEGORIES.STABLECOIN;
  }
  
  if (symbolUpper.includes('UNI') || symbolUpper.includes('AAVE') || 
      symbolUpper.includes('COMP') || symbolUpper.includes('LINK') ||
      nameUpper.includes('DEFI') || nameUpper.includes('PROTOCOL')) {
    return TOKEN_CATEGORIES.DEFI;
  }
  
  if (symbolUpper.includes('GOV') || symbolUpper.includes('VOTE') ||
      nameUpper.includes('GOVERNANCE') || nameUpper.includes('VOTING')) {
    return TOKEN_CATEGORIES.GOVERNANCE;
  }
  
  return TOKEN_CATEGORIES.UTILITY;
};

// Function to search tokens
export const searchManualTokens = (query: string): CategorizedTokenInfo[] => {
  const searchTerm = query.toLowerCase();
  return MANUAL_TOKENS.map(token => ({
    ...token,
    category: getTokenCategory(token.symbol, token.name)
  })).filter(token => 
    token.symbol.toLowerCase().includes(searchTerm) ||
    token.name.toLowerCase().includes(searchTerm) ||
    token.address.toLowerCase().includes(searchTerm)
  );
};

// Function to get popular tokens (most commonly used)
export const getPopularManualTokens = (limit: number = 8): CategorizedTokenInfo[] => {
  // You can customize this based on your preferences
  const popularSymbols = ['ETH', 'USDC', 'USDT', 'DAI', 'LINK', 'UNI', 'AAVE', 'WBTC'];
  
  return MANUAL_TOKENS.map(token => ({
    ...token,
    category: getTokenCategory(token.symbol, token.name)
  })).filter(token => 
    popularSymbols.includes(token.symbol.toUpperCase())
  ).slice(0, limit);
};

// Function to add a new token
export const addManualToken = (token: Omit<ManualTokenInfo, 'addedBy' | 'addedAt'>): void => {
  const newToken: ManualTokenInfo = {
    ...token,
    addedBy: 'admin', // You can make this dynamic
    addedAt: new Date().toISOString()
  };
  
  // Check if token already exists
  const exists = MANUAL_TOKENS.some(t => 
    t.address.toLowerCase() === token.address.toLowerCase()
  );
  
  if (!exists) {
    MANUAL_TOKENS.push(newToken);
    console.log(`Added new token: ${token.symbol} (${token.address})`);
  } else {
    console.warn(`Token ${token.symbol} already exists`);
  }
};

// Function to remove a token
export const removeManualToken = (address: string): boolean => {
  const index = MANUAL_TOKENS.findIndex(t => 
    t.address.toLowerCase() === address.toLowerCase()
  );
  
  if (index !== -1) {
    const removed = MANUAL_TOKENS.splice(index, 1)[0];
    console.log(`Removed token: ${removed.symbol} (${removed.address})`);
    return true;
  }
  
  return false;
};

// Function to update a token
export const updateManualToken = (address: string, updates: Partial<ManualTokenInfo>): boolean => {
  const index = MANUAL_TOKENS.findIndex(t => 
    t.address.toLowerCase() === address.toLowerCase()
  );
  
  if (index !== -1) {
    MANUAL_TOKENS[index] = { ...MANUAL_TOKENS[index], ...updates };
    console.log(`Updated token: ${MANUAL_TOKENS[index].symbol} (${address})`);
    return true;
  }
  
  return false;
};

// Function to get token by address
export const getManualTokenByAddress = (address: string): CategorizedTokenInfo | null => {
  const token = MANUAL_TOKENS.find(t => 
    t.address.toLowerCase() === address.toLowerCase()
  );
  
  if (token) {
    return {
      ...token,
      category: getTokenCategory(token.symbol, token.name)
    };
  }
  
  return null;
};

// Function to validate token address format
export const isValidTokenAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Function to get all tokens
export const getAllManualTokens = (): CategorizedTokenInfo[] => {
  return MANUAL_TOKENS.map(token => ({
    ...token,
    category: getTokenCategory(token.symbol, token.name)
  }));
};
