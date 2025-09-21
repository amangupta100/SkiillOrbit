"use client"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useFilterModal } from "@/store/recruiter/filtermodal"
import { X } from "lucide-react"

export default function FilterModal() {
  const {
    isOpen,
    closeModal,
    filters,
    setFilters,
    resetFilters,
    openModal,
  } = useFilterModal()

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center h-screen overflow-y-auto py-8 backdrop-blur-md bg-black/60">
      <div className="w-[90%] sm:w-[75%] md:w-[60%] lg:w-[35%] rounded-lg relative min-h-fit py-6 px-5 bg-white max-h-[90vh] overflow-y-auto">
        <X onClick={() => closeModal(false)} className="absolute top-2 right-2 cursor-pointer" />

        <h1 className="text-center text-lg my-5 font-semibold">Filter Jobs</h1>

       <div className="flex justify-end">
         <Button variant="ghost" className="border-[1.6px] border-zinc-200 " onClick={resetFilters}>
            Reset
          </Button>
       </div>

        {/* Status */}
        <div className="space-y-1">
          <Label className="text-base">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(val) => setFilters({ status: val })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Posting Duration */}
        <div className="space-y-1 mt-7">
          <Label>Posting Duration</Label>
          <Select
            value={filters.postingDuration}
            onValueChange={(val) => setFilters({ postingDuration: val })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Time</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applicants */}
        <div className="space-y-1 mt-7">
          <Label>Min Applicants</Label>
          <Input
            value={filters.minApplicants}
            onChange={(e) =>
              setFilters({ minApplicants: Number(e.target.value) })
            }
            type="number"
            placeholder="e.g. 10"
          />
        </div>

        {/* Avg Score */}
        <div className="space-y-1 mt-7">
          <Label>Min Average Score (%)</Label>
          <Input
            value={filters.minAvgScore}
            onChange={(e) =>
              setFilters({ minAvgScore: Number(e.target.value) })
            }
            type="number"
            placeholder="e.g. 75"
          />
        </div>

        {/* Job Type */}
        <div className="space-y-1 mt-7">
          <Label>Job Type</Label>
          <Select
            value={filters.jobType}
            onValueChange={(val) => setFilters({ jobType: val })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-1 mt-7">
          <Label>Location</Label>
          <Select
            value={filters.location}
            onValueChange={(val) => setFilters({ location: val })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
              <SelectItem value="On-site">On-site</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            className="bg-black text-white hover:bg-black/90"
            onClick={closeModal}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  )
}
