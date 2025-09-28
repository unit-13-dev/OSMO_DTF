import { NextRequest, NextResponse } from 'next/server';
import { makeRateLimitedRequest } from '@/lib/api-rate-limiter';

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

    // Try to get token metadata from CoinGecko (with rate limiting)
    const data = await makeRateLimitedRequest<any>(
      `https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`
    );
    
    const token = {
      address: address,
      symbol: data.symbol?.toUpperCase() || 'UNKNOWN',
      name: data.name || 'Unknown Token',
      decimals: 18, // CoinGecko doesn't always provide decimals
      logoUrl: data.image?.small,
      isVerified: true,
      isTestnet: false,
      coingeckoId: data.id
    };

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return NextResponse.json(
      { token: null },
      { status: 200 }
    );
  }
}
