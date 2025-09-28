import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  X, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Shield,
  Calendar,
  RefreshCw,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface PortfolioFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  onSearch: (query: string) => void;
  onSort: (sortBy: string, order: string) => void;
  initialFilters?: Partial<FilterOptions>;
  totalResults?: number;
  loading?: boolean;
}

const SORT_OPTIONS = [
  { value: 'name', label: 'Name', icon: '📝' },
  { value: 'totalValue', label: 'Total Value', icon: '💰' },
  { value: 'securityScore', label: 'Security Score', icon: '🛡️' },
  { value: 'performance24h', label: '24h Performance', icon: '📈' },
  { value: 'createdAt', label: 'Created Date', icon: '📅' },
];

const CATEGORIES = [
  { value: 'defi', label: 'DeFi', color: 'bg-blue-100 text-blue-800' },
  { value: 'stablecoin', label: 'Stablecoin', color: 'bg-green-100 text-green-800' },
  { value: 'bluechip', label: 'Blue Chip', color: 'bg-purple-100 text-purple-800' },
  { value: 'governance', label: 'Governance', color: 'bg-orange-100 text-orange-800' },
  { value: 'utility', label: 'Utility', color: 'bg-gray-100 text-gray-800' },
  { value: 'meme', label: 'Meme', color: 'bg-pink-100 text-pink-800' },
];

export default function PortfolioFilters({
  onFiltersChange,
  onSearch,
  onSort,
  initialFilters,
  totalResults = 0,
  loading = false
}: PortfolioFiltersProps) {
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
    ...initialFilters
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // Update filters when they change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = (query: string) => {
    handleFilterChange('searchQuery', query);
    onSearch(query);
  };

  const handleSort = (sortBy: string, order: string) => {
    handleFilterChange('sortBy', sortBy);
    handleFilterChange('sortOrder', order);
    onSort(sortBy, order);
  };

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
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
    };
    setFilters(defaultFilters);
    toast({
      title: "Filters Cleared",
      description: "All filters have been reset to default values",
    });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    handleFilterChange('categories', newCategories);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.minValue > 0 || filters.maxValue < 1000) count++;
    if (filters.minSecurityScore > 0 || filters.maxSecurityScore < 100) count++;
    if (filters.tokenCount[0] > 2 || filters.tokenCount[1] < 10) count++;
    if (filters.categories.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.showVerifiedOnly) count++;
    if (filters.showActiveOnly) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Portfolio Filters
            </CardTitle>
            <CardDescription>
              Filter and search through DTF portfolios
              {totalResults > 0 && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  ({totalResults} results)
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Less' : 'More'} Filters
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search and Sort */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search DTFs</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by name, symbol, or address..."
                value={filters.searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sort by</Label>
            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-');
                handleSort(sortBy, sortOrder);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <React.Fragment key={option.value}>
                    <SelectItem value={`${option.value}-desc`}>
                      {option.icon} {option.label} (High to Low)
                    </SelectItem>
                    <SelectItem value={`${option.value}-asc`}>
                      {option.icon} {option.label} (Low to High)
                    </SelectItem>
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verified"
              checked={filters.showVerifiedOnly}
              onCheckedChange={(checked) => handleFilterChange('showVerifiedOnly', checked)}
            />
            <Label htmlFor="verified" className="text-sm">
              Verified Only
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="active"
              checked={filters.showActiveOnly}
              onCheckedChange={(checked) => handleFilterChange('showActiveOnly', checked)}
            />
            <Label htmlFor="active" className="text-sm">
              Active Only
            </Label>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t">
            {/* Value Range */}
            <div className="space-y-3">
              <Label>Total Value Range (ETH)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minValue" className="text-sm text-gray-600">Min</Label>
                  <Input
                    id="minValue"
                    type="number"
                    min="0"
                    value={filters.minValue}
                    onChange={(e) => handleFilterChange('minValue', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxValue" className="text-sm text-gray-600">Max</Label>
                  <Input
                    id="maxValue"
                    type="number"
                    min="0"
                    value={filters.maxValue}
                    onChange={(e) => handleFilterChange('maxValue', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="px-3">
                <Slider
                  value={[filters.minValue, filters.maxValue]}
                  onValueChange={(value) => {
                    handleFilterChange('minValue', value[0]);
                    handleFilterChange('maxValue', value[1]);
                  }}
                  min={0}
                  max={1000}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>

            {/* Security Score Range */}
            <div className="space-y-3">
              <Label>Security Score Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minSecurity" className="text-sm text-gray-600">Min</Label>
                  <Input
                    id="minSecurity"
                    type="number"
                    min="0"
                    max="100"
                    value={filters.minSecurityScore}
                    onChange={(e) => handleFilterChange('minSecurityScore', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxSecurity" className="text-sm text-gray-600">Max</Label>
                  <Input
                    id="maxSecurity"
                    type="number"
                    min="0"
                    max="100"
                    value={filters.maxSecurityScore}
                    onChange={(e) => handleFilterChange('maxSecurityScore', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="px-3">
                <Slider
                  value={[filters.minSecurityScore, filters.maxSecurityScore]}
                  onValueChange={(value) => {
                    handleFilterChange('minSecurityScore', value[0]);
                    handleFilterChange('maxSecurityScore', value[1]);
                  }}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            {/* Token Count */}
            <div className="space-y-3">
              <Label>Token Count</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minTokens" className="text-sm text-gray-600">Min</Label>
                  <Input
                    id="minTokens"
                    type="number"
                    min="1"
                    max="10"
                    value={filters.tokenCount[0]}
                    onChange={(e) => handleFilterChange('tokenCount', [Number(e.target.value), filters.tokenCount[1]])}
                  />
                </div>
                <div>
                  <Label htmlFor="maxTokens" className="text-sm text-gray-600">Max</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="10"
                    value={filters.tokenCount[1]}
                    onChange={(e) => handleFilterChange('tokenCount', [filters.tokenCount[0], Number(e.target.value)])}
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <Button
                    key={category.value}
                    variant={filters.categories.includes(category.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCategory(category.value)}
                    className={filters.categories.includes(category.value) ? category.color : ''}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <Label>Created Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-sm text-gray-600">From</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      start: e.target.value ? new Date(e.target.value) : null
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-sm text-gray-600">To</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      end: e.target.value ? new Date(e.target.value) : null
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
