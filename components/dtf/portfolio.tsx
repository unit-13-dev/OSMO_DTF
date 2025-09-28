"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  DollarSign, 
  Clock,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle
} from 'lucide-react';
import { dtfContract, DTFData, PortfolioData, DTFError, formatWeiToEth, calculateFees, } from '@/lib/dtf-functions';
import { getBatchTokenMetadata } from '@/lib/token-metadata-cache';
import { DTF_CONSTANTS } from '@/config/contracts';
import { useToast } from '@/hooks/use-toast';
import PortfolioErrorHandler from './portfolio-error-handler';

interface PortfolioProps {
  dtfAddress?: string;
}

interface TokenData {
  name: string;
  address: string;
  balance: string;
  weight: number;
  ethValue: string;
  percentage: number;
  color: string;
  // Enhanced metadata from CoinGecko
  symbol?: string;
  decimals?: number;
  logoUrl?: string;
  isVerified?: boolean;
  coingeckoId?: string;
  marketCap?: number;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  description?: string;
  metadataLoading?: boolean;
  metadataError?: boolean;
}

interface SecurityScore {
  score: number;
  factors: {
    diversification: number;
    liquidity: number;
    volatility: number;
    risk: number;
  };
}

const COLORS = [
  '#7A7FEE', '#FF6B6B', '#4ECDC4', '#45B7D1', 
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
  '#F7DC6F', '#BB8FCE'
];

export default function Portfolio({ dtfAddress: propDtfAddress }: PortfolioProps) {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [dtfAddress, setDtfAddress] = useState<string>(propDtfAddress || '');
  const [dtfInfo, setDtfInfo] = useState<DTFData | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [tokenData, setTokenData] = useState<TokenData[]>([]);
  const [securityScore, setSecurityScore] = useState<SecurityScore | null>(null);
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);

  // Get DTF address from URL params if not provided as prop
  useEffect(() => {
    if (!propDtfAddress) {
      const urlDtfAddress = searchParams?.get('dtf');
      if (urlDtfAddress) {
        setDtfAddress(urlDtfAddress);
      }
    }
  }, [searchParams, propDtfAddress]);

  // Validate DTF address format
  const isValidDTFAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Function to fetch token metadata using centralized cache
  const fetchTokenMetadata = useCallback(async (addresses: string[]): Promise<Record<string, any>> => {
    try {
      setMetadataLoading(true);
      
      // Use the centralized token metadata cache
      const tokens = await getBatchTokenMetadata(addresses);
      
      // Convert array to object keyed by address for easy lookup
      const metadataMap: Record<string, any> = {};
      tokens.forEach((token) => {
        metadataMap[token.address.toLowerCase()] = token;
      });

      return metadataMap;
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return {};
    } finally {
      setMetadataLoading(false);
    }
  }, []);

  const fetchPortfolioData = useCallback(async () => {
    if (!dtfAddress) {
      setError('No DTF address provided');
      setLoading(false);
      return;
    }

    if (!isValidDTFAddress(dtfAddress)) {
      setError('Invalid DTF address format');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Fetch DTF info
      const info = await dtfContract.factory.getDTFInfo(dtfAddress);
      setDtfInfo(info);

      // Fetch portfolio data
      const portfolio = await dtfContract.dtf.getDetailedPortfolio(dtfAddress);
      setPortfolioData(portfolio);

      // Process token data for pie chart
      const tokens: TokenData[] = [];
      for (let i = 0; i < portfolio.tokenAddresses.length; i++) {
        const address = portfolio.tokenAddresses[i];
        const balance = portfolio.balances[i];
        const ethValue = portfolio.ethValues[i];
        const weight = Number(info.weights[i]) / 100; // Convert from basis points to percentage
        
        // Default token name (will be updated with metadata)
        const tokenName = address === '0x0000000000000000000000000000000000000000' 
          ? 'ETH' 
          : `Token ${i + 1}`;

        tokens.push({
          name: tokenName,
          address,
          balance: formatWeiToEth(balance, 4),
          weight,
          ethValue: formatWeiToEth(ethValue, 4),
          percentage: portfolio.totalValue > BigInt(0) 
            ? Number((ethValue * BigInt(10000)) / portfolio.totalValue) / 100 
            : 0,
          color: COLORS[i % COLORS.length],
          metadataLoading: true,
          metadataError: false
        });
      }
      setTokenData(tokens);

      // Fetch token metadata from CoinGecko
      const addresses = portfolio.tokenAddresses.filter(addr => 
        addr !== '0x0000000000000000000000000000000000000000'
      );
      
      if (addresses.length > 0) {
        const metadata = await fetchTokenMetadata(addresses);
        
        // Update token data with metadata
        setTokenData(prevTokens => 
          prevTokens.map(token => {
            if (token.address === '0x0000000000000000000000000000000000000000') {
              // Special handling for ETH
              return {
                ...token,
                symbol: 'ETH',
                name: 'Ethereum',
                decimals: 18,
                isVerified: true,
                logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
                metadataLoading: false,
                metadataError: false
              };
            }
            
            const tokenMetadata = metadata[token.address.toLowerCase()];
            if (tokenMetadata) {
              return {
                ...token,
                name: tokenMetadata.name || token.name,
                symbol: tokenMetadata.symbol || 'UNKNOWN',
                decimals: tokenMetadata.decimals || 18,
                logoUrl: tokenMetadata.logoUrl,
                isVerified: tokenMetadata.isVerified || false,
                coingeckoId: tokenMetadata.coingeckoId,
                marketCap: tokenMetadata.marketCap,
                price: tokenMetadata.price,
                priceChange24h: tokenMetadata.priceChange24h,
                volume24h: tokenMetadata.volume24h,
                description: tokenMetadata.description,
                metadataLoading: false,
                metadataError: false
              };
            }
            
            // No metadata found
            return {
              ...token,
              metadataLoading: false,
              metadataError: true
            };
          })
        );
      } else {
        // Only ETH tokens, update loading state
        setTokenData(prevTokens => 
          prevTokens.map(token => ({
            ...token,
            metadataLoading: false,
            metadataError: token.address === '0x0000000000000000000000000000000000000000' ? false : true
          }))
        );
      }

      // Calculate security score
      const score = calculateSecurityScore(tokens, info);
      setSecurityScore(score);

      // Fetch user balance if connected
      if (isConnected && address) {
        const balance = await dtfContract.dtf.getUserDTFBalance(dtfAddress, address);
        setUserBalance(balance);
      }

    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      if (err instanceof DTFError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load portfolio data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dtfAddress, isConnected, address, fetchTokenMetadata, isValidDTFAddress]);

  const calculateSecurityScore = (tokens: TokenData[], info: DTFData): SecurityScore => {
    // Diversification score (more tokens = better)
    const diversification = Math.min(tokens.length * 20, 100);
    
    // Weight distribution score (more balanced = better)
    const weights = tokens.map(t => t.weight);
    const weightVariance = weights.reduce((sum, weight) => sum + Math.pow(weight - 25, 2), 0) / weights.length;
    const weightScore = Math.max(0, 100 - weightVariance);
    
    // Liquidity score (ETH presence = better)
    const hasEth = tokens.some(t => t.address === '0x0000000000000000000000000000000000000000');
    const liquidity = hasEth ? 80 : 60;
    
    // Volatility score (simplified - more tokens = less volatile)
    const volatility = Math.max(0, 100 - (tokens.length - 2) * 10);
    
    const overallScore = Math.round((diversification + weightScore + liquidity + volatility) / 4);
    
    return {
      score: overallScore,
      factors: {
        diversification,
        liquidity,
        volatility,
        risk: 100 - overallScore
      }
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPortfolioData();
  };

  useEffect(() => {
    if (dtfAddress) {
      fetchPortfolioData();
    }
  }, [dtfAddress, fetchPortfolioData]);

  // Real-time updates
  useEffect(() => {
    if (!dtfAddress || !isConnected || !address) return;

    const unsubscribe = dtfContract.realTime.subscribeToUserBalance(
      dtfAddress,
      address,
      (balance) => setUserBalance(balance),
      30000 // 30 seconds
    );

    return unsubscribe;
  }, [dtfAddress, isConnected, address]);

  if (!dtfAddress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No DTF address provided. Please select a DTF from the dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return <PortfolioSkeleton />;
  }

  if (error) {
    return (
      <PortfolioErrorHandler
        error={error}
        dtfAddress={dtfAddress}
        onRetry={handleRefresh}
        retryLoading={refreshing}
      />
    );
  }

  if (!dtfInfo || !portfolioData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load DTF information.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              {dtfInfo.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {dtfInfo.symbol} • Portfolio Overview
            </p>
          </div>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-white">
                {formatWeiToEth(portfolioData.totalValue, 4)} ETH
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Portfolio value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Your Balance
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-white">
                {formatWeiToEth(userBalance, 4)} {dtfInfo.symbol}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {isConnected ? 'Your holdings' : 'Connect wallet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Security Score
              </CardTitle>
              <Shield className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-white">
                {securityScore?.score || 0}/100
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Risk assessment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Token Count
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-white">
                {tokenData.length}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Diversified assets
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-black dark:text-white">
                  Portfolio Allocation
                </CardTitle>
                <CardDescription>
                  Distribution of assets in the DTF
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tokenData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, symbol, percentage }) => {
                          const displayName = symbol && symbol !== 'UNKNOWN' ? symbol : name;
                          return `${displayName}: ${percentage.toFixed(1)}%`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {tokenData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(2)}%`, 'Allocation']}
                        labelStyle={{ color: '#000' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Security Score Breakdown */}
            {securityScore && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-black dark:text-white">
                    Security Analysis
                  </CardTitle>
                  <CardDescription>
                    Risk assessment breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Diversification', value: securityScore.factors.diversification },
                        { name: 'Liquidity', value: securityScore.factors.liquidity },
                        { name: 'Volatility', value: securityScore.factors.volatility },
                        { name: 'Risk', value: securityScore.factors.risk }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}`, 'Score']} />
                        <Bar dataKey="value" fill="#7A7FEE" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Forms and Table */}
          <div className="space-y-6">
            {/* Mint/Redeem Forms */}
            {isConnected && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-black dark:text-white">
                    Trade DTF
                  </CardTitle>
                  <CardDescription>
                    Mint or redeem DTF tokens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="mint" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="mint">Mint</TabsTrigger>
                      <TabsTrigger value="redeem">Redeem</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="mint" className="space-y-4">
                      <MintForm 
                        dtfAddress={dtfAddress}
                        userBalance={userBalance}
                        onSuccess={() => {
                          fetchPortfolioData();
                          toast({
                            title: "Success",
                            description: "DTF tokens minted successfully!",
                          });
                        }}
                      />
                    </TabsContent>
                    
                    <TabsContent value="redeem" className="space-y-4">
                      <RedeemForm 
                        dtfAddress={dtfAddress}
                        userBalance={userBalance}
                        onSuccess={() => {
                          fetchPortfolioData();
                          toast({
                            title: "Success",
                            description: "DTF tokens redeemed successfully!",
                          });
                        }}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Token List Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-black dark:text-white">
                  Token Details
                </CardTitle>
                <CardDescription>
                  Individual token information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tokenData.map((token, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {/* Token Logo */}
                        {token.logoUrl ? (
                          <img 
                            src={token.logoUrl} 
                            alt={token.name}
                            className="w-6 h-6 rounded-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-6 h-6 rounded-full ${token.logoUrl ? 'hidden' : ''}`}
                          style={{ backgroundColor: token.color }}
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-black dark:text-white">
                              {token.name}
                            </p>
                            {token.symbol && token.symbol !== 'UNKNOWN' && (
                              <Badge variant="outline" className="text-xs">
                                {token.symbol}
                              </Badge>
                            )}
                            {token.isVerified && (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {token.address.slice(0, 6)}...{token.address.slice(-4)}
                          </p>
                          
                          {/* Price Information */}
                          {token.price && (
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                ${token.price.toFixed(6)}
                              </p>
                              {token.priceChange24h !== undefined && (
                                <span className={`text-xs flex items-center ${
                                  token.priceChange24h >= 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {token.priceChange24h >= 0 ? (
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                  ) : (
                                    <ArrowDownRight className="w-3 h-3 mr-1" />
                                  )}
                                  {Math.abs(token.priceChange24h).toFixed(2)}%
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Loading State */}
                          {token.metadataLoading && (
                            <div className="flex items-center space-x-1 mt-1">
                              <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />
                              <span className="text-xs text-gray-400">Loading metadata...</span>
                            </div>
                          )}
                          
                          {/* Error State */}
                          {token.metadataError && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                              Metadata not available
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-black dark:text-white">
                          {token.percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {token.ethValue} ETH
                        </p>
                        {token.balance && token.symbol && token.symbol !== 'UNKNOWN' && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {token.balance} {token.symbol}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mint Form Component
interface MintFormProps {
  dtfAddress: string;
  userBalance: bigint;
  onSuccess: () => void;
}

function MintForm({ dtfAddress, onSuccess }: MintFormProps) {
  const [ethAmount, setEthAmount] = useState('');
  const [slippage, setSlippage] = useState('2');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ dtfTokens: string; fee: string; investedAmount: string } | null>(null);
  const { toast } = useToast();

  const handlePreview = async () => {
    if (!ethAmount || parseFloat(ethAmount) <= 0) return;

    try {
      const result = await dtfContract.dtf.getMintPreview(
        dtfAddress,
        ethAmount,
        parseInt(slippage)
      );

      setPreview({
        dtfTokens: formatWeiToEth(result.dtfTokens, 4),
        fee: formatWeiToEth(result.fee, 4),
        investedAmount: formatWeiToEth(result.investedAmount, 4)
      });
    } catch (error) {
      console.error('Error getting mint preview:', error);
      toast({
        title: "Error",
        description: "Failed to get mint preview",
        variant: "destructive",
      });
    }
  };

  const handleMint = async () => {
    if (!ethAmount || parseFloat(ethAmount) <= 0) return;

    try {
      setLoading(true);
      await dtfContract.dtf.mintWithEth(dtfAddress, ethAmount, parseInt(slippage));
      onSuccess();
      setEthAmount('');
      setPreview(null);
    } catch (error) {
      console.error('Error minting:', error);
      toast({
        title: "Error",
        description: error instanceof DTFError ? error.message : "Failed to mint DTF tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="eth-amount">ETH Amount</Label>
        <Input
          id="eth-amount"
          type="number"
          placeholder="0.0"
          value={ethAmount}
          onChange={(e) => setEthAmount(e.target.value)}
          onBlur={handlePreview}
        />
      </div>

      <div>
        <Label htmlFor="slippage">Slippage (%)</Label>
        <Input
          id="slippage"
          type="number"
          placeholder="2"
          value={slippage}
          onChange={(e) => setSlippage(e.target.value)}
        />
      </div>

      {preview && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">You will receive:</span>
            <span className="font-medium text-black dark:text-white">{preview.dtfTokens} DTF</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Fee:</span>
            <span className="font-medium text-black dark:text-white">{preview.fee} ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Invested amount:</span>
            <span className="font-medium text-black dark:text-white">{preview.investedAmount} ETH</span>
          </div>
        </div>
      )}

      <Button 
        onClick={handleMint}
        disabled={loading || !ethAmount || parseFloat(ethAmount) <= 0}
        className="w-full"
      >
        {loading ? 'Minting...' : 'Mint DTF Tokens'}
      </Button>
    </div>
  );
}

// Redeem Form Component
interface RedeemFormProps {
  dtfAddress: string;
  userBalance: bigint;
  onSuccess: () => void;
}

function RedeemForm({ dtfAddress, userBalance, onSuccess }: RedeemFormProps) {
  const [dtfAmount, setDtfAmount] = useState('');
  const [slippage, setSlippage] = useState('2');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ ethAmount: string; fee: string; netAmount: string } | null>(null);
  const { toast } = useToast();

  const handlePreview = async () => {
    if (!dtfAmount || parseFloat(dtfAmount) <= 0) return;

    try {
      const result = await dtfContract.dtf.getRedemptionPreview(
        dtfAddress,
        dtfAmount,
        parseInt(slippage)
      );

      setPreview({
        ethAmount: formatWeiToEth(result.ethAmount, 4),
        fee: formatWeiToEth(result.feeAmount, 4),
        netAmount: formatWeiToEth(result.netAmount, 4)
      });
    } catch (error) {
      console.error('Error getting redemption preview:', error);
      toast({
        title: "Error",
        description: "Failed to get redemption preview",
        variant: "destructive",
      });
    }
  };

  const handleRedeem = async () => {
    if (!dtfAmount || parseFloat(dtfAmount) <= 0) return;

    try {
      setLoading(true);
      await dtfContract.dtf.redeemForEth(dtfAddress, dtfAmount, parseInt(slippage));
      onSuccess();
      setDtfAmount('');
      setPreview(null);
    } catch (error) {
      console.error('Error redeeming:', error);
      toast({
        title: "Error",
        description: error instanceof DTFError ? error.message : "Failed to redeem DTF tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="dtf-amount">DTF Amount</Label>
        <Input
          id="dtf-amount"
          type="number"
          placeholder="0.0"
          value={dtfAmount}
          onChange={(e) => setDtfAmount(e.target.value)}
          onBlur={handlePreview}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Available: {formatWeiToEth(userBalance, 4)} DTF
        </p>
      </div>

      <div>
        <Label htmlFor="slippage-redeem">Slippage (%)</Label>
        <Input
          id="slippage-redeem"
          type="number"
          placeholder="2"
          value={slippage}
          onChange={(e) => setSlippage(e.target.value)}
        />
      </div>

      {preview && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">You will receive:</span>
            <span className="font-medium text-black dark:text-white">{preview.netAmount} ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Fee:</span>
            <span className="font-medium text-black dark:text-white">{preview.fee} ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total value:</span>
            <span className="font-medium text-black dark:text-white">{preview.ethAmount} ETH</span>
          </div>
        </div>
      )}

      <Button 
        onClick={handleRedeem}
        disabled={loading || !dtfAmount || parseFloat(dtfAmount) <= 0 || userBalance === BigInt(0)}
        className="w-full"
      >
        {loading ? 'Redeeming...' : 'Redeem for ETH'}
      </Button>
    </div>
  );
}

// Skeleton Component
function PortfolioSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-80 w-full" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
