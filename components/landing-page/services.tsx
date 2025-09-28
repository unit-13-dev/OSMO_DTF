import { CircleDot, Layers, Rocket } from "lucide-react"

const services = [
  {
    id: 1,
    title: "Discover DTFs",
    description: "Explore trending Decentralized Token Funds and find investment opportunities that match your strategy.",
    icon: CircleDot,
    color: "bg-[#7A7FEE]",
  },
  {
    id: 2,
    title: "Create Your Fund",
    description: "Build your own DTF with custom token allocations and launch it on the blockchain in minutes.",
    icon: Layers,
    color: "bg-[#7A7FEE]",
  },
  {
    id: 3,
    title: "Manage & Track",
    description: "Monitor your portfolio performance, rebalance allocations, and track your DTF's growth over time.",
    icon: Rocket,
    color: "bg-[#7A7FEE]",
  },
]

export default function Services() {
  return (
    <section id="services" className="my-20">
      <h2 className="text-black dark:text-white mb-6 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
        Your DTF
        <span className="block text-[#7A7FEE] dark:text-[#7A7FEE]">Journey</span>
      </h2>
      <p className="mb-12 max-w-2xl text-gray-700 dark:text-gray-300">
        From discovery to creation to management, OSMO provides everything you need to succeed with Decentralized Token Funds. 
        Start your journey with our intuitive platform.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="card p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className={`${service.color} w-12 h-12 rounded-full flex items-center justify-center mb-4 shadow-sm`}>
              <service.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">{service.title}</h3>
            <p className="text-gray-700 dark:text-gray-300">{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
