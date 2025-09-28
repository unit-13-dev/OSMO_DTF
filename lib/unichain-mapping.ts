// Unichain Sepolia to Ethereum Mainnet Token Address Mapping
// This maps testnet token addresses to their mainnet counterparts for CoinGecko metadata lookup

export interface TokenMapping {
  unichainSepoliaAddress: string;
  ethereumMainnetAddress: string;
  symbol: string;
  name: string;
  coingeckoId?: string;
}

// Mapping of Unichain Sepolia token addresses to Ethereum mainnet addresses
export const UNICHAIN_ETHEREUM_MAPPING: TokenMapping[] = [
  {
    unichainSepoliaAddress: '0x0000000000000000000000000000000000000000',
    ethereumMainnetAddress: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
    coingeckoId: 'ethereum'
  },
  {
    unichainSepoliaAddress: '0x825DE2180C8F953c6A0F117CCBAD26700D302E02',
    ethereumMainnetAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT on Ethereum
    symbol: 'USDT',
    name: 'Tether USD',
    coingeckoId: 'tether'
  },
  {
    unichainSepoliaAddress: '0x31d0220469e10c4E71834a79b1f276d740d3768F',
    ethereumMainnetAddress: '0xA0b86a33E6441b8c4C8C0e4b8b2e8B8e8B8e8B8e', // USDC on Ethereum mainnet
    symbol: 'USDC',
    name: 'USD Coin',
    coingeckoId: 'usd-coin'
  },
  {
    unichainSepoliaAddress: '0xaE3D01B14727dB642d1B7A40460faE24d7182d10',
    ethereumMainnetAddress: '0xA0b86a33E6441b8c4C8C0e4b8b2e8B8e8B8e8B8e', // SG Coin - custom token, no mainnet equivalent
    symbol: 'SG',
    name: 'SG Coin',
    coingeckoId: undefined // Custom token, not on CoinGecko
  }
];

// Function to get Ethereum mainnet address from Unichain Sepolia address
export function getEthereumAddress(unichainAddress: string): string | null {
  const mapping = UNICHAIN_ETHEREUM_MAPPING.find(
    m => m.unichainSepoliaAddress.toLowerCase() === unichainAddress.toLowerCase()
  );
  return mapping ? mapping.ethereumMainnetAddress : null;
}

// Function to get token mapping info
export function getTokenMapping(unichainAddress: string): TokenMapping | null {
  return UNICHAIN_ETHEREUM_MAPPING.find(
    m => m.unichainSepoliaAddress.toLowerCase() === unichainAddress.toLowerCase()
  ) || null;
}

// Function to get CoinGecko ID from Unichain address
export function getCoinGeckoId(unichainAddress: string): string | null {
  const mapping = getTokenMapping(unichainAddress);
  return mapping?.coingeckoId || null;
}

// Function to check if token has CoinGecko data
export function hasCoinGeckoData(unichainAddress: string): boolean {
  const mapping = getTokenMapping(unichainAddress);
  return mapping?.coingeckoId !== undefined && mapping.coingeckoId !== null;
}

// Function to get all mappable addresses (addresses that have CoinGecko data)
export function getMappableAddresses(addresses: string[]): string[] {
  return addresses.filter(addr => hasCoinGeckoData(addr));
}

// Function to get Ethereum addresses for batch CoinGecko lookup
export function getEthereumAddressesForLookup(unichainAddresses: string[]): string[] {
  return unichainAddresses
    .map(addr => getEthereumAddress(addr))
    .filter((addr): addr is string => addr !== null);
}

// Common Ethereum mainnet token addresses for reference
export const ETHEREUM_MAINNET_TOKENS = {
  ETH: '0x0000000000000000000000000000000000000000',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  USDC: '0xA0b86a33E6441b8c4C8C0e4b8b2e8B8e8B8e8B8e', // Update with real USDC address
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
} as const;
