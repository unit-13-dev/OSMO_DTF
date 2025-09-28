"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

export default function Footer() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering theme-dependent elements
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which logo to show based on theme
  const logoSrc = mounted && resolvedTheme === "dark" ? "/logo-light.png" : "/logo-dark.png"

  return (
    <footer className="container py-8 border-t border-gray-200 dark:border-gray-800">
      <div className="flex flex-col items-center text-center">
        <Link href="/" className="flex items-center justify-center mb-4">
          {mounted ? (
            <div className="text-2xl font-bold flex items-center gap-3 text-black dark:text-white">
            <Image
              src={"/mainlogo.png"}
              alt="OSMO Logo"
              width={200}
              height={50}
              className="h-12 w-auto"
              priority
            />
            OSMO
          </div>
          ) : (
            <div className="h-12 w-[200px]" />
          )}
        </Link>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
          Decentrelised Token Folios
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} OSMO. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
