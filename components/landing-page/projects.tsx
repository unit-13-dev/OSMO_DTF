"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, TrendingUp, Users, DollarSign } from "lucide-react"

interface DTFData {
  dtfAddress: string;
  creator: string;
  name: string;
  symbol: string;
  tokens: string[];
  weights: number[];
  createdAt: number;
  active: boolean;
  tokenCount: number;
}

export default function Projects() {
  const [dtfs, setDtfs] = useState<DTFData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch DTF data on component mount
  useEffect(() => {
    async function loadDTFs() {
      try {
        const response = await fetch('/api/dtfs')
        if (!response.ok) {
          throw new Error('Failed to fetch DTF data')
        }
        const data = await response.json()
        setDtfs(data || [])
      } catch (error) {
        console.error("Error loading DTFs:", error)
        // Don't set error state, just show empty state
        setDtfs([])
      } finally {
        setIsLoading(false)
      }
    }

    loadDTFs()
  }, [])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTokenSymbols = (tokens: string[], weights: number[]) => {
    // Create a simple representation of the token allocation
    const topTokens = tokens.slice(0, 3).map((token, index) => ({
      symbol: token === '0x0000000000000000000000000000000000000000' ? 'ETH' : `T${index + 1}`,
      weight: weights[index] || 0
    }))
    
    if (topTokens.length === 0) return 'No tokens'
    if (topTokens.length <= 2) {
      return topTokens.map(t => `${t.symbol} (${t.weight.toFixed(1)}%)`).join(', ')
    }
    return `${topTokens[0].symbol} (${topTokens[0].weight.toFixed(1)}%), ${topTokens[1].symbol} (${topTokens[1].weight.toFixed(1)}%) +${tokens.length - 2} more`
  }

  return (
    <section id="projects" className="my-20">
      <h2 className="text-black dark:text-white mb-6 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
        Featured
        <span className="block text-[#7A7FEE] dark:text-[#7A7FEE]">DTF Portfolios</span>
      </h2>
      <p className="mb-12 max-w-2xl text-gray-700 dark:text-gray-300">
        Discover successful Decentralized Token Funds created by our community. From DeFi blue chips to emerging tokens, 
        see how others are building diversified portfolios on OSMO.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="card overflow-hidden shadow-lg animate-pulse">
                  <div className="p-6">
                    <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="mt-4 h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))
            : dtfs.length === 0
            ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-gray-400 dark:text-gray-600 mb-4">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-black dark:text-white mb-2">No DTFs Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Be the first to create a Decentralized Token Fund on OSMO!
                    </p>
                    <Link href="/create" className="btn-primary">
                      Create Your First DTF
                    </Link>
                  </div>
                </div>
              )
            : dtfs.map((dtf) => (
                <div
                  key={dtf.dtfAddress}
                  className="card overflow-hidden shadow-lg transform transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
                  onClick={() => window.open(`/portfolio?dtf=${dtf.dtfAddress}`, '_blank')}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-black dark:text-white mb-1">{dtf.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{dtf.symbol}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">Active</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Tokens</span>
                        <span className="text-black dark:text-white font-medium">{dtf.tokenCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Created</span>
                        <span className="text-black dark:text-white font-medium">{formatDate(dtf.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Allocation</span>
                        <span className="text-black dark:text-white font-medium text-xs">
                          {getTokenSymbols(dtf.tokens, dtf.weights)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center text-[#7A7FEE] text-sm font-medium group">
                        View DTF{" "}
                        <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {dtf.dtfAddress.slice(0, 6)}...{dtf.dtfAddress.slice(-4)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
      </div>

      <div className="flex justify-center mt-8">
        <Link href="/discover" className="btn-primary">
          Discover All DTFs
        </Link>
      </div>
    </section>
  )
}
