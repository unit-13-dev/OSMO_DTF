"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Plus,
  Eye,
  Star,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatWeiToEth } from '@/lib/dtf-functions';
import { useToast } from '@/hooks/use-toast';
import { useDTFList, EnhancedDTFData } from '@/context/DTFContext';
import PortfolioFilters from './portfolio-filters';
import PortfolioComparison from './portfolio-comparison';

// Use EnhancedDTFData from context instead of local interface
type DiscoveryData = EnhancedDTFData;

interface FilterOptions {
  searchQuery: string;
  sortBy: 'name' | 'totalValue' | 'securityScore' | 'performance24h' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  minValue: number;
  maxValue: number;
  minSecurityScore: number;
  maxSecurityScore: number;
  tokenCount: number[];
  categories: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  showVerifiedOnly: boolean;
  showActiveOnly: boolean;
}

export default function PortfolioDiscovery() {
  // Use DTF context instead of local state
  const { dtfs, loading, error, refresh: refreshDTFs } = useDTFList();
  const [filteredDtfs, setFilteredDtfs] = useState<DiscoveryData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDtfs, setSelectedDtfs] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    sortBy: 'totalValue',
    sortOrder: 'desc',
    minValue: 0,
    maxValue: 1000,
    minSecurityScore: 0,
    maxSecurityScore: 100,
    tokenCount: [2, 10],
    categories: [],
    dateRange: { start: null, end: null },
    showVerifiedOnly: false,
    showActiveOnly: true,
  });
  
  const router = useRouter();
  const { toast } = useToast();

  // Remove fetchDTFs function as it's now handled by context

  // Apply filters
  useEffect(() => {
    let filtered = [...dtfs];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(dtf => 
        dtf.name.toLowerCase().includes(query) ||
        dtf.symbol.toLowerCase().includes(query) ||
        dtf.dtfAddress.toLowerCase().includes(query)
      );
    }

    // Value range filter
    filtered = filtered.filter(dtf => {
      const value = Number(formatWeiToEth(dtf.portfolioValue || BigInt(0), 4));
      return value >= filters.minValue && value <= filters.maxValue;
    });

    // Security score filter
    filtered = filtered.filter(dtf => {
      const score = dtf.securityScore || 0;
      return score >= filters.minSecurityScore && score <= filters.maxSecurityScore;
    });

    // Token count filter
    filtered = filtered.filter(dtf => {
      const count = dtf.tokenCount || 0;
      return count >= filters.tokenCount[0] && count <= filters.tokenCount[1];
    });

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(dtf => {
        const createdAt = new Date(Number(dtf.createdAt) * 1000);
        const start = filters.dateRange.start;
        const end = filters.dateRange.end;
        
        if (start && createdAt < start) return false;
        if (end && createdAt > end) return false;
        return true;
      });
    }

    // Verified only filter
    if (filters.showVerifiedOnly) {
      filtered = filtered.filter(dtf => dtf.isVerified);
    }

    // Active only filter
    if (filters.showActiveOnly) {
      filtered = filtered.filter(dtf => dtf.active);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'totalValue':
          aValue = Number(formatWeiToEth(a.portfolioValue || BigInt(0), 4));
          bValue = Number(formatWeiToEth(b.portfolioValue || BigInt(0), 4));
          break;
        case 'securityScore':
          aValue = a.securityScore || 0;
          bValue = b.securityScore || 0;
          break;
        case 'performance24h':
          aValue = a.performance24h || 0;
          bValue = b.performance24h || 0;
          break;
        case 'createdAt':
          aValue = Number(a.createdAt);
          bValue = Number(b.createdAt);
          break;
        default:
          aValue = Number(formatWeiToEth(a.portfolioValue || BigInt(0), 4));
          bValue = Number(formatWeiToEth(b.portfolioValue || BigInt(0), 4));
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDtfs(filtered);
  }, [dtfs, filters]);

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  };

  const handleSort = (sortBy: string, order: string) => {
    setFilters(prev => ({ 
      ...prev, 
      sortBy: sortBy as any, 
      sortOrder: order as 'asc' | 'desc' 
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshDTFs();
    setRefreshing(false);
  };

  const handleViewPortfolio = (dtfAddress: string) => {
    router.push(`/portfolio/${dtfAddress}`);
  };

  const handleToggleSelection = (dtfAddress: string) => {
    setSelectedDtfs(prev => 
      prev.includes(dtfAddress) 
        ? prev.filter(addr => addr !== dtfAddress)
        : [...prev, dtfAddress]
    );
  };

  const handleCompare = () => {
    if (selectedDtfs.length >= 2) {
      setShowComparison(true);
    } else {
      toast({
        title: "Select DTFs to Compare",
        description: "Please select at least 2 DTFs to compare.",
        variant: "destructive",
      });
    }
  };

  // Remove useEffect for fetchDTFs as it's now handled by context

  if (showComparison && selectedDtfs.length >= 2) {
    return (
      <PortfolioComparison
        dtfAddresses={selectedDtfs}
        onClose={() => setShowComparison(false)}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Discover DTFs
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Explore and compare Decentralized Token Funds
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedDtfs.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedDtfs.length} selected
                </Badge>
                <Button
                  onClick={handleCompare}
                  disabled={selectedDtfs.length < 2}
                  variant="outline"
                  size="sm"
                >
                  {/* <Compare className="h-4 w-4 mr-2" /> */}
                  Compare
                </Button>
              </div>
            )}
            <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <PortfolioFilters
          onFiltersChange={handleFiltersChange}
          onSearch={handleSearch}
          onSort={handleSort}
          totalResults={filteredDtfs.length}
          loading={loading}
        />

        {/* Error State */}
        {error && (
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
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400">
                Showing {filteredDtfs.length} of {dtfs.length} DTFs
              </p>
              <div className="flex items-center gap-2">
                <Link href="/create">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create DTF
                  </Button>
                </Link>
              </div>
            </div>

            {/* DTF Grid */}
            {filteredDtfs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No DTFs Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Try adjusting your filters or create a new DTF.
                  </p>
                  <Link href="/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First DTF
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDtfs.map((dtf) => (
                  <Card 
                    key={dtf.dtfAddress} 
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedDtfs.includes(dtf.dtfAddress) ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleToggleSelection(dtf.dtfAddress)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{dtf.name}</CardTitle>
                          <CardDescription>{dtf.symbol}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {dtf.isVerified && (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {selectedDtfs.includes(dtf.dtfAddress) && (
                            <Badge variant="secondary">Selected</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Portfolio Value */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
                        <span className="font-medium">
                          {formatWeiToEth(dtf.portfolioValue || BigInt(0), 4)} ETH
                        </span>
                      </div>

                      {/* Security Score */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Security Score</span>
                        <Badge 
                          variant={dtf.securityScore && dtf.securityScore >= 80 ? 'default' : 
                                 dtf.securityScore && dtf.securityScore >= 60 ? 'secondary' : 'destructive'}
                        >
                          {dtf.securityScore || 0}/100
                        </Badge>
                      </div>

                      {/* Performance */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">24h Performance</span>
                        <span className={`flex items-center text-sm ${
                          (dtf.performance24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(dtf.performance24h || 0) >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(dtf.performance24h || 0).toFixed(2)}%
                        </span>
                      </div>

                      {/* Token Count */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tokens</span>
                        <span className="text-sm">{dtf.tokenCount || 0}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPortfolio(dtf.dtfAddress);
                          }}
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Portfolio
                        </Button>
                      </div>

                      {/* Address */}
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {dtf.dtfAddress.slice(0, 8)}...{dtf.dtfAddress.slice(-6)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
