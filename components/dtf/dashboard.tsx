"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Clock,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { dtfContract, DTFData, DTFError } from '@/lib/dtf-functions';
import { formatWeiToEth } from '@/lib/dtf-functions';
import DTFTable from './dtf-table';

interface DashboardStats {
  totalDTFs: number;
  totalValueLocked: bigint;
  activeDTFs: number;
  totalUsers: number;
}

export default function DTFDashboard() {
  const { address, isConnected } = useAccount();
  const [dtfs, setDtfs] = useState<DTFData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDTFs = async () => {
    try {
      setError(null);
      const allDTFs = await dtfContract.factory.getAllDTFs();
      setDtfs(allDTFs);

      // Calculate stats
      let totalValueLocked = BigInt(0);
      let activeCount = 0;
      
      for (const dtf of allDTFs) {
        if (dtf.active) {
          activeCount++;
          try {
            const value = await dtfContract.dtf.getCurrentPortfolioValue(dtf.dtfAddress);
            totalValueLocked += value;
          } catch (err) {
            console.warn(`Failed to fetch value for DTF ${dtf.dtfAddress}:`, err);
          }
        }
      }

      setStats({
        totalDTFs: allDTFs.length,
        totalValueLocked,
        activeDTFs: activeCount,
        totalUsers: 0, // This would need to be tracked separately
      });
    } catch (err) {
      console.error('Error fetching DTFs:', err);
      if (err instanceof DTFError) {
        setError(err.message);
      } else {
        setError('Failed to load DTF data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDTFs();
  };

  useEffect(() => {
    fetchDTFs();
  }, []);

  if (loading) {
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
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
              DTF Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Discover and explore Decentralized Token Funds
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

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total DTFs
                </CardTitle>
                <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black dark:text-white">
                  {stats.totalDTFs}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Active: {stats.activeDTFs}
                </p>
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Value Locked
                </CardTitle>
                <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black dark:text-white">
                  {formatWeiToEth(stats.totalValueLocked, 2)} ETH
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Across all DTFs
                </p>
              </CardContent>
            </Card> */}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active DTFs
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black dark:text-white">
                  {stats.activeDTFs}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Network
                </CardTitle>
                <ExternalLink className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black dark:text-white">
                  Unichain
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Sepolia Testnet
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* DTF List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Available DTFs
          </h2>
          
          <DTFTable 
            dtfs={dtfs}
            loading={loading}
            onRefresh={handleRefresh}
            onDTFSelect={(dtfAddress) => {
              window.location.href = `/portfolio?dtf=${dtfAddress}`;
            }}
          />
        </div>
      </div>
    </div>
  );
}

