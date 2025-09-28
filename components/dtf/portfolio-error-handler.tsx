import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  Wallet,
  Network,
  Search,
  Plus
} from 'lucide-react';
import { useAccount } from 'wagmi';
import Link from 'next/link';

interface PortfolioErrorHandlerProps {
  error: string;
  dtfAddress?: string;
  onRetry?: () => void;
  retryLoading?: boolean;
}

export default function PortfolioErrorHandler({ 
  error, 
  dtfAddress, 
  onRetry, 
  retryLoading = false 
}: PortfolioErrorHandlerProps) {
  const { isConnected, chainId } = useAccount();

  // Parse error type for specific handling
  const getErrorType = (errorMsg: string) => {
    if (errorMsg.includes('No DTF address')) return 'NO_ADDRESS';
    if (errorMsg.includes('Failed to fetch DTF information')) return 'DTF_NOT_FOUND';
    if (errorMsg.includes('Network')) return 'NETWORK_ERROR';
    if (errorMsg.includes('Contract')) return 'CONTRACT_ERROR';
    if (errorMsg.includes('RPC') || errorMsg.includes('connection')) return 'RPC_ERROR';
    return 'GENERIC';
  };

  const errorType = getErrorType(error);

  const renderErrorContent = () => {
    switch (errorType) {
      case 'NO_ADDRESS':
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-xl">No DTF Selected</CardTitle>
              <CardDescription>
                Please select a DTF to view its portfolio details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <Link href="/discover">
                  <Button className="w-full" variant="default">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Available DTFs
                  </Button>
                </Link>
                <Link href="/create">
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New DTF
                  </Button>
                </Link>
              </div>
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                Or use a direct link: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  /portfolio/[dtf-address]
                </code>
              </div>
            </CardContent>
          </Card>
        );

      case 'DTF_NOT_FOUND':
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl">DTF Not Found</CardTitle>
              <CardDescription>
                The DTF address <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {dtfAddress?.slice(0, 8)}...{dtfAddress?.slice(-6)}
                </code> could not be found or is inactive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {onRetry && (
                  <Button onClick={onRetry} disabled={retryLoading} variant="default">
                    <RefreshCw className={`h-4 w-4 mr-2 ${retryLoading ? 'animate-spin' : ''}`} />
                    {retryLoading ? 'Retrying...' : 'Retry'}
                  </Button>
                )}
                <Link href="/discover">
                  <Button className="w-full" variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Available DTFs
                  </Button>
                </Link>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p><strong>Possible reasons:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>DTF address is incorrect</li>
                  <li>DTF has been deactivated</li>
                  <li>DTF doesn't exist on this network</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      case 'NETWORK_ERROR':
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <Network className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-xl">Network Error</CardTitle>
              <CardDescription>
                There's an issue with the network connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {onRetry && (
                  <Button onClick={onRetry} disabled={retryLoading} variant="default">
                    <RefreshCw className={`h-4 w-4 mr-2 ${retryLoading ? 'animate-spin' : ''}`} />
                    {retryLoading ? 'Retrying...' : 'Retry'}
                  </Button>
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p><strong>Current status:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Connected: {isConnected ? 'Yes' : 'No'}</li>
                  <li>Chain ID: {chainId || 'Not connected'}</li>
                  <li>Expected: Unichain Sepolia</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      case 'CONTRACT_ERROR':
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-xl">Contract Error</CardTitle>
              <CardDescription>
                There's an issue accessing the smart contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {onRetry && (
                  <Button onClick={onRetry} disabled={retryLoading} variant="default">
                    <RefreshCw className={`h-4 w-4 mr-2 ${retryLoading ? 'animate-spin' : ''}`} />
                    {retryLoading ? 'Retrying...' : 'Retry'}
                  </Button>
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p><strong>Possible reasons:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Contract not deployed on this network</li>
                  <li>RPC endpoint issues</li>
                  <li>Contract ABI mismatch</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      case 'RPC_ERROR':
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl">Connection Error</CardTitle>
              <CardDescription>
                Unable to connect to the blockchain network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {onRetry && (
                  <Button onClick={onRetry} disabled={retryLoading} variant="default">
                    <RefreshCw className={`h-4 w-4 mr-2 ${retryLoading ? 'animate-spin' : ''}`} />
                    {retryLoading ? 'Retrying...' : 'Retry'}
                  </Button>
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p><strong>Check your connection:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Internet connection is stable</li>
                  <li>Wallet is connected</li>
                  <li>Correct network is selected</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <CardDescription>
                An unexpected error occurred while loading the portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {onRetry && (
                  <Button onClick={onRetry} disabled={retryLoading} variant="default">
                    <RefreshCw className={`h-4 w-4 mr-2 ${retryLoading ? 'animate-spin' : ''}`} />
                    {retryLoading ? 'Retrying...' : 'Retry'}
                  </Button>
                )}
                <Link href="/discover">
                  <Button className="w-full" variant="outline">
                    <Search className="h-4 w-4 mr-2" />
                    Browse DTFs
                  </Button>
                </Link>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Error details:</strong> {error}
                </p>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {renderErrorContent()}
    </div>
  );
}
