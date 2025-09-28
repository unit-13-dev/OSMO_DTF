import Header from "@/components/landing-page/header"
import DTFPortfolio from "@/components/dtf/portfolio"
import Footer from "@/components/landing-page/footer"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "DTF Portfolio | OSMO",
  description: "View and manage your Decentralized Token Fund portfolio on OSMO platform.",
}

export default function Portfolio() {
  // Redirect to discover page if no DTF address provided
  // This allows users to select a DTF from the discovery page
  redirect('/discover')
}
