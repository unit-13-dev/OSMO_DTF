import { parseEther, formatEther, parseUnits, formatUnits } from 'viem';
import { readContract, writeContract, waitForTransactionReceipt, getBalance } from '@wagmi/core';
import { decodeEventLog } from 'viem';
import { config } from '@/config/wagmiadapter';
import { CONTRACT_ADDRESSES, DTF_CONSTANTS } from '@/config/contracts';
import DTF_ABI from '@/DTF/abi/DTF';
import DTFFACTORY_ABI from '@/DTF/abi/DTFFactory';

// Types
export interface DTFData {
  dtfAddress: string;
  creator: string;
  name: string;
  symbol: string;
  tokens: string[];
  weights: bigint[];
  createdAt: bigint;
  active: boolean;
}

export interface PortfolioData {
  tokenAddresses: string[];
  balances: bigint[];
  ethValues: bigint[];
  totalValue: bigint;
}

export interface MintPreview {
  dtfTokens: bigint;
  fee: bigint;
  investedAmount: bigint;
}

export interface RedeemPreview {
  ethAmount: bigint;
  feeAmount: bigint;
  netAmount: bigint;
}

export interface SwapQuote {
  expectedOut: bigint;
  minAmountOut: bigint;
}

export interface TokenDetails {
  balance: bigint;
  weight: bigint;
  ethValue: bigint;
}

// Error handling
export class DTFError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DTFError';
  }
}

// Utility Functions
export const formatWeiToEth = (wei: bigint, decimals: number = 4): string => {
  return formatEther(wei).slice(0, formatEther(wei).indexOf('.') + decimals + 1);
};

export const formatEthToWei = (eth: string): bigint => {
  return parseEther(eth);
};

export const calculateFees = (amount: bigint, feeBps: number): bigint => {
  return (amount * BigInt(feeBps)) / BigInt(DTF_CONSTANTS.BASIC_POINTS);
};

export const validateInputs = {
  ethAmount: (amount: string): boolean => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  },
  
  slippage: (slippage: number): boolean => {
    return slippage >= 0 && slippage <= DTF_CONSTANTS.MAX_SLIPPAGE_BPS;
  },
  
  dtfAmount: (amount: string): boolean => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  }
};

// Factory Functions
export const factoryFunctions = {
  // Get all DTF contracts
  getAllDTFs: async (): Promise<DTFData[]> => {
    try {
      const result = await readContract(config, {
        address: CONTRACT_ADDRESSES.DTF_FACTORY as `0x${string}`,
        abi: DTFFACTORY_ABI,
        functionName: 'getAllDTFs',
      });
      
      return result as DTFData[];
    } catch (error) {
      console.error('Error fetching all DTFs:', error);
      throw new DTFError('Failed to fetch DTF contracts', 'FETCH_ERROR');
    }
  },

  // Get DTF info by address
  getDTFInfo: async (dtfAddress: string): Promise<DTFData> => {
    try {
      const result = await readContract(config, {
        address: CONTRACT_ADDRESSES.DTF_FACTORY as `0x${string}`,
        abi: DTFFACTORY_ABI,
        functionName: 'getDTFbyAddress',
        args: [dtfAddress as `0x${string}`],
      });
      
      return result as DTFData;
    } catch (error) {
      console.error('Error fetching DTF info:', error);
      throw new DTFError('Failed to fetch DTF information', 'FETCH_ERROR');
    }
  },

  // Check if DTF is active
  isActiveDTF: async (dtfAddress: string): Promise<boolean> => {
    try {
      const result = await readContract(config, {
        address: CONTRACT_ADDRESSES.DTF_FACTORY as `0x${string}`,
        abi: DTFFACTORY_ABI,
        functionName: 'isActiveDTF',
        args: [dtfAddress as `0x${string}`],
      });
      
      return result as boolean;
    } catch (error) {
      console.error('Error checking DTF status:', error);
      throw new DTFError('Failed to check DTF status', 'FETCH_ERROR');
    }
  },

  // Create new DTF
  createDTF: async (
    name: string,
    symbol: string,
    tokens: string[],
    weights: number[]
  ): Promise<string> => {
    try {
      // Validate inputs
      if (name.length === 0 || name.length > 50) {
        throw new DTFError('Invalid name length', 'VALIDATION_ERROR');
      }
      if (symbol.length === 0 || symbol.length > 10) {
        throw new DTFError('Invalid symbol length', 'VALIDATION_ERROR');
      }
      if (tokens.length < DTF_CONSTANTS.MIN_TOKENS || tokens.length > DTF_CONSTANTS.MAX_TOKENS) {
        throw new DTFError('Invalid number of tokens', 'VALIDATION_ERROR');
      }
      if (tokens.length !== weights.length) {
        throw new DTFError('Tokens and weights length mismatch', 'VALIDATION_ERROR');
      }

      // Check if weights add up to 10000
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      if (totalWeight !== DTF_CONSTANTS.BASIC_POINTS) {
        throw new DTFError('Weights must add up to 10000', 'VALIDATION_ERROR');
      }

      // Check for duplicate tokens
      const uniqueTokens = new Set(tokens.map(t => t.toLowerCase()));
      if (uniqueTokens.size !== tokens.length) {
        throw new DTFError('Duplicate tokens not allowed', 'VALIDATION_ERROR');
      }

      // Validate all weights are positive
      if (weights.some(w => w <= 0)) {
        throw new DTFError('All weights must be greater than 0', 'VALIDATION_ERROR');
      }

      const hash = await writeContract(config, {
        address: CONTRACT_ADDRESSES.DTF_FACTORY as `0x${string}`,
        abi: DTFFACTORY_ABI,
        functionName: 'createDTF',
        args: [
          name,
          symbol,
          tokens as `0x${string}`[],
          weights.map(w => BigInt(w))
        ],
      });

      const receipt = await waitForTransactionReceipt(config, { hash });
      
      if (receipt.status !== 'success') {
        throw new DTFError('Transaction failed', 'TX_ERROR');
      }

      // Parse DTFCreated event from transaction logs
      const dtfCreatedEvent = receipt.logs.find(log => {
        try {
          // Check if this log matches the DTFCreated event signature
          const decoded = decodeEventLog({
            abi: DTFFACTORY_ABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === 'DTFCreated';
        } catch {
          return false;
        }
      });

      if (!dtfCreatedEvent) {
        throw new DTFError('DTFCreated event not found in transaction logs', 'TX_ERROR');
      }

      try {
        const decodedEvent = decodeEventLog({
          abi: DTFFACTORY_ABI,
          data: dtfCreatedEvent.data,
          topics: dtfCreatedEvent.topics,
        });

        if (decodedEvent.eventName === 'DTFCreated' && decodedEvent.args) {
          const args = decodedEvent.args as any;
          const dtfAddress = args.dtfAddress;
          if (dtfAddress && typeof dtfAddress === 'string') {
            return dtfAddress;
          }
        }
      } catch (error) {
        console.error('Error decoding DTFCreated event:', error);
      }

      throw new DTFError('Failed to extract DTF address from transaction logs', 'TX_ERROR');
    } catch (error) {
      console.error('Error creating DTF:', error);
      if (error instanceof DTFError) throw error;
      
      // Parse specific error messages
      let errorMessage = 'Failed to create DTF contract';
      let errorType = 'CREATE_ERROR';
      
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as any).message;
        
        if (message.includes('Invalid name')) {
          errorMessage = 'DTF name must be 1-50 characters long';
          errorType = 'VALIDATION_ERROR';
        } else if (message.includes('Invalid symbol')) {
          errorMessage = 'DTF symbol must be 1-10 characters long';
          errorType = 'VALIDATION_ERROR';
        } else if (message.includes('Invalid number of tokens')) {
          errorMessage = `Must have between ${DTF_CONSTANTS.MIN_TOKENS} and ${DTF_CONSTANTS.MAX_TOKENS} tokens`;
          errorType = 'VALIDATION_ERROR';
        } else if (message.includes('Tokens and weights length mismatch')) {
          errorMessage = 'Number of tokens must match number of weights';
          errorType = 'VALIDATION_ERROR';
        } else if (message.includes('Weights must add up to 10000')) {
          errorMessage = 'Token weights must add up to exactly 100%';
          errorType = 'VALIDATION_ERROR';
        } else if (message.includes('duplicate tokens not allowed')) {
          errorMessage = 'Duplicate tokens are not allowed';
          errorType = 'VALIDATION_ERROR';
        } else if (message.includes('Weight must be greater than 0')) {
          errorMessage = 'All token weights must be greater than 0';
          errorType = 'VALIDATION_ERROR';
        } else if (message.includes('Execution reverted')) {
          errorMessage = 'Transaction failed. Please check your token addresses and try again.';
          errorType = 'TX_ERROR';
        } else if (message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction';
          errorType = 'TX_ERROR';
        } else if (message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user';
          errorType = 'TX_ERROR';
        }
      }
      
      throw new DTFError(errorMessage, errorType);
    }
  }
};

// DTF Contract Functions
export const dtfFunctions = {
  // Mint DTF tokens with ETH
  mintWithEth: async (
    dtfAddress: string,
    ethAmount: string,
    slippageBps: number = DTF_CONSTANTS.DEFAULT_SLIPPAGE_BPS
  ): Promise<string> => {
    try {
      if (!validateInputs.ethAmount(ethAmount)) {
        throw new DTFError('Invalid ETH amount', 'VALIDATION_ERROR');
      }
      if (!validateInputs.slippage(slippageBps)) {
        throw new DTFError('Invalid slippage value', 'VALIDATION_ERROR');
      }

      const weiAmount = formatEthToWei(ethAmount);
      
      const hash = await writeContract(config, {
        address: dtfAddress as `0x${string}`,
        abi: DTF_ABI,
        functionName: 'mintWithEth',
        args: [BigInt(slippageBps)],
        value: weiAmount,
      });

      const receipt = await waitForTransactionReceipt(config, { hash });
      return receipt.transactionHash;
    } catch (error) {
      console.error('Error minting DTF tokens:', error);
      if (error instanceof DTFError) throw error;
      throw new DTFError('Failed to mint DTF tokens', 'MINT_ERROR');
    }
  },

  // Redeem DTF tokens for ETH
  redeemForEth: async (
    dtfAddress: string,
    dtfAmount: string,
    slippageBps: number = DTF_CONSTANTS.DEFAULT_SLIPPAGE_BPS
  ): Promise<string> => {
    try {
      if (!validateInputs.dtfAmount(dtfAmount)) {
        throw new DTFError('Invalid DTF amount', 'VALIDATION_ERROR');
      }
      if (!validateInputs.slippage(slippageBps)) {
        throw new DTFError('Invalid slippage value', 'VALIDATION_ERROR');
      }

      const weiAmount = formatEthToWei(dtfAmount);
      
      const hash = await writeContract(config, {
        address: dtfAddress as `0x${string}`,
        abi: DTF_ABI,
        functionName: 'redeemforEth',
        args: [weiAmount, BigInt(slippageBps)],
      });

      const receipt = await waitForTransactionReceipt(config, { hash });
      return receipt.transactionHash;
    } catch (error) {
      console.error('Error redeeming DTF tokens:', error);
      if (error instanceof DTFError) throw error;
      throw new DTFError('Failed to redeem DTF tokens', 'REDEEM_ERROR');
    }
  },

  // Get current portfolio value
  getCurrentPortfolioValue: async (dtfAddress: string): Promise<bigint> => {
    try {
      const result = await readContract(config, {
        address: dtfAddress as `0x${string}`,
        abi: DTF_ABI,
        functionName: 'getCurrentPortfolioValue',
      });
      
      return result as bigint;
    } catch (error) {
      console.error('Error fetching portfolio value:', error);
      throw new DTFError('Failed to fetch portfolio value', 'FETCH_ERROR');
    }
  },

  // Get detailed portfolio data
  getDetailedPortfolio: async (dtfAddress: string): Promise<PortfolioData> => {
    try {
      const [tokenAddresses, balances, ethValues] = await readContract(config, {
        address: dtfAddress as `0x${string}`,
        abi: DTF_ABI,
        functionName: 'getDetailedPortfolio',
      }) as [string[], bigint[], bigint[]];

      const totalValue = ethValues.reduce((sum, value) => sum + value, BigInt(0));

      return {
        tokenAddresses,
        balances,
        ethValues,
        totalValue
      };
    } catch (error) {
      console.error('Error fetching detailed portfolio:', error);
      throw new DTFError('Failed to fetch portfolio data', 'FETCH_ERROR');
    }
  },

  // Get mint preview
  getMintPreview: async (
    dtfAddress: string,
    ethAmount: string,
    slippageBps: number = DTF_CONSTANTS.DEFAULT_SLIPPAGE_BPS
  ): Promise<MintPreview> => {
    try {
      if (!validateInputs.ethAmount(ethAmount)) {
        throw new DTFError('Invalid ETH amount', 'VALIDATION_ERROR');
      }

      const weiAmount = formatEthToWei(ethAmount);
      
      // Use the smart contract function for accurate preview
      const [dtfTokens, fee] = await readContract(config, {
        address: dtfAddress as `0x${string}`,
        abi: DTF_ABI,
        functionName: 'getMintPreview',
        args: [weiAmount, BigInt(slippageBps)],
      }) as [bigint, bigint];

      const investedAmount = weiAmount - fee;

      return {
        dtfTokens,
        fee,
        investedAmount
      };
    } catch (error) {
      console.error('Error getting mint preview:', error);
      throw new DTFError('Failed to get mint preview', 'FETCH_ERROR');
    }
  },

  // Get redemption preview
  getRedemptionPreview: async (
    dtfAddress: string,
    dtfAmount: string,
    slippageBps: number = DTF_CONSTANTS.DEFAULT_SLIPPAGE_BPS
  ): Promise<RedeemPreview> => {
    try {
      if (!validateInputs.dtfAmount(dtfAmount)) {
        throw new DTFError('Invalid DTF amount', 'VALIDATION_ERROR');
      }

      const weiAmount = formatEthToWei(dtfAmount);
      
      const [ethAmount, feeAmount, netAmount] = await readContract(config, {
        address: dtfAddress as `0x${string}`,
        abi: DTF_ABI,
        functionName: 'getRedemptionPreview',
        args: [weiAmount, BigInt(slippageBps)],
      }) as [bigint, bigint, bigint];

      return {
        ethAmount,
        feeAmount,
        netAmount
      };
    } catch (error) {
      console.error('Error getting redemption preview:', error);
      throw new DTFError('Failed to get redemption preview', 'FETCH_ERROR');
    }
  },

  // Get user's DTF balance
  getUserDTFBalance: async (dtfAddress: string, userAddress: string): Promise<bigint> => {
    try {
      const result = await readContract(config, {
        address: dtfAddress as `0x${string}`,
        abi: DTF_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
      });
      
      return result as bigint;
    } catch (error) {
      console.error('Error fetching user DTF balance:', error);
      throw new DTFError('Failed to fetch user balance', 'FETCH_ERROR');
    }
  },

  // Check redemption status
  checkRedemption: async (
    dtfAddress: string,
    userAddress: string,
    dtfAmount: string
  ): Promise<{ canRedeem: boolean; reason: string }> => {
    try {
      const weiAmount = formatEthToWei(dtfAmount);
      
      const [canRedeem, reason] = await readContract(config, {
        address: dtfAddress as `0x${string}`,
        abi: DTF_ABI,
        functionName: 'checkRedemption',
        args: [userAddress as `0x${string}`, weiAmount],
      }) as [boolean, string];

      return { canRedeem, reason };
    } catch (error) {
      console.error('Error checking redemption:', error);
      throw new DTFError('Failed to check redemption status', 'FETCH_ERROR');
    }
  },

  // Get token details
  getTokenDetails: async (
    dtfAddress: string,
    tokenAddress: string
  ): Promise<TokenDetails> => {
    try {
      // Get token balance
      const balance = await readContract(config, {
        address: dtfAddress as `0x${string}`,
        abi: DTF_ABI,
        functionName: 'getTokenBalance',
        args: [tokenAddress as `0x${string}`],
      }) as bigint;

      // Get tokens and weights arrays
      const [tokens, weights] = await Promise.all([
        readContract(config, {
          address: dtfAddress as `0x${string}`,
          abi: DTF_ABI,
          functionName: 'getTokens',
        }) as Promise<string[]>,
        readContract(config, {
          address: dtfAddress as `0x${string}`,
          abi: DTF_ABI,
          functionName: 'getWeights',
        }) as Promise<bigint[]>
      ]);

      // Find the weight for this token
      const tokenIndex = tokens.findIndex(addr => addr.toLowerCase() === tokenAddress.toLowerCase());
      const weight = tokenIndex >= 0 ? weights[tokenIndex] : BigInt(0);

      // Calculate ETH value (simplified - would need proper price oracle in production)
      const ethValue = tokenAddress === '0x0000000000000000000000000000000000000000' 
        ? balance 
        : BigInt(0); // For ERC20 tokens, we'd need to get price from oracle

      return { balance, weight, ethValue };
    } catch (error) {
      console.error('Error fetching token details:', error);
      throw new DTFError('Failed to fetch token details', 'FETCH_ERROR');
    }
  },

  // Get swap quote
  getSwapQuote: async (
    dtfAddress: string,
    tokenAddress: string,
    tokenAmount: string,
    slippageBps: number = DTF_CONSTANTS.DEFAULT_SLIPPAGE_BPS
  ): Promise<SwapQuote> => {
    try {
      const weiAmount = formatEthToWei(tokenAmount);
      
      const [expectedOut, minAmountOut] = await readContract(config, {
        address: dtfAddress as `0x${string}`,
        abi: DTF_ABI,
        functionName: 'getSwapQuote',
        args: [tokenAddress as `0x${string}`, weiAmount, BigInt(slippageBps)],
      }) as [bigint, bigint];

      return { expectedOut, minAmountOut };
    } catch (error) {
      console.error('Error getting swap quote:', error);
      throw new DTFError('Failed to get swap quote', 'FETCH_ERROR');
    }
  },

  // Get basic DTF info
  getBasicInfo: async (dtfAddress: string) => {
    try {
      const [name, symbol, tokens, weights, totalSupply, createdAt] = await Promise.all([
        readContract(config, {
          address: dtfAddress as `0x${string}`,
          abi: DTF_ABI,
          functionName: 'name',
        }),
        readContract(config, {
          address: dtfAddress as `0x${string}`,
          abi: DTF_ABI,
          functionName: 'symbol',
        }),
        readContract(config, {
          address: dtfAddress as `0x${string}`,
          abi: DTF_ABI,
          functionName: 'getTokens',
        }),
        readContract(config, {
          address: dtfAddress as `0x${string}`,
          abi: DTF_ABI,
          functionName: 'getWeights',
        }),
        readContract(config, {
          address: dtfAddress as `0x${string}`,
          abi: DTF_ABI,
          functionName: 'totalSupply',
        }),
        readContract(config, {
          address: dtfAddress as `0x${string}`,
          abi: DTF_ABI,
          functionName: 'createdAt',
        }),
      ]);

      return {
        name: name as string,
        symbol: symbol as string,
        tokens: tokens as string[],
        weights: weights as bigint[],
        totalSupply: totalSupply as bigint,
        createdAt: createdAt as bigint,
      };
    } catch (error) {
      console.error('Error fetching basic DTF info:', error);
      throw new DTFError('Failed to fetch DTF information', 'FETCH_ERROR');
    }
  }
};

// Real-time update functions
export const realTimeFunctions = {
  // Subscribe to portfolio value changes
  subscribeToPortfolioValue: (
    dtfAddress: string,
    callback: (value: bigint) => void,
    interval: number = 30000 // 30 seconds
  ): (() => void) => {
    const intervalId = setInterval(async () => {
      try {
        const value = await dtfFunctions.getCurrentPortfolioValue(dtfAddress);
        callback(value);
      } catch (error) {
        console.error('Error in portfolio value subscription:', error);
      }
    }, interval);

    return () => clearInterval(intervalId);
  },

  // Subscribe to user balance changes
  subscribeToUserBalance: (
    dtfAddress: string,
    userAddress: string,
    callback: (balance: bigint) => void,
    interval: number = 30000 // 30 seconds
  ): (() => void) => {
    const intervalId = setInterval(async () => {
      try {
        const balance = await dtfFunctions.getUserDTFBalance(dtfAddress, userAddress);
        callback(balance);
      } catch (error) {
        console.error('Error in user balance subscription:', error);
      }
    }, interval);

    return () => clearInterval(intervalId);
  }
};

export const dtfContract = {
  factory: factoryFunctions,
  dtf: dtfFunctions,
  realTime: realTimeFunctions,
  utils: {
    formatWeiToEth,
    formatEthToWei,
    calculateFees,
    validateInputs,
  }
};