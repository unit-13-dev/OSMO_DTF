import Image from "next/image"
import ContactFormButton from "./contact-form-button"

export default function CallToAction() {
  return (
    <section id="contact" className="card my-20 relative overflow-hidden shadow-md">
      <div className="p-8 md:p-10 lg:p-12 flex flex-col md:flex-row items-start">
        {/* Text content - takes full width on mobile */}
        <div className="w-full md:w-3/5 z-10">
          <h2 className="text-black dark:text-white mb-6 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight">
            Ready to Build Your <span className="text-[#7A7FEE] dark:text-[#7A7FEE]">DTF Portfolio?</span>
          </h2>
          <p className="my-6 text-sm md:text-base max-w-md text-gray-700 dark:text-gray-300">
            Start creating your own Decentralized Token Fund today.
          </p>
          <p className="mb-6 text-sm md:text-base max-w-md text-gray-700 dark:text-gray-300">
            Choose your tokens, set your allocations, and launch your fund in minutes. No coding required.
          </p>
          <div>
            <ContactFormButton />
          </div>
        </div>

        {/* Image - hidden on mobile, visible on md and up */}
        <div className="hidden md:flex md:w-2/5 md:absolute md:right-0 md:top-0 md:bottom-0 md:items-center">
          <Image
            src="/purple-circle-wave-static.png"
            alt="Purple Wave"
            width={500}
            height={500}
            className="w-full h-auto md:h-full md:w-auto md:object-cover md:object-left"
          />
        </div>
      </div>
    </section>
  )
}
