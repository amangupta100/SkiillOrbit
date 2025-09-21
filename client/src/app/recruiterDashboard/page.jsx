import { Working } from '@/components/hero/Working'
import Differentiator from '@/components/recruiterDashboard/Hero/Differentiator'
import { DotBackgroundDemo } from '@/components/recruiterDashboard/Hero/dotbackground'
import WhyChooseUs from '@/components/recruiterDashboard/Hero/WhyChooseUs'
import React from 'react'

const page = () => {
  return (
    <div>
      <DotBackgroundDemo/>
      <WhyChooseUs/>
      <Working/>
      <Differentiator/>
    </div>
  )
}

export default page
