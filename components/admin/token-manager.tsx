"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
    Plus,
    Trash2,
    Edit,
    CheckCircle,
    AlertCircle,
    Search,
    Filter,
    Save,
    X
} from 'lucide-react';
import {
    MANUAL_TOKENS,
    addManualToken,
    removeManualToken,
    updateManualToken,
    getAllManualTokens,
    TOKEN_CATEGORIES,
    type CategorizedTokenInfo
} from '@/lib/manual-tokens';

interface TokenFormData {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoUrl: string;
    isVerified: boolean;
    isTestnet: boolean;
    description: string;
}

export default function TokenManager() {
    const [tokens, setTokens] = useState<CategorizedTokenInfo[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isAddingToken, setIsAddingToken] = useState(false);
    const [editingToken, setEditingToken] = useState<string | null>(null);
    const [formData, setFormData] = useState<TokenFormData>({
        address: '',
        symbol: '',
        name: '',
        decimals: 18,
        logoUrl: '',
        isVerified: false,
        isTestnet: true,
        description: ''
    });

    useEffect(() => {
        loadTokens();
    }, []);

    const loadTokens = () => {
        const allTokens = getAllManualTokens();
        setTokens(allTokens);
    };

    const filteredTokens = tokens.filter(token => {
        const matchesSearch = token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            token.address.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === 'all' || token.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const handleAddToken = () => {
        setIsAddingToken(true);
        setFormData({
            address: '',
            symbol: '',
            name: '',
            decimals: 18,
            logoUrl: '',
            isVerified: false,
            isTestnet: true,
            description: ''
        });
    };

    const handleEditToken = (token: CategorizedTokenInfo) => {
        setEditingToken(token.address);
        setFormData({
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            decimals: token.decimals,
            logoUrl: token.logoUrl || '',
            isVerified: token.isVerified,
            isTestnet: token.isTestnet,
            description: token.description || ''
        });
    };

    const handleSaveToken = () => {
        try {
            // Validate form data
            if (!formData.address || !formData.symbol || !formData.name) {
                toast.error('Please fill in all required fields');
                return;
            }

            if (!/^0x[a-fA-F0-9]{40}$/.test(formData.address)) {
                toast.error('Invalid token address format');
                return;
            }

            if (editingToken) {
                // Update existing token
                const success = updateManualToken(editingToken, {
                    ...formData,
                    addedBy: 'admin',
                    addedAt: new Date().toISOString()
                });

                if (success) {
                    toast.success('Token updated successfully');
                    loadTokens();
                    setEditingToken(null);
                } else {
                    toast.error('Failed to update token');
                }
            } else {
                // Add new token
                addManualToken(formData);
                toast.success('Token added successfully');
                loadTokens();
                setIsAddingToken(false);
            }
        } catch (error) {
            console.error('Error saving token:', error);
            toast.error('Failed to save token');
        }
    };

    const handleDeleteToken = (address: string) => {
        if (window.confirm('Are you sure you want to delete this token?')) {
            const success = removeManualToken(address);
            if (success) {
                toast.success('Token deleted successfully');
                loadTokens();
            } else {
                toast.error('Failed to delete token');
            }
        }
    };

    const handleCancel = () => {
        setIsAddingToken(false);
        setEditingToken(null);
        setFormData({
            address: '',
            symbol: '',
            name: '',
            decimals: 18,
            logoUrl: '',
            isVerified: false,
            isTestnet: true,
            description: ''
        });
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case TOKEN_CATEGORIES.NATIVE:
                return 'bg-blue-100 text-blue-800';
            case TOKEN_CATEGORIES.STABLECOIN:
                return 'bg-green-100 text-green-800';
            case TOKEN_CATEGORIES.DEFI:
                return 'bg-purple-100 text-purple-800';
            case TOKEN_CATEGORIES.GOVERNANCE:
                return 'bg-orange-100 text-orange-800';
            case TOKEN_CATEGORIES.UTILITY:
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Token Manager
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Manage your Unichain Sepolia token list
                    </p>
                </div>
                <Button onClick={handleAddToken} className="bg-[#7A7FEE] hover:bg-[#7A7FEE]/80">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Token
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Label htmlFor="search">Search Tokens</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by symbol, name, or address..."
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-48">
                            <Label htmlFor="category">Category</Label>
                            <select
                                id="category"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
                            >
                                <option value="all">All Categories</option>
                                <option value={TOKEN_CATEGORIES.NATIVE}>Native</option>
                                <option value={TOKEN_CATEGORIES.STABLECOIN}>Stablecoin</option>
                                <option value={TOKEN_CATEGORIES.DEFI}>DeFi</option>
                                <option value={TOKEN_CATEGORIES.GOVERNANCE}>Governance</option>
                                <option value={TOKEN_CATEGORIES.UTILITY}>Utility</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Token Form */}
            {(isAddingToken || editingToken) && (
                <Card className="border-[#7A7FEE]/20">
                    <CardHeader>
                        <CardTitle className="text-[#7A7FEE]">
                            {editingToken ? 'Edit Token' : 'Add New Token'}
                        </CardTitle>
                        <CardDescription>
                            {editingToken ? 'Update token information' : 'Add a new token to your list'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="address">Token Address *</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="0x..."
                                    disabled={!!editingToken}
                                />
                            </div>
                            <div>
                                <Label htmlFor="symbol">Symbol *</Label>
                                <Input
                                    id="symbol"
                                    value={formData.symbol}
                                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                                    placeholder="ETH"
                                />
                            </div>
                            <div>
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ethereum"
                                />
                            </div>
                            <div>
                                <Label htmlFor="decimals">Decimals</Label>
                                <Input
                                    id="decimals"
                                    type="number"
                                    value={formData.decimals}
                                    onChange={(e) => setFormData({ ...formData, decimals: parseInt(e.target.value) || 18 })}
                                    min="0"
                                    max="18"
                                />
                            </div>
                            <div>
                                <Label htmlFor="logoUrl">Logo URL</Label>
                                <Input
                                    id="logoUrl"
                                    value={formData.logoUrl}
                                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Token description..."
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isVerified}
                                    onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm">Verified</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isTestnet}
                                    onChange={(e) => setFormData({ ...formData, isTestnet: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm">Testnet</span>
                            </label>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={handleCancel}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button onClick={handleSaveToken} className="bg-[#7A7FEE] hover:bg-[#7A7FEE]/80">
                                <Save className="mr-2 h-4 w-4" />
                                {editingToken ? 'Update' : 'Add'} Token
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tokens Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Token List ({filteredTokens.length})</CardTitle>
                    <CardDescription>
                        Manage your Unichain Sepolia token addresses
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredTokens.length === 0 ? (
                        <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                No tokens found
                            </h3>
                            <p className="text-gray-500">
                                {searchQuery || selectedCategory !== 'all'
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'Add your first token to get started'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Token</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Decimals</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTokens.map((token) => (
                                        <TableRow key={token.address}>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    {token.logoUrl && (
                                                        <img
                                                            src={token.logoUrl}
                                                            alt={token.symbol}
                                                            className="w-8 h-8 rounded-full"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-[#7A7FEE]">
                                                            {token.symbol}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {token.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                    {token.address.slice(0, 6)}...{token.address.slice(-4)}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getCategoryColor(token.category)}>
                                                    {token.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{token.decimals}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    {token.isVerified && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Verified
                                                        </Badge>
                                                    )}
                                                    {token.isTestnet && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Testnet
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditToken(token)}
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteToken(token.address)}
                                                        className="text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
