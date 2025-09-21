'use client'
import { useState } from "react";
import faqs from "./FAQData";
import open from '../../assests/chevron-up.svg'
import down from '../../assests/chevron-down.svg'
import Image from "next/image";

export default function FAQ() {
  const [openIndexes, setOpenIndexes] = useState([]);

  const toggle = (i) => {
    if (openIndexes.includes(i)) {
      setOpenIndexes(openIndexes.filter((index) => index !== i));
    } else {
      setOpenIndexes([...openIndexes, i]);
    }
  };

  return (
    <section className="bg-white py-16 md:py-28 px-6">
      <div className="max-w-[95%] mx-auto">
        <h2 className="text-3xl md:text-4xl text-center bg-clip-text text-transparent bg-gradient-to-tr from-neutral-800 to-neutral-200 font-bold mb-10">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className={`${faqs.length-1 == i ? "border-0" : "border-b border-zinc-300 pb-4"}`}>
              <button
                className="w-full text-left flex justify-between items-center text-lg font-medium text-gray-800"
                onClick={() => toggle(i)}
              >
                <h1 className="text-lg ">{faq.question}</h1>
                <span>{openIndexes.includes(i) ? <Image className="cursor-pointer" src={open} alt="Open" width={20} height={20}/> : <Image className="cursor-pointer" src={down} alt="Close" width={20} height={20}/>}</span>
              </button>
              {openIndexes.includes(i) && (
                <p className="text-base text-gray-500 mt-2">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
