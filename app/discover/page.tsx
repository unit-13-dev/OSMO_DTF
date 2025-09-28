import Header from "@/components/landing-page/header"
import Footer from "@/components/landing-page/footer"
import PortfolioDiscovery from "@/components/dtf/portfolio-discovery"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Discover DTFs | OSMO",
  description: "Discover and compare Decentralized Token Funds on the OSMO platform. Browse, filter, and analyze DTF portfolios.",
}

export default function Discover() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Header />
      <PortfolioDiscovery />
      <Footer />
    </main>
  )
}