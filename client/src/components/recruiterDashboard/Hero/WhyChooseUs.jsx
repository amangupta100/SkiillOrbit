import differentiators from "./FeaturesData";
import Image from "next/image";

export default function WhyChooseUs() {
  return (
    <section className="bg-white dark:bg-neutral-950 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl leading-tight bg-clip-text text-transparent bg-gradient-to-tr from-neutral-800 to-neutral-300 font-bold">
          What Makes Us Different?
        </h2>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mt-2 mb-16 max-w-3xl mx-auto">
          We're not just a job boarding platform — we're a skill-powered hiring engine designed to save your time, improve hiring outcomes, and eliminate noise.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 mt-8 lg:grid-cols-2 gap-6 sm:gap-8 text-left">
          {differentiators.map((item, i) => (
            <div
              key={i}
              className="bg-white border-[1.6px] border-zinc-100 dark:bg-neutral-900 p-6 rounded-xl shadow hover:shadow-lg transition flex flex-col"
            >
              <div className="flex justify-center mb-4">
                <Image 
                  src={item.image} 
                  alt={item.title}
                  width={120}
                  height={120}
                  className="object-contain h-24 w-24"
                
                />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">
                {item.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-400 text-center">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}