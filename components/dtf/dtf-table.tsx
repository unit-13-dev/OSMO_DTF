"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  RefreshCw,
  ArrowUpDown
} from 'lucide-react';
import { dtfContract, DTFData, DTFError } from '@/lib/dtf-functions';
import { formatWeiToEth } from '@/lib/dtf-functions';

interface DTFTableProps {
  dtfs: DTFData[];
  loading?: boolean;
  onRefresh?: () => void;
  onDTFSelect?: (dtfAddress: string) => void;
}

type SortField = 'name' | 'createdAt' | 'tokens' | 'active';
type SortDirection = 'asc' | 'desc';

export default function DTFTable({ 
  dtfs, 
  loading = false, 
  onRefresh, 
  onDTFSelect 
}: DTFTableProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [portfolioValues, setPortfolioValues] = useState<Record<string, bigint>>({});
  const [loadingValues, setLoadingValues] = useState<Record<string, boolean>>({});

  // Fetch portfolio values for all DTFs
  useEffect(() => {
    const fetchPortfolioValues = async () => {
      for (const dtf of dtfs) {
        if (dtf.active && !portfolioValues[dtf.dtfAddress]) {
          setLoadingValues(prev => ({ ...prev, [dtf.dtfAddress]: true }));
          try {
            const value = await dtfContract.dtf.getCurrentPortfolioValue(dtf.dtfAddress);
            setPortfolioValues(prev => ({ ...prev, [dtf.dtfAddress]: value }));
          } catch (error) {
            console.warn(`Failed to fetch value for DTF ${dtf.dtfAddress}:`, error);
            setPortfolioValues(prev => ({ ...prev, [dtf.dtfAddress]: BigInt(0) }));
          } finally {
            setLoadingValues(prev => ({ ...prev, [dtf.dtfAddress]: false }));
          }
        }
      }
    };

    if (dtfs.length > 0) {
      fetchPortfolioValues();
    }
  }, [dtfs ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedDTFs = [...dtfs].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'createdAt':
        aValue = Number(a.createdAt);
        bValue = Number(b.createdAt);
        break;
      case 'tokens':
        aValue = a.tokens.length;
        bValue = b.tokens.length;
        break;
      case 'active':
        aValue = a.active ? 1 : 0;
        bValue = b.active ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      : <TrendingDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
  };

  if (loading) {
    return <DTFTableSkeleton />;
  }

  if (dtfs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No DTFs Found
          </h3>
          <p className="text-gray-500 dark:text-gray-500 text-center max-w-md">
            There are currently no DTF contracts deployed. Be the first to create one!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-black dark:text-white">
              DTF Contracts
            </CardTitle>
            <CardDescription>
              All deployed Decentralized Token Fund contracts
            </CardDescription>
          </div>
          {onRefresh && (
            <Button 
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Name
                    {getSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleSort('active')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {getSortIcon('active')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleSort('tokens')}
                >
                  <div className="flex items-center gap-2">
                    Tokens
                    {getSortIcon('tokens')}
                  </div>
                </TableHead>
                <TableHead>Portfolio Value</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    Created
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead>Creator</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDTFs.map((dtf) => (
                <TableRow key={dtf.dtfAddress} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell>
                    <div>
                      <div className="font-medium text-black dark:text-white">
                        {dtf.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {dtf.symbol}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={dtf.active ? "default" : "secondary"}>
                      {dtf.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-black dark:text-white">
                        {dtf.tokens.length}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {loadingValues[dtf.dtfAddress] ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      <span className="font-medium text-black dark:text-white">
                        {formatWeiToEth(portfolioValues[dtf.dtfAddress] || BigInt(0), 4)} ETH
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-black dark:text-white">
                        {formatDate(dtf.createdAt)}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {formatAddress(dtf.creator)}
                    </span>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDTFSelect?.(dtf.dtfAddress)}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton Component
function DTFTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(7)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(7)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
