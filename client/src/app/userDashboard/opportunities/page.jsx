"use client"
import React, { useEffect, useState } from 'react'
import API from '@/utils/interceptor'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter, Share2 } from "lucide-react"
import { toast } from 'sonner'
import Image from 'next/image'
import money from '@/assests/badge-indian-rupee.svg' 
import duration from '@/assests/clock.svg'
import Clock from '@/assests/clock.svg'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import JobSkeleton from '@/components/common/Skeleton/JobSkeleton'

const Page = () => {
  const [jobs, setJobs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading,setLoading] = useState(false)
  const monthsMapper = {
  '01': 'January',
  '02': 'February',
  '03': 'March',
  '04': 'April',
  '05': 'May',
  '06': 'June',
  '07': 'July',
  '08': 'August',
  '09': 'September',
  '10': 'October',
  '11': 'November',
  '12': 'December',
};
const router = useRouter()

function formatPreferredJoiningDate(dateString) {
  const [day, month, year] = dateString.split('-'); 
  return `${day} ${monthsMapper[month]} ${year}`;
}

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const res = await API.get("/job-seeker/opportunity/getallOpportunities")
        setJobs(res.data.postings)
      } catch (err) {
        toast.warning(err.message)
      }finally{
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  const formattedDate = (createdAt) => {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffMs = now - createdDate;

  const diffInSeconds = Math.floor(diffMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);

  if (diffInHours < 1) {
    return `${diffInMinutes}min ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  } else {
    return createdDate.toLocaleDateString(); // fallback to a date if older than 4 weeks
  }
};


  const formatStipend = (amount) => {
  if (amount == null) return "";
  const num = parseInt(amount, 10);
  if (isNaN(num) || num <= 0) return "";
  return num / 1000; // scale to thousands
};

  return (
    <div className="sm:p-6 p-3 relative">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Search Input */}
              <Input
                placeholder="Search by job title..."
                className="w-full lg:max-w-md border border-gray-300"/>
      
              {/* Filter + Create Buttons */}
              <div className="flex gap-3 flex-wrap">
                <Button variant="outline" className="gap-2 cursor-pointer">
                  <Filter size={16} />
                  Filter
                </Button>
                
              </div>
            </div>
      
      {
        loading ? <JobSkeleton count={3}/>
        : 
        jobs && jobs.length>0 && (
          <div className="flex flex-wrap gap-8 py-8">
          {jobs.map((job) => (
          <div key={job._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm w-full mx-auto relative">
      {/* Badge section */}
      <div className="absolute -top-[18px] right-5 flex space-x-3">
  <span className="text-sm bg-gray-100 px-3 py-1 font-medium rounded-full border-[1.5px] border-zinc-300">
    {job.location}
  </span>
  <span className="text-sm bg-gray-100 px-3 py-1 font-medium rounded-full border-[1.5px] border-zinc-300">
    {job.type}
  </span>
</div>

      {/* Job Title */}
     <div className="flex items-start gap-4 mt-2 mb-2"> {/* Changed to items-start */}
  <Image
    src={job.company.logo} 
    alt={job.company.name} 
    width={48} 
    height={48}
    className="h-12 w-12 object-contain rounded-full border border-gray-200"
  />
  
  <div className="flex-1 flex justify-between"> {/* Added flex-1 and removed bg colors */}
    <div className="flex flex-col"> {/* Changed to column layout */}
      <div className="flex items-center gap-2"> {/* Added gap for spacing */}
        <h2 className="text-lg font-semibold">{job?.title || job?.role}</h2>
      </div>
      <div className="flex items-center">
        <p className="text-base text-gray-400">{job?.company.name}</p>
        <p className="text-gray-400 text-lg mx-1">|</p>
        <p className="text-base text-gray-400">{job?.company.headquarters}</p>
      </div>
    </div>
     <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth="1.5" 
          stroke="currentColor" 
          className="w-5 h-5 md:inline-flex hidden cursor-pointer mt-0.5" // Adjusted size and added small top margin
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" 
          />
        </svg>
  </div>
</div>

      {/* Skills */}
      <div className="flex flex-wrap gap-2 my-7">
        {job.requiredSkills.map((skill,indx) => (
          <span key={indx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
            {skill}
          </span>
        ))}
      </div>

      {/* Details */}
      <div className="flex flex-wrap justify-between gap-4 text-sm text-gray-600 mb-4">

      {/* Salary/Stipend */}
        <div>
          <div className=" text-gray-400 flex items-center gap-1 text-[15px] "><Image src={money} alt='Money' width={20} height={20}/> {job.type === "Internship"?"Stipend per month":"Job Offer"} </div>
          <div className="font-medium">₹ {job.type==="Internship"?`${formatStipend(job.stipend.min)}k - ${formatStipend(job.stipend.max)}k`: `${job.salaryRange.min}LPA - ${job.salaryRange.max}LPA`}</div>
        </div>
        <div className={`${job.type =="Internship"? null: "hidden"}`}>
          <div className={`text-gray-400 flex items-center gap-1 text-[15px]`}><Image src={duration} alt='Duration' width={18} height={18}/>  Duration</div>
          <div className="font-medium"> {job.duration} Months </div>
        </div>

        <div>
          <div className={`text-gray-400 flex items-center gap-1 text-[15px]`}>#Openings</div>
          <div className="font-medium"> {job?.nop || job?.positionsAvailable} </div>
        </div>

        <div className={`${job.type =="Job"? null: "hidden"}`}>
          <div className={`text-gray-400 flex items-center gap-1 text-[15px]`}>Experience</div>
          <div className="font-medium"> {job?.experience} years </div>
        </div>

        <div>
          <div className="text-gray-400 flex items-center gap-1 text-[15px]">Office Location</div>
          <div className="font-medium"> {job.company.headquarters} </div>
        </div>
      </div>

      {/* Actions */}
     <div className="mt-3">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    {/* Apply by / Posted part */}
    <div className="flex justify-between w-full md:w-auto text-blue-600 font-medium text-sm md:text-base">
      <span className=''>Apply by {formatPreferredJoiningDate(job.preferredJoiningDate)}</span>
      <span className='font-bold mx-1 md:inline-block hidden'>•</span>
      <span className='hidden md:inline-block'>Posted {formattedDate(job.createdAt)}</span>
      <span className='md:hidden visible bg-blue-50 px-3 py-[2px] rounded-full flex items-center gap-2'><Image src={Clock} width={15} height={15} alt=''/> Posted {formattedDate(job.createdAt)}</span>
    </div>

    {/* Buttons */}
    <div className="flex justify-between gap-2 w-auto">
     <div className="flex gap-2 items-center md:hidden">
      <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          strokeWidth="1.5" 
          stroke="currentColor" 
          className="w-5 h-5 text-gray-500 cursor-pointer mt-0.5" // Adjusted size and added small top margin
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" 
          />
        </svg>
 
      <Share2 className='text-gray-500 mt-1 w-[23px] h-[23px] '/>
     </div>

     <div className="flex min-w-auto gap-4 items-center">
       <Button onClick={()=>window.location.href = (`/userDashboard/opportunities/${job._id}`)} className="text-black bg-white border-[1.6px] hover:bg-slate-200/70 cursor-pointer border-zinc-200 ">View Details</Button>
      <Button>
        Apply Now
      </Button>
     </div>
    </div>
  </div>
</div>

     
    </div>

          ))}
        </div>
        )
      }
    </div>
  )
}

export default Page
