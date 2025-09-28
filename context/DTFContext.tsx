'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAccount } from 'wagmi'
import { dtfContract, DTFData, DTFError } from '@/lib/dtf-functions'

// Enhanced DTF data with additional metadata
export interface EnhancedDTFData extends DTFData {
  portfolioValue?: bigint
  securityScore?: number
  performance24h?: number
  tokenCount?: number
  isVerified?: boolean
  lastUpdated?: number
}

// Context state interface
interface DTFContextState {
  // Data
  dtfs: EnhancedDTFData[]
  loading: boolean
  error: string | null
  lastFetch: number | null
  
  // Actions
  refreshDTFs: () => Promise<void>
  getDTFByAddress: (address: string) => EnhancedDTFData | undefined
  isDTFLoading: (address: string) => boolean
  
  // Real-time subscriptions
  subscribeToDTF: (address: string, callback: (data: EnhancedDTFData) => void) => () => void
  unsubscribeFromDTF: (address: string) => void
}

// Create context
const DTFContext = createContext<DTFContextState | undefined>(undefined)

// Provider component
interface DTFProviderProps {
  children: ReactNode
}

export function DTFProvider({ children }: DTFProviderProps) {
  const { address, isConnected } = useAccount()
  
  // State
  const [dtfs, setDtfs] = useState<EnhancedDTFData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number | null>(null)
  const [loadingDTFs, setLoadingDTFs] = useState<Set<string>>(new Set())
  const [subscriptions, setSubscriptions] = useState<Map<string, () => void>>(new Map())

  // Cache configuration
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  const REFRESH_INTERVAL = 30 * 1000 // 30 seconds

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!lastFetch) return false
    return Date.now() - lastFetch < CACHE_DURATION
  }, [lastFetch])

  // Fetch all DTFs with enhanced data
  const fetchDTFs = useCallback(async (forceRefresh = false) => {
    // Skip if already loading or cache is valid (unless force refresh)
    if (loading || (!forceRefresh && isCacheValid())) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching DTFs from contract...')
      const allDTFs = await dtfContract.factory.getAllDTFs()
      
      // Fetch additional data for each DTF in parallel
      const enrichedDTFs = await Promise.all(
        allDTFs.map(async (dtf) => {
          try {
            // Mark as loading
            setLoadingDTFs(prev => new Set(prev).add(dtf.dtfAddress))
            
            // Fetch portfolio value
            const portfolioValue = await dtfContract.dtf.getCurrentPortfolioValue(dtf.dtfAddress)
            
            // Calculate additional metrics
            const tokenCount = dtf.weights.length
            
            // Mock security score calculation (replace with actual logic)
            const securityScore = Math.min(60 + Math.floor(Math.random() * 40), 100)
            
            // Mock performance calculation (replace with actual logic)
            const performance24h = (Math.random() - 0.5) * 20
            
            const enhancedDTF: EnhancedDTFData = {
              ...dtf,
              portfolioValue,
              securityScore,
              performance24h,
              tokenCount,
              isVerified: true, // This would come from actual verification logic
              lastUpdated: Date.now()
            }
            
            return enhancedDTF
          } catch (err) {
            console.warn(`Failed to fetch additional data for DTF ${dtf.dtfAddress}:`, err)
            
            // Return basic DTF data with default values
            return {
              ...dtf,
              portfolioValue: BigInt(0),
              securityScore: 0,
              performance24h: 0,
              tokenCount: dtf.weights.length,
              isVerified: false,
              lastUpdated: Date.now()
            } as EnhancedDTFData
          } finally {
            // Remove from loading set
            setLoadingDTFs(prev => {
              const newSet = new Set(prev)
              newSet.delete(dtf.dtfAddress)
              return newSet
            })
          }
        })
      )
      
      setDtfs(enrichedDTFs)
      setLastFetch(Date.now())
      
      console.log(`Successfully loaded ${enrichedDTFs.length} DTFs`)
    } catch (err) {
      console.error('Error fetching DTFs:', err)
      
      let errorMessage = 'Failed to load DTF data'
      if (err instanceof DTFError) {
        errorMessage = err.message
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as any).message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [loading, isCacheValid])

  // Refresh DTFs (public method)
  const refreshDTFs = useCallback(async () => {
    await fetchDTFs(true)
  }, [fetchDTFs])

  // Get DTF by address
  const getDTFByAddress = useCallback((address: string) => {
    return dtfs.find(dtf => dtf.dtfAddress.toLowerCase() === address.toLowerCase())
  }, [dtfs])

  // Check if specific DTF is loading
  const isDTFLoading = useCallback((address: string) => {
    return loadingDTFs.has(address)
  }, [loadingDTFs])

  // Subscribe to DTF updates
  const subscribeToDTF = useCallback((address: string, callback: (data: EnhancedDTFData) => void) => {
    const dtf = getDTFByAddress(address)
    if (!dtf) {
      console.warn(`DTF ${address} not found for subscription`)
      return () => {}
    }

    // Create subscription for portfolio value updates
    const unsubscribe = dtfContract.realTime.subscribeToPortfolioValue(
      address,
      (portfolioValue) => {
        setDtfs(prev => prev.map(dtf => 
          dtf.dtfAddress.toLowerCase() === address.toLowerCase()
            ? { ...dtf, portfolioValue, lastUpdated: Date.now() }
            : dtf
        ))
        
        // Call the callback with updated data
        const updatedDTF = getDTFByAddress(address)
        if (updatedDTF) {
          callback(updatedDTF)
        }
      },
      REFRESH_INTERVAL
    )

    // Store subscription
    setSubscriptions(prev => new Map(prev).set(address, unsubscribe))
    
    return unsubscribe
  }, [getDTFByAddress])

  // Unsubscribe from DTF updates
  const unsubscribeFromDTF = useCallback((address: string) => {
    const unsubscribe = subscriptions.get(address)
    if (unsubscribe) {
      unsubscribe()
      setSubscriptions(prev => {
        const newMap = new Map(prev)
        newMap.delete(address)
        return newMap
      })
    }
  }, [subscriptions])

  // Auto-fetch when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      console.log('Wallet connected, fetching DTFs...')
      fetchDTFs()
    } else {
      // Clear data when wallet disconnects
      setDtfs([])
      setError(null)
      setLastFetch(null)
      
      // Clean up subscriptions
      subscriptions.forEach(unsubscribe => unsubscribe())
      setSubscriptions(new Map())
    }
  }, [isConnected, address, fetchDTFs, subscriptions])

  // Auto-refresh interval
  useEffect(() => {
    if (!isConnected || !address) return

    const interval = setInterval(() => {
      if (!loading && !isCacheValid()) {
        console.log('Auto-refreshing DTF data...')
        fetchDTFs()
      }
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [isConnected, address, loading, isCacheValid, fetchDTFs])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe())
    }
  }, [subscriptions])

  const contextValue: DTFContextState = {
    dtfs,
    loading,
    error,
    lastFetch,
    refreshDTFs,
    getDTFByAddress,
    isDTFLoading,
    subscribeToDTF,
    unsubscribeFromDTF
  }

  return (
    <DTFContext.Provider value={contextValue}>
      {children}
    </DTFContext.Provider>
  )
}

// Hook to use DTF context
export function useDTF() {
  const context = useContext(DTFContext)
  if (context === undefined) {
    throw new Error('useDTF must be used within a DTFProvider')
  }
  return context
}

// Hook for specific DTF data
export function useDTFData(dtfAddress?: string) {
  const { dtfs, getDTFByAddress, isDTFLoading } = useDTF()
  
  const dtf = dtfAddress ? getDTFByAddress(dtfAddress) : undefined
  const loading = dtfAddress ? isDTFLoading(dtfAddress) : false
  
  return { dtf, loading }
}

// Hook for DTF list with filtering
export function useDTFList() {
  const { dtfs, loading, error, refreshDTFs } = useDTF()
  
  return {
    dtfs,
    loading,
    error,
    refresh: refreshDTFs
  }
}
