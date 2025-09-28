import { NextRequest, NextResponse } from 'next/server';
import { makeRateLimitedRequest } from '@/lib/api-rate-limiter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = searchParams.get('limit') || '20';
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // First, search for coins (with rate limiting)
    const searchData = await makeRateLimitedRequest<any>(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
    );
    
    // Get detailed info for each coin to get contract addresses
    const tokensWithAddresses = await Promise.all(
      searchData.coins.slice(0, parseInt(limit)).map(async (coin: any) => {
        try {
          // Get detailed coin info to get contract address
          const detailResponse = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coin.id}`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'OSMO-DTF-Platform/1.0'
              }
            }
          );
          
          if (!detailResponse.ok) {
            return null;
          }
          
          const detailData = await detailResponse.json();
          
          // Only return tokens with valid Ethereum contract addresses
          if (detailData.platforms?.ethereum && detailData.platforms.ethereum.match(/^0x[a-fA-F0-9]{40}$/)) {
            return {
              address: detailData.platforms.ethereum,
              symbol: detailData.symbol.toUpperCase(),
              name: detailData.name,
              decimals: 18,
              logoUrl: detailData.image?.small,
              isVerified: true,
              isTestnet: false,
              coingeckoId: detailData.id,
              price: detailData.market_data?.current_price?.usd
            };
          }
          
          return null;
        } catch (error) {
          console.error(`Error fetching details for ${coin.id}:`, error);
          return null;
        }
      })
    );
    
    // Filter out null results and return valid tokens
    const validTokens = tokensWithAddresses.filter(token => token !== null);

    return NextResponse.json(validTokens);
  } catch (error) {
    console.error('Error searching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to search tokens' },
      { status: 500 }
    );
  }
}
