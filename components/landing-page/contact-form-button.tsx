"use client"

import Link from "next/link"
import type React from "react"

interface ContactFormButtonProps {
  className?: string
  children?: React.ReactNode
}

export default function ContactFormButton({ className = "", children }: ContactFormButtonProps) {
  return (
    <Link href="/create" className={className || "btn-primary"}>
      {children || "Create Your DTF"}
    </Link>
  )
}
