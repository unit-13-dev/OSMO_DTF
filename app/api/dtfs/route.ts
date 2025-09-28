import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { unichainSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import DTFFACTORY_ABI from '@/DTF/abi/DTFFactory';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');
    
    console.log('Fetching DTFs from contract:', CONTRACT_ADDRESSES.DTF_FACTORY);
    
    // Create a public client for Unichain Sepolia
    const publicClient = createPublicClient({
      chain: unichainSepolia,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL)
    });
    
    // Fetch all DTFs from the factory contract
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.DTF_FACTORY as `0x${string}`,
      abi: DTFFACTORY_ABI,
      functionName: 'getAllDTFs',
    });
    
    console.log('Raw contract result:', result);
    
    const allDTFs = result as any[];
    console.log('Total DTFs found:', allDTFs.length);
    
    // Filter for active DTFs and limit the results
    const activeDTFs = allDTFs
      .filter(dtf => dtf.active)
      .slice(0, limit);
    
    console.log('Active DTFs:', activeDTFs.length);
    
    // Add some additional metadata for display
    const dtfsWithMetadata = activeDTFs.map(dtf => ({
      dtfAddress: dtf.dtfAddress,
      creator: dtf.creator,
      name: dtf.name,
      symbol: dtf.symbol,
      tokens: dtf.tokens,
      weights: dtf.weights.map((weight: bigint) => Number(weight) / 100), // Convert from basis points to percentage
      createdAt: Number(dtf.createdAt),
      active: dtf.active,
      tokenCount: dtf.tokens.length,
    }));
    
    console.log('Returning DTFs:', dtfsWithMetadata.length);
    return NextResponse.json(dtfsWithMetadata);
  } catch (error) {
    console.error('Error fetching DTFs:', error);
    
    // For development/testing, return some mock data if contract fails
    if (process.env.NODE_ENV === 'development') {
      console.log('Returning mock data for development');
      return NextResponse.json([
        {
          dtfAddress: '0x1234567890123456789012345678901234567890',
          creator: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          name: 'DeFi Blue Chips',
          symbol: 'DEFI',
          tokens: ['0x0000000000000000000000000000000000000000', '0x1111111111111111111111111111111111111111'],
          weights: [60, 40],
          createdAt: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
          active: true,
          tokenCount: 2,
        },
        {
          dtfAddress: '0x2345678901234567890123456789012345678901',
          creator: '0xbcdefabcdefabcdefabcdefabcdefabcdefabcde',
          name: 'Stablecoin Portfolio',
          symbol: 'STABLE',
          tokens: ['0x2222222222222222222222222222222222222222', '0x3333333333333333333333333333333333333333', '0x4444444444444444444444444444444444444444'],
          weights: [50, 30, 20],
          createdAt: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
          active: true,
          tokenCount: 3,
        }
      ]);
    }
    
    // Return empty array instead of error to show the "no DTFs yet" state
    return NextResponse.json([]);
  }
}
