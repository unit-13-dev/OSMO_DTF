"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Search,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';
import { factoryFunctions } from '@/lib/dtf-functions';
import { tokenManagement, TokenInfo, DTFTemplate } from '@/lib/token-management';
import { DTF_CONSTANTS } from '@/config/contracts';

// Debounce hook for search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Form Data Interface
interface CreateDTFData {
  name: string;
  symbol: string;
  tokens: TokenInfo[];
  weights: number[];
  templateId?: string;
}

// Step Component Props
interface StepProps {
  data: CreateDTFData;
  onUpdate: (updates: Partial<CreateDTFData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isActive: boolean;
  isCompleted: boolean;
  canGoNext: boolean;
}

// Step 1: Basic Information
const BasicInfoStep: React.FC<StepProps> = ({ data, onUpdate, onNext, isActive, isCompleted }) => {
  const [errors, setErrors] = useState<{ name?: string; symbol?: string }>({});

  const validateStep = useCallback(() => {
    const newErrors: { name?: string; symbol?: string } = {};

    if (!data.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (data.name.length > 50) {
      newErrors.name = 'Name must be 50 characters or less';
    }

    if (!data.symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    } else if (data.symbol.length > 10) {
      newErrors.symbol = 'Symbol must be 10 characters or less';
    } else if (!/^[A-Z0-9]+$/.test(data.symbol)) {
      newErrors.symbol = 'Symbol must contain only uppercase letters and numbers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [data.name, data.symbol]);

  useEffect(() => {
    if (isActive) {
      validateStep();
    }
  }, [isActive, validateStep]);

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  if (!isActive) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Choose a name and symbol for your DTF
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">DTF Name</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g., DeFi Blue Chips Fund"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            {data.name.length}/50 characters
          </p>
        </div>

        <div>
          <Label htmlFor="symbol">DTF Symbol</Label>
          <Input
            id="symbol"
            value={data.symbol}
            onChange={(e) => onUpdate({ symbol: e.target.value.toUpperCase() })}
            placeholder="e.g., DEFI"
            className={errors.symbol ? 'border-red-500' : ''}
            maxLength={10}
          />
          {errors.symbol && (
            <p className="text-red-500 text-sm mt-1">{errors.symbol}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            {data.symbol.length}/10 characters
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={Object.keys(errors).length > 0}>
          Next Step
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Step 2: Template Selection
const TemplateStep: React.FC<StepProps> = ({ data, onUpdate, onNext, onPrev, isActive }) => {
  const [templates, setTemplates] = useState<DTFTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateList = await tokenManagement.getTemplates();
        setTemplates(templateList);
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('Failed to load templates. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isActive) {
      loadTemplates();
    }
  }, [isActive]);

  const handleTemplateSelect = (template: DTFTemplate) => {
    onUpdate({
      templateId: template.id,
      tokens: template.tokens,
      weights: template.weights
    });
  };

  const handleCustom = () => {
    onUpdate({
      templateId: 'custom',
      tokens: [],
      weights: []
    });
  };

  if (!isActive) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Template</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Select a predefined template or create a custom portfolio
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                data.templateId === template.id
                  ? 'ring-2 ring-[#7A7FEE] bg-[#7A7FEE]/10'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {template.tokens.length > 0 ? (
                      <>
                        {template.tokens.slice(0, 3).map((token, index) => (
                          <Badge key={index} variant="secondary">
                            {token.symbol}
                          </Badge>
                        ))}
                        {template.tokens.length > 3 && (
                          <Badge variant="outline">+{template.tokens.length - 3}</Badge>
                        )}
                      </>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        No tokens available
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {template.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              data.templateId === 'custom'
                ? 'ring-2 ring-[#7A7FEE] bg-[#7A7FEE]/10'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={handleCustom}
          >
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Custom Portfolio
              </CardTitle>
              <CardDescription>
                Create your own token allocation from scratch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">
                  Choose your own tokens and weights
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!data.templateId}
        >
          Next Step
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Step 3: Token Selection and Weights
const TokenSelectionStep: React.FC<StepProps> = ({ data, onUpdate, onNext, onPrev, isActive }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TokenInfo[]>([]);
  const [popularTokens, setPopularTokens] = useState<TokenInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const validateStep = useCallback(() => {
    const tokenValidation = tokenManagement.validateTokenList(data.tokens.map(t => t.address));
    const weightValidation = tokenManagement.validateWeights(data.weights);
    
    const allErrors = [...tokenValidation.errors, ...weightValidation.errors];
    setErrors(allErrors);
    
    return allErrors.length === 0;
  }, [data.tokens, data.weights]);

  useEffect(() => {
    if (isActive) {
      validateStep();
      loadPopularTokens();
    }
  }, [isActive, validateStep]);

  const loadPopularTokens = async () => {
    setIsLoadingPopular(true);
    try {
      const popular = await tokenManagement.getPopularTokens(8); // 8 popular tokens
      setPopularTokens(popular);
    } catch (error) {
      console.error('Error loading popular tokens:', error);
      toast.error('Failed to load popular tokens. Please check your connection.');
    } finally {
      setIsLoadingPopular(false);
    }
  };

  // Handle debounced search
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await tokenManagement.searchTokens(debouncedSearchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Failed to search tokens. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  const addToken = (token: TokenInfo) => {
    if (data.tokens.length >= DTF_CONSTANTS.MAX_TOKENS) {
      toast.error(`Maximum ${DTF_CONSTANTS.MAX_TOKENS} tokens allowed`);
      return;
    }

    if (data.tokens.some(t => t.address.toLowerCase() === token.address.toLowerCase())) {
      toast.error('Token already added');
      return;
    }

    const newTokens = [...data.tokens, token];
    const newWeights = [...data.weights, 0];
    
    // Auto-balance weights
    const balancedWeights = tokenManagement.autoBalanceWeights(newWeights);
    
    onUpdate({
      tokens: newTokens,
      weights: balancedWeights
    });
    
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeToken = (index: number) => {
    const newTokens = data.tokens.filter((_, i) => i !== index);
    const newWeights = data.weights.filter((_, i) => i !== index);
    
    if (newTokens.length > 0) {
      const balancedWeights = tokenManagement.autoBalanceWeights(newWeights);
      onUpdate({
        tokens: newTokens,
        weights: balancedWeights
      });
    } else {
      onUpdate({
        tokens: newTokens,
        weights: newWeights
      });
    }
  };

  const updateWeight = (index: number, percentage: number) => {
    const newWeights = [...data.weights];
    newWeights[index] = tokenManagement.percentageToWeight(percentage);
    
    // Auto-balance remaining weights
    const balancedWeights = tokenManagement.autoBalanceWeights(newWeights);
    onUpdate({ weights: balancedWeights });
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  if (!isActive) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Token Selection</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Add tokens and set their allocation weights
        </p>
      </div>

      {/* Search Section */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="search">Search Tokens</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by symbol or name..."
              className="pl-10"
            />
          </div>
        </div>

         {/* Popular Tokens */}
         {!searchQuery && (
           <Card className="border-[#7A7FEE]/20 bg-gradient-to-br from-[#7A7FEE]/5 to-purple-500/5">
             <CardHeader>
               <CardTitle className="text-sm flex items-center justify-between text-[#7A7FEE]">
                 <div className="flex items-center space-x-2">
                   <TrendingUp className="h-4 w-4" />
                   Popular EVM Tokens
                 </div>
                 {isLoadingPopular && <Loader2 className="h-4 w-4 animate-spin" />}
               </CardTitle>
             </CardHeader>
             <CardContent>
               {isLoadingPopular ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                     <Skeleton key={i} className="h-16 rounded-lg" />
                   ))}
                 </div>
               ) : popularTokens.length > 0 ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {popularTokens.slice(0, 8).map((token) => (
                     <div
                       key={token.address}
                       className="flex flex-col items-center p-3 border border-[#7A7FEE]/20 rounded-lg hover:bg-[#7A7FEE]/10 cursor-pointer transition-all duration-200 hover:scale-105"
                       onClick={() => addToken(token)}
                     >
                       <div className="flex items-center space-x-2 mb-2">
                         {token.logoUrl && (
                           <img src={token.logoUrl} alt={token.symbol} className="w-8 h-8 rounded-full" />
                         )}
                         <div className="text-center">
                           <div className="font-semibold text-sm text-[#7A7FEE]">{token.symbol}</div>
                           <div className="text-xs text-gray-500 truncate max-w-20">{token.name}</div>
                         </div>
                       </div>
                       <div className="text-xs font-medium text-gray-500">
                         Unichain Sepolia
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8 text-gray-500">
                   <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                   <p>No popular tokens available</p>
                   <p className="text-xs mt-1">Try searching for specific tokens</p>
                 </div>
               )}
             </CardContent>
           </Card>
         )}

         {/* Search Results */}
         {searchQuery && (
           <Card className="border-[#7A7FEE]/20">
             <CardHeader>
               <CardTitle className="text-sm flex items-center space-x-2 text-[#7A7FEE]">
                 <Search className="h-4 w-4" />
                 Search Results
                 {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
               </CardTitle>
             </CardHeader>
             <CardContent>
               {isSearching ? (
                 <div className="space-y-2">
                   {[1, 2, 3].map((i) => (
                     <Skeleton key={i} className="h-16 rounded-lg" />
                   ))}
                 </div>
               ) : searchResults.length > 0 ? (
                 <div className="space-y-2">
                   {searchResults.map((token) => (
                     <div
                       key={token.address}
                       className="flex items-center justify-between p-3 border border-[#7A7FEE]/20 rounded-lg hover:bg-[#7A7FEE]/5 transition-all duration-200"
                     >
                       <div className="flex items-center space-x-3">
                         {token.logoUrl && (
                           <img src={token.logoUrl} alt={token.symbol} className="w-10 h-10 rounded-full" />
                         )}
                         <div>
                           <div className="font-semibold text-[#7A7FEE]">{token.symbol}</div>
                           <div className="text-sm text-gray-500">{token.name}</div>
                           <div className="text-xs font-medium text-gray-500">
                             Unichain Sepolia
                           </div>
                         </div>
                       </div>
                       <Button
                         size="sm"
                         onClick={() => addToken(token)}
                         disabled={data.tokens.some(t => t.address.toLowerCase() === token.address.toLowerCase())}
                         className="bg-[#7A7FEE] hover:bg-[#7A7FEE]/80"
                       >
                         Add
                       </Button>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8 text-gray-500">
                   <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                   <p>No tokens found for "{searchQuery}"</p>
                   <p className="text-xs mt-1">Try searching for popular tokens like ETH, USDC, or LINK</p>
                 </div>
               )}
             </CardContent>
           </Card>
         )}
      </div>

      {/* Selected Tokens */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#7A7FEE] flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            Selected Tokens
          </h3>
          <Badge variant="outline" className="border-[#7A7FEE]/20 text-[#7A7FEE]">
            {data.tokens.length}/{DTF_CONSTANTS.MAX_TOKENS}
          </Badge>
        </div>

        {data.tokens.length === 0 ? (
          <Alert className="border-[#7A7FEE]/20 bg-[#7A7FEE]/5">
            <AlertCircle className="h-4 w-4 text-[#7A7FEE]" />
            <AlertDescription className="text-[#7A7FEE]">
              Add at least {DTF_CONSTANTS.MIN_TOKENS} tokens to create your DTF
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {data.tokens.map((token, index) => (
              <Card key={token.address} className="border-[#7A7FEE]/20 bg-gradient-to-r from-[#7A7FEE]/5 to-purple-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {token.logoUrl && (
                        <img src={token.logoUrl} alt={token.symbol} className="w-10 h-10 rounded-full" />
                      )}
                      <div>
                        <div className="font-semibold text-[#7A7FEE]">{token.symbol}</div>
                        <div className="text-sm text-gray-500">{token.name}</div>
                        <div className="text-xs font-medium text-gray-500">
                          Unichain Sepolia
                        </div>
                      </div>
                      {token.isVerified && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-32">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={tokenManagement.weightToPercentage(data.weights[index] || 0)}
                          onChange={(e) => updateWeight(index, parseFloat(e.target.value) || 0)}
                          className="text-right border-[#7A7FEE]/20 focus:border-[#7A7FEE]"
                        />
                        <div className="text-xs text-gray-500 text-right">%</div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeToken(index)}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev} className="border-[#7A7FEE]/20 text-[#7A7FEE] hover:bg-[#7A7FEE]/10">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={errors.length > 0 || data.tokens.length < DTF_CONSTANTS.MIN_TOKENS}
          className="bg-[#7A7FEE] hover:bg-[#7A7FEE]/80"
        >
          Next Step
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Step 4: Review and Confirm
const ReviewStep: React.FC<StepProps> = ({ data, onNext, onPrev, isActive }) => {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    console.log('Create DTF button clicked');
    console.log('Form data:', data);
    
    setIsCreating(true);
    
    try {
      // Pre-transaction validation
      const tokenAddresses = data.tokens.map(t => t.address);
      console.log('Token addresses to validate:', tokenAddresses);
      
      // Validate all tokens exist on Unichain Sepolia
      toast.loading('Validating tokens on Unichain Sepolia...', { id: 'token-validation' });
      
      const tokenValidationResults = await Promise.all(
        tokenAddresses.map(async (address) => {
          console.log(`Validating token: ${address}`);
          const isValid = await tokenManagement.validateTokenOnNetwork(address);
          console.log(`Token ${address} validation result:`, isValid);
          return { address, isValid };
        })
      );
      
      console.log('Token validation results:', tokenValidationResults);
      
      const invalidTokens = tokenValidationResults.filter(result => !result.isValid);
      if (invalidTokens.length > 0) {
        toast.dismiss('token-validation');
        console.error('Invalid tokens found:', invalidTokens);
        toast.error(`Invalid tokens found: ${invalidTokens.map(t => t.address.slice(0, 6) + '...').join(', ')}`);
        return;
      }
      
      toast.dismiss('token-validation');
      toast.loading('Creating DTF contract...', { id: 'creating-dtf' });
      
      console.log('Calling factoryFunctions.createDTF with:', {
        name: data.name,
        symbol: data.symbol,
        tokenAddresses,
        weights: data.weights
      });
      
      const dtfAddress = await factoryFunctions.createDTF(
        data.name,
        data.symbol,
        tokenAddresses,
        data.weights
      );

      console.log('DTF created successfully with address:', dtfAddress);
      toast.dismiss('creating-dtf');
      toast.success('DTF created successfully!');
      
      // Redirect to portfolio view
      router.push(`/portfolio?dtf=${dtfAddress}`);
    } catch (error: any) {
      toast.dismiss('token-validation');
      toast.dismiss('creating-dtf');
      
      console.error('Error creating DTF:', error);
      
      // Show specific error messages
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create DTF. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  if (!isActive) return null;

  // Debug: Log form data when component renders
  console.log('ReviewStep rendered with data:', data);
  console.log('Tokens count:', data.tokens.length);
  console.log('Weights count:', data.weights.length);
  console.log('Weights sum:', data.weights.reduce((sum, w) => sum + w, 0));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review & Create</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Review your DTF configuration before creating
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-lg">{data.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Symbol</Label>
              <p className="text-lg font-mono">{data.symbol}</p>
            </div>
          </CardContent>
        </Card>

        {/* Token Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Token Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.tokens.map((token, index) => (
                <div key={token.address} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{token.symbol}</span>
                    <Badge variant="outline" className="text-xs">
                      {token.name}
                    </Badge>
                  </div>
                  <span className="font-mono">
                    {tokenManagement.weightToPercentage(data.weights[index]).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{data.tokens.length}</div>
              <div className="text-sm text-gray-500">Tokens</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {data.weights.reduce((sum, w) => sum + w, 0) === DTF_CONSTANTS.BASIC_POINTS ? '100%' : 'Invalid'}
              </div>
              <div className="text-sm text-gray-500">Allocation</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {data.tokens.filter(t => t.isVerified).length}
              </div>
              <div className="text-sm text-gray-500">Verified</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {data.templateId === 'custom' ? 'Custom' : 'Template'}
              </div>
              <div className="text-sm text-gray-500">Type</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Panel - Remove this after fixing */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>Name:</strong> {data.name || 'Not set'}</div>
            <div><strong>Symbol:</strong> {data.symbol || 'Not set'}</div>
            <div><strong>Tokens:</strong> {data.tokens.length}</div>
            <div><strong>Weights:</strong> {data.weights.length}</div>
            <div><strong>Weight Sum:</strong> {data.weights.reduce((sum, w) => sum + w, 0)} / {DTF_CONSTANTS.BASIC_POINTS}</div>
            <div><strong>Template ID:</strong> {data.templateId || 'Not set'}</div>
            <div><strong>Button Disabled:</strong> {isCreating || data.tokens.length === 0 || data.weights.length === 0 ? 'Yes' : 'No'}</div>
            <div><strong>Token Addresses:</strong> {data.tokens.map(t => t.address.slice(0, 6) + '...').join(', ')}</div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={isCreating}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button 
          onClick={() => {
            console.log('Create DTF button clicked - starting handleCreate');
            alert('Button clicked! Check console for details.');
            handleCreate();
          }} 
          disabled={isCreating || data.tokens.length === 0 || data.weights.length === 0}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating DTF...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Create DTF
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Main Create DTF Form Component
const CreateDTFForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateDTFData>({
    name: '',
    symbol: '',
    tokens: [],
    weights: []
  });

  const steps = [
    { id: 'basic', title: 'Basic Info', component: BasicInfoStep },
    { id: 'template', title: 'Template', component: TemplateStep },
    { id: 'tokens', title: 'Tokens', component: TokenSelectionStep },
    { id: 'review', title: 'Review', component: ReviewStep }
  ];

  const updateFormData = (updates: Partial<CreateDTFData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() && formData.symbol.trim();
      case 1:
        return !!formData.templateId;
      case 2:
        return formData.tokens.length >= DTF_CONSTANTS.MIN_TOKENS;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const isStepCompleted = (stepIndex: number) => {
    return stepIndex < currentStep;
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  index === currentStep
                    ? 'border-[#7A7FEE] bg-[#7A7FEE] text-white shadow-lg'
                    : isStepCompleted(index)
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}
              >
                {isStepCompleted(index) ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <span
                className={`ml-3 text-sm font-medium transition-colors duration-300 ${
                  index === currentStep
                    ? 'text-[#7A7FEE]'
                    : isStepCompleted(index)
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`w-20 h-0.5 mx-4 transition-colors duration-300 ${
                    isStepCompleted(index) ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-[#7A7FEE]/20 bg-gradient-to-br from-white to-[#7A7FEE]/5 dark:from-gray-900 dark:to-[#7A7FEE]/10">
        <CardContent className="p-8">
          {steps.map((step, index) => {
            const StepComponent = step.component;
            return (
              <StepComponent
                key={step.id}
                data={formData}
                onUpdate={updateFormData}
                onNext={nextStep}
                onPrev={prevStep}
                isActive={index === currentStep}
                isCompleted={!!isStepCompleted(index)}
                canGoNext={!!canGoNext()}
              />
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateDTFForm;
