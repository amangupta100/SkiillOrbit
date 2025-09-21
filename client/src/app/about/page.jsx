import React from 'react'
import aboutData from './aboutData';

const page = () => {
  return (
    <section className="min-h-screen bg-white dark:bg-neutral-950 py-10 px-6">
      <div className="max-w-[1400px] mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-tr from-neutral-800 to-neutral-200 font-bold mb-4">
          About SkillOrbit
        </h1>
        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto mt-5 mb-12">
          SkillOrbit is a skill-first hiring platform built to fix what's broken in job applications.
          We believe candidates should be evaluated by what they can do — not just what's written on their resume.
        </p>

        <div className="grid md:grid-cols-2 gap-10 text-left text-gray-800 dark:text-gray-200">
       {
        aboutData.map((elem)=>{
          return(
            <div key={elem.id} className='border-[1.6px] border-zinc-200 rounded-lg p-7'>
            <h2 className="text-2xl text-center font-semibold mb-2">{elem.title}</h2>
            <p className="text-lg text-gray-500">
              {
                elem.description
              }
            </p>
          </div>
          )
        })
       }
        </div>
      </div>
    </section>
  );
}

export default page
