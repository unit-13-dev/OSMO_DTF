"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    id: 1,
    question: "What is a Decentralized Token Fund (DTF)?",
    answer:
      "A DTF is a smart contract-based investment fund that automatically manages a diversified portfolio of tokens. It allows you to invest in multiple cryptocurrencies with a single transaction and automatic rebalancing.",
  },
  {
    id: 2,
    question: "How do I create my own DTF?",
    answer:
      "Creating a DTF is simple! Connect your wallet, choose your tokens, set allocation percentages, and deploy your fund. The entire process takes just a few minutes with our intuitive interface.",
  },
  {
    id: 3,
    question: "What tokens can I include in my DTF?",
    answer:
      "You can include any ERC-20 tokens that are available on the platform. We support major DeFi tokens, stablecoins, and emerging projects. Our search functionality helps you find the tokens you want.",
  },
  {
    id: 4,
    question: "Are there any fees for using OSMO?",
    answer:
      "OSMO charges minimal platform fees for DTF creation and management. You'll also pay standard blockchain gas fees for transactions. All fees are transparent and displayed before you confirm any action.",
  },
  {
    id: 5,
    question: "How do I track my DTF's performance?",
    answer:
      "Our dashboard provides real-time performance metrics, including total value, individual token performance, and historical charts. You can monitor your DTF's growth and make informed decisions.",
  },
  {
    id: 6,
    question: "Can I modify my DTF after creation?",
    answer:
      "Yes! You can rebalance your DTF by adjusting token allocations, adding new tokens, or removing existing ones. Changes are executed through smart contracts for transparency and security.",
  },
]

export default function Faq() {
  const [openItem, setOpenItem] = useState<number | null>(null)

  const toggleItem = (id: number) => {
    setOpenItem(openItem === id ? null : id)
  }

  return (
    <section id="faq" className="my-20">
      <div className="card p-8 md:p-10 shadow-lg">
        <h2 className="text-black dark:text-white mb-6 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
          Frequently Asked
          <span className="block text-[#7A7FEE] dark:text-[#7A7FEE]">Questions</span>
        </h2>
        <p className="mb-8 max-w-2xl text-gray-700 dark:text-gray-300">
          Have questions about DTFs and how OSMO works? Find answers to the most common questions and learn how to 
          get started with Decentralized Token Funds.
        </p>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="border-b pb-4 border-gray-300 dark:border-gray-700">
              <button
                onClick={() => toggleItem(faq.id)}
                className="flex justify-between items-center w-full text-left py-2 font-medium text-black dark:text-white hover:text-[#7A7FEE] dark:hover:text-[#7A7FEE] transition-colors"
                aria-expanded={openItem === faq.id}
                aria-controls={`faq-answer-${faq.id}`}
              >
                <span className="font-medium">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${openItem === faq.id ? "rotate-180 text-[#7A7FEE]" : ""}`}
                />
              </button>
              {openItem === faq.id && (
                <div id={`faq-answer-${faq.id}`} className="mt-2 text-gray-700 dark:text-gray-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
