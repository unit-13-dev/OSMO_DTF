// Contract addresses and configuration
export const CONTRACT_ADDRESSES = {
  DTF_FACTORY: process.env.NEXT_PUBLIC_DTF_FACTORY_ADDRESS || "0xA7944648D873c55F20ec1c7751fae398f3Ba262d"
} as const;

export const NETWORK_CONFIG = {
  DEFAULT_NETWORK: "unichainSepolia",
  SUPPORTED_NETWORKS: ["unichainSepolia", "base", "sepolia"] as const,
} as const;

export const APP_CONFIG = {
  NAME: "OSMO DTF Platform",
  DESCRIPTION:"Decentralized Token Fund Platform",
} as const;

// DTF Constants (matching contract constants)
export const DTF_CONSTANTS = {
  MINT_FEE_BPS: 30, // 0.3%
  REDEEM_FEE_BPS: 30, // 0.3%
  BASIC_POINTS: 10000,
  MIN_TOKENS: 2,
  MAX_TOKENS: 10,
  DEFAULT_SLIPPAGE_BPS: 200, // 2%
  MAX_SLIPPAGE_BPS: 500, // 5%
} as const;
