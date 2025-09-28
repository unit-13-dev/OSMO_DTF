import Header from "@/components/landing-page/header"
import DTFDashboard from "@/components/dtf/dashboard"
import Footer from "@/components/landing-page/footer"

export const metadata = {
  title: "Discover DTFs | OSMO",
  description: "Discover and explore Decentralized Token Funds on OSMO platform.",
}

export default function StartPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Header />
      <DTFDashboard />
      <Footer />
    </main>
  )
}
