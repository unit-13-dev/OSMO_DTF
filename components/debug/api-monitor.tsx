/**
 * API Monitor Component - Debug tool to monitor CoinGecko API usage
 * Only show in development mode
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getRateLimiterStatus } from '@/lib/api-rate-limiter'
import { getTokenCacheStats } from '@/lib/token-metadata-cache'

export default function APIMonitor() {
  const [rateLimiterStatus, setRateLimiterStatus] = useState<any>(null)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Only show in development
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development')
  }, [])

  const updateStats = () => {
    setRateLimiterStatus(getRateLimiterStatus())
    setCacheStats(getTokenCacheStats())
  }

  useEffect(() => {
    if (!isVisible) return

    updateStats()
    const interval = setInterval(updateStats, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-black/90 text-white border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">API Monitor</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={updateStats}
              className="text-white hover:bg-gray-800"
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Rate Limiter Status */}
          <div>
            <h4 className="text-xs font-medium mb-2">Rate Limiter</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Can Make Request:</span>
                <Badge 
                  variant={rateLimiterStatus?.canMakeRequest ? "default" : "destructive"}
                  className="text-xs"
                >
                  {rateLimiterStatus?.canMakeRequest ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Requests in Window:</span>
                <span>{rateLimiterStatus?.requestsInWindow || 0}/{rateLimiterStatus?.maxRequests || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Cooldown:</span>
                <Badge 
                  variant={rateLimiterStatus?.isCooldown ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {rateLimiterStatus?.isCooldown ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Pending Requests:</span>
                <span>{rateLimiterStatus?.pendingRequests || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>API Key:</span>
                <Badge 
                  variant={rateLimiterStatus?.hasCoinGeckoAPIKey ? "default" : "destructive"}
                  className="text-xs"
                >
                  {rateLimiterStatus?.hasCoinGeckoAPIKey ? "Present" : "Missing"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Token Cache Stats */}
          <div>
            <h4 className="text-xs font-medium mb-2">Token Cache</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Total Entries:</span>
                <span>{cacheStats?.totalEntries || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Valid Entries:</span>
                <span>{cacheStats?.validEntries || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Expired Entries:</span>
                <span>{cacheStats?.expiredEntries || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Pending Batches:</span>
                <span>{cacheStats?.pendingBatches || 0}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Rate Limit Usage</span>
              <span>{Math.round(((rateLimiterStatus?.requestsInWindow || 0) / (rateLimiterStatus?.maxRequests || 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  (rateLimiterStatus?.requestsInWindow || 0) / (rateLimiterStatus?.maxRequests || 1) > 0.8 
                    ? 'bg-red-500' 
                    : (rateLimiterStatus?.requestsInWindow || 0) / (rateLimiterStatus?.maxRequests || 1) > 0.6
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min(((rateLimiterStatus?.requestsInWindow || 0) / (rateLimiterStatus?.maxRequests || 1)) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
