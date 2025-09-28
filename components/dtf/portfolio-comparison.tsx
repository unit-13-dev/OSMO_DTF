import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Shield, 
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatWeiToEth } from '@/lib/dtf-functions';
import { useToast } from '@/hooks/use-toast';

interface ComparisonData {
  dtfAddress: string;
  name: string;
  symbol: string;
  totalValue: bigint;
  tokenCount: number;
  securityScore: number;
  performance24h: number;
  fees: bigint;
  createdAt: bigint;
  tokens: Array<{
    address: string;
    name: string;
    symbol: string;
    percentage: number;
    value: bigint;
  }>;
}

interface PortfolioComparisonProps {
  dtfAddresses: string[];
  onClose?: () => void;
}

const COLORS = [
  '#7A7FEE', '#FF6B6B', '#4ECDC4', '#45B7D1', 
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
  '#F7DC6F', '#BB8FCE'
];

export default function PortfolioComparison({ dtfAddresses, onClose }: PortfolioComparisonProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        setLoading(true);
        
        // This would be replaced with actual API calls
        const mockData: ComparisonData[] = dtfAddresses.map((address, index) => ({
          dtfAddress: address,
          name: `DTF Portfolio ${index + 1}`,
          symbol: `DTF${index + 1}`,
          totalValue: BigInt(Math.random() * 100 * 1e18), // Random value for demo
          tokenCount: 3 + Math.floor(Math.random() * 5),
          securityScore: 60 + Math.floor(Math.random() * 40),
          performance24h: (Math.random() - 0.5) * 20, // Random performance
          fees: BigInt(Math.random() * 10 * 1e18),
          createdAt: BigInt(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          tokens: [
            { address: '0x0000000000000000000000000000000000000000', name: 'Ethereum', symbol: 'ETH', percentage: 40, value: BigInt(40 * 1e18) },
            { address: '0x123...', name: 'Token A', symbol: 'TOK1', percentage: 30, value: BigInt(30 * 1e18) },
            { address: '0x456...', name: 'Token B', symbol: 'TOK2', percentage: 30, value: BigInt(30 * 1e18) },
          ]
        }));

        setComparisonData(mockData);
      } catch (err) {
        setError('Failed to load comparison data');
        console.error('Error fetching comparison data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (dtfAddresses.length > 0) {
      fetchComparisonData();
    }
  }, [dtfAddresses]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading Comparison...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare data for charts
  const performanceData = comparisonData.map(dtf => ({
    name: dtf.symbol,
    value: dtf.performance24h,
    totalValue: Number(formatWeiToEth(dtf.totalValue, 4)),
    securityScore: dtf.securityScore,
    tokenCount: dtf.tokenCount
  }));

  const securityData = comparisonData.map(dtf => ({
    name: dtf.symbol,
    securityScore: dtf.securityScore,
    totalValue: Number(formatWeiToEth(dtf.totalValue, 4))
  }));

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Portfolio Comparison
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Compare {comparisonData.length} DTF portfolios
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close Comparison
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {comparisonData.map((dtf, index) => (
          <Card key={dtf.dtfAddress}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {dtf.name}
              </CardTitle>
              <Badge variant="outline">{dtf.symbol}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-black dark:text-white">
                {formatWeiToEth(dtf.totalValue, 4)} ETH
              </div>
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                {dtf.performance24h >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1 text-red-600" />
                )}
                <span className={dtf.performance24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {dtf.performance24h.toFixed(2)}%
                </span>
                <span className="ml-2">24h</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Charts */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">
            <Activity className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="allocation">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Allocation
          </TabsTrigger>
          <TabsTrigger value="details">
            <BarChart3 className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>24h Performance Comparison</CardTitle>
              <CardDescription>
                Compare the 24-hour performance of different DTFs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Performance']}
                      labelStyle={{ color: '#000' }}
                    />
                    <Bar dataKey="value" fill="#7A7FEE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Score Comparison</CardTitle>
              <CardDescription>
                Compare security scores and total values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={securityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value: number) => [`${value}`, 'Security Score']}
                      labelStyle={{ color: '#000' }}
                    />
                    <Bar dataKey="securityScore" fill="#4ECDC4" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {comparisonData.map((dtf, index) => (
              <Card key={dtf.dtfAddress}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {dtf.name} Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dtf.tokens}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ symbol, percentage }) => `${symbol}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="percentage"
                        >
                          {dtf.tokens.map((_, tokenIndex) => (
                            <Cell key={`cell-${tokenIndex}`} fill={COLORS[tokenIndex % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value}%`, 'Allocation']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Comparison</CardTitle>
              <CardDescription>
                Comprehensive comparison of all DTF metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">DTF</th>
                      <th className="text-left p-2">Total Value</th>
                      <th className="text-left p-2">Token Count</th>
                      <th className="text-left p-2">Security Score</th>
                      <th className="text-left p-2">24h Performance</th>
                      <th className="text-left p-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((dtf) => (
                      <tr key={dtf.dtfAddress} className="border-b">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{dtf.name}</div>
                            <div className="text-xs text-gray-500 font-mono">
                              {dtf.dtfAddress.slice(0, 8)}...{dtf.dtfAddress.slice(-6)}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">{formatWeiToEth(dtf.totalValue, 4)} ETH</td>
                        <td className="p-2">{dtf.tokenCount}</td>
                        <td className="p-2">
                          <Badge variant={dtf.securityScore >= 80 ? 'default' : dtf.securityScore >= 60 ? 'secondary' : 'destructive'}>
                            {dtf.securityScore}/100
                          </Badge>
                        </td>
                        <td className="p-2">
                          <span className={dtf.performance24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {dtf.performance24h >= 0 ? '+' : ''}{dtf.performance24h.toFixed(2)}%
                          </span>
                        </td>
                        <td className="p-2">
                          {new Date(Number(dtf.createdAt) * 1000).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
