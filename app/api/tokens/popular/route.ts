import { NextRequest, NextResponse } from 'next/server';
import { makeRateLimitedRequest } from '@/lib/api-rate-limiter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '8';
    
    const data = await makeRateLimitedRequest<any[]>(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&locale=en`
    );
    
    // Filter for EVM-compatible tokens with actual contract addresses
    const validTokens = data
      .filter((coin: any) => {
        // Only include tokens that have Ethereum contract addresses
        return coin.platforms?.ethereum && coin.platforms.ethereum.match(/^0x[a-fA-F0-9]{40}$/);
      })
      .map((coin: any) => ({
        address: coin.platforms.ethereum,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        decimals: 18,
        logoUrl: coin.image,
        isVerified: true,
        isTestnet: false,
        coingeckoId: coin.id,
        marketCap: coin.market_cap,
        price: coin.current_price
      }))
      .slice(0, parseInt(limit));

    return NextResponse.json(validTokens);
  } catch (error) {
    console.error('Error fetching popular tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch popular tokens' },
      { status: 500 }
    );
  }
}
