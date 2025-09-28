import Header from "@/components/landing-page/header"
import DTFPortfolio from "@/components/dtf/portfolio"
import Footer from "@/components/landing-page/footer"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface PortfolioPageProps {
  params: {
    dtfAddress: string
  }
}

export async function generateMetadata({ params }: PortfolioPageProps): Promise<Metadata> {
  const { dtfAddress } = params
  
  // Validate DTF address format
  if (!isValidDTFAddress(dtfAddress)) {
    return {
      title: "Invalid DTF Address | OSMO",
      description: "The provided DTF address is not valid.",
    }
  }

  return {
    title: `Portfolio ${dtfAddress.slice(0, 8)}... | OSMO`,
    description: `View and manage your Decentralized Token Fund portfolio for ${dtfAddress.slice(0, 8)}... on OSMO platform.`,
    openGraph: {
      title: `Portfolio ${dtfAddress.slice(0, 8)}... | OSMO`,
      description: `View and manage your Decentralized Token Fund portfolio for ${dtfAddress.slice(0, 8)}... on OSMO platform.`,
    },
  }
}

// Validate DTF address format
function isValidDTFAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export default function PortfolioPage({ params }: PortfolioPageProps) {
  const { dtfAddress } = params
  
  // Validate DTF address
  if (!isValidDTFAddress(dtfAddress)) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Header />
      <DTFPortfolio dtfAddress={dtfAddress} />
      <Footer />
    </main>
  )
}

// Generate static params for known DTFs (optional)
export async function generateStaticParams() {
  // You can pre-generate static params for known DTFs here
  // For now, we'll use dynamic generation
  return []
}
