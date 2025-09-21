"use client"
import FilterModal from "@/components/recruiterDashboard/ManagePosting/FilterModal"
import JobModalForm from "@/components/recruiterDashboard/ManagePosting/JobModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useFilterModal } from "@/store/recruiter/filtermodal"
import useJobFormStore from "@/store/recruiter/JobModal"
import API from "@/utils/interceptor"
import { Plus, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import empty from '@/assests/undraw_no-data_ig65.svg'
import Image from "next/image"
import { toast } from "sonner"
import JobSkeleton from "@/components/common/Skeleton/JobSkeleton"

export default function page() {
  const [search, setSearch] = useState("")
  const router = useRouter()
  const {isOpen} = useFilterModal()
  const {isOpen:isjobFormOpen} = useJobFormStore()
  const [jobs,setJobs] = useState([])
  const [loading,setLoading] = useState(false)

  useEffect(()=>{
   const fetchJobs = async () =>{
    try{
      setLoading(true)
      const response = await API.get("/recruiter/managePosting/getallPosting")
      
      const {success,jobs} = response.data
      if(success){
        setJobs(jobs)
      }
    }catch(err){
      toast.warning(err.message)
    } finally {
      setLoading(false)
    }
   }
   fetchJobs()
  },[isjobFormOpen])

  const formattedDate = (string) =>{
    const dateObj = new Date(string);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
    return formattedDate
  }

  return (
    <div className="p-6 space-y-6 relative">
      {/* Top Controls */}
      {isOpen && <FilterModal/>}
      {isjobFormOpen && <JobModalForm/> }
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <Input
          placeholder="Search by job title..."
          className="w-full lg:max-w-md border border-gray-300"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Filter + Create Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button onClick={() => useFilterModal.getState().openModal()} variant="outline" className="gap-2 cursor-pointer">
            <Filter size={16} />
            Filter
          </Button>
          <Button
            className="gap-2 cursor-pointer"
            onClick={()=>useJobFormStore.getState().openModal()}
          >
            <Plus size={16} />
            Create New Opening
          </Button>
        </div>
      </div>

      {/* Job Postings List */}
      {loading ? (
        <JobSkeleton count={7} />
      ) : jobs && jobs.length > 0 ? (
        <div className="flex flex-wrap gap-8 py-4">
          {jobs.map((job) => (
           <div
  key={`${job.role}-${job.createdAt}`}
  className="relative border border-gray-200 bg-white px-5 py-8 rounded-xl shadow-sm min-w-64"
>
  {/* Status Badge top-right corner */}
  <span
    className={`absolute top-0 right-12 transform translate-x-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium rounded-full border ${
      job.status === "Active"
        ? "bg-green-100 text-green-600 border-green-600"
        : "bg-red-100 text-red-600 border-red-600"
    }`}
  >
    {job.status}
  </span>

  {/* Job or Internship Badge top-left */}
  <span className="absolute top-4 left-5 bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
    {job.type}
  </span>

  {/* Content */}
  <h3 className="mt-6 text-lg font-semibold">{job?.role || job?.title}</h3>
  <p className="text-sm text-gray-500 mt-3">Posted: {formattedDate(job.createdAt)}</p>
  <p className="text-sm">Applicants: {job.applicants.length}</p>
  <p className="text-sm">Benchmark Score: {job.benchmarkScore}</p>
</div>

          ))}
        </div>
      ) : (
        <div className="w-full min-h-[calc(100vh-11rem)] flex flex-col items-center justify-center">
          <Image src={empty} alt="" width={200} height={180} className="lg:w-[20%] md:w-[35%]"/>
          <h1 className="mt-4 text-lg">No postings found!</h1>
        </div>
      )}
    </div>
  )
}