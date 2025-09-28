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

    const data = await makeRateLimitedRequest<Record<string, any>>(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${address}&vs_currencies=usd`
    );
    const price = data[address.toLowerCase()]?.usd || null;

    return NextResponse.json({ price });
  } catch (error) {
    console.error('Error fetching token price:', error);
    return NextResponse.json(
      { price: null },
      { status: 200 }
    );
  }
}
