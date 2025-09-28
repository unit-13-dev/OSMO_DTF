import { NextRequest, NextResponse } from 'next/server';
import { makeRateLimitedRequest } from '@/lib/api-rate-limiter';
import { 
  getEthereumAddress, 
  getTokenMapping, 
  getEthereumAddressesForLookup,
  hasCoinGeckoData,
  UNICHAIN_ETHEREUM_MAPPING
} from '@/lib/unichain-mapping';

interface TokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
  isVerified: boolean;
  isTestnet?: boolean;
  coingeckoId?: string;
  marketCap?: number | null;
  price?: number | null;
  priceChange24h?: number | null;
  volume24h?: number | null;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { addresses } = await request.json();
    
    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json(
        { error: 'Addresses array is required' },
        { status: 400 }
      );
    }

    // Limit to 50 addresses to avoid rate limiting
    const limitedAddresses = addresses.slice(0, 50);
    
    // Get Ethereum mainnet addresses for tokens that have CoinGecko data
    const ethereumAddresses = getEthereumAddressesForLookup(limitedAddresses);
    
    // If no mappable addresses, return empty result
    if (ethereumAddresses.length === 0) {
      return NextResponse.json({
        tokens: [],
        success: true,
        count: 0,
        message: 'No tokens found with CoinGecko data'
      });
    }
    
    // Create comma-separated string of Ethereum addresses for batch request
    const addressString = ethereumAddresses.join(',');
    
    // Fetch token metadata from CoinGecko using Ethereum mainnet addresses (with rate limiting)
    const priceData = await makeRateLimitedRequest<Record<string, any>>(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${addressString}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
    );
    
    // Fetch detailed metadata for each Unichain address
    const tokenMetadataPromises = limitedAddresses.map(async (unichainAddress: string) => {
      try {
        // Get token mapping info
        const mapping = getTokenMapping(unichainAddress);
        const ethereumAddress = getEthereumAddress(unichainAddress);
        
        // If no mapping exists or no CoinGecko data available
        if (!mapping || !ethereumAddress || !hasCoinGeckoData(unichainAddress)) {
          return {
            address: unichainAddress, // Return Unichain address
            symbol: mapping?.symbol || 'UNKNOWN',
            name: mapping?.name || 'Unknown Token',
            decimals: 18,
            isVerified: false,
            isTestnet: true,
            price: null,
            marketCap: null,
            volume24h: null,
            priceChange24h: null,
            description: mapping?.name ? `${mapping.name} on Unichain Sepolia` : 'Unknown testnet token'
          } as TokenMetadata;
        }
        
        // Get detailed token info using Ethereum address (with rate limiting)
        const detailData = await makeRateLimitedRequest<any>(
          `https://api.coingecko.com/api/v3/coins/ethereum/contract/${ethereumAddress}`
        );
        const priceInfo = priceData[ethereumAddress.toLowerCase()];
        
        return {
          address: unichainAddress, // Return Unichain address
          symbol: detailData.symbol?.toUpperCase() || mapping.symbol,
          name: detailData.name || mapping.name,
          decimals: 18, // CoinGecko doesn't always provide decimals
          logoUrl: detailData.image?.small,
          isVerified: true,
          isTestnet: true,
          coingeckoId: detailData.id,
          price: priceInfo?.usd || null,
          marketCap: priceInfo?.usd_market_cap || null,
          volume24h: priceInfo?.usd_24h_vol || null,
          priceChange24h: priceInfo?.usd_24h_change || null,
          description: detailData.description?.en?.substring(0, 200) || `${mapping.name} on Unichain Sepolia`
        } as TokenMetadata;
        
      } catch (error) {
        console.error(`Error fetching metadata for ${unichainAddress}:`, error);
        
        // Return fallback data with mapping info
        const mapping = getTokenMapping(unichainAddress);
        const ethereumAddress = getEthereumAddress(unichainAddress);
        const priceInfo = ethereumAddress ? priceData[ethereumAddress.toLowerCase()] : null;
        
        return {
          address: unichainAddress, // Return Unichain address
          symbol: mapping?.symbol || 'UNKNOWN',
          name: mapping?.name || 'Unknown Token',
          decimals: 18,
          isVerified: mapping?.coingeckoId ? true : false,
          isTestnet: true,
          price: priceInfo?.usd || null,
          marketCap: priceInfo?.usd_market_cap || null,
          volume24h: priceInfo?.usd_24h_vol || null,
          priceChange24h: priceInfo?.usd_24h_change || null,
          description: mapping?.name ? `${mapping.name} on Unichain Sepolia` : 'Unknown testnet token'
        } as TokenMetadata;
      }
    });
    
    const tokenMetadata = await Promise.all(tokenMetadataPromises);
    
    // Filter out null results and return valid tokens
    const validTokens = tokenMetadata.filter(token => token !== null);
    
    return NextResponse.json({ 
      tokens: validTokens,
      success: true,
      count: validTokens.length
    });
    
  } catch (error) {
    console.error('Error in batch metadata API:', error);
    return NextResponse.json(
      { error: 'Internal server error', tokens: [] },
      { status: 500 }
    );
  }
}

// GET method for single token (backward compatibility)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Create a new request for POST method
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses: [address] })
    });

    const response = await POST(postRequest);
    
    const data = await response.json();
    return NextResponse.json({ 
      token: data.tokens[0] || null,
      success: data.success
    });
    
  } catch (error) {
    console.error('Error in GET batch metadata API:', error);
    return NextResponse.json(
      { error: 'Internal server error', token: null },
      { status: 500 }
    );
  }
}
