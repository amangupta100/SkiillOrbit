"use client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import React from 'react'
import useJobFormStore from "@/store/recruiter/JobModal";
import RequiredStar from "@/components/ui/RequiredStar";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import API from "@/utils/interceptor";
import Button from "@/components/ui/button2";
import RichTextEditor from "../../common/DescriptionJob";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/Checkbox";

const JobForm = () => {

const {
  isOpen,
  closeModal,
  jobForm,
  setField,
  setSalaryField,
  setSkills,
  setOptionalSkills,
  resetForm,
} = useJobFormStore();
const [loading,setLoading] = useState(false)
const [about, setAbout] = useState(`
<h2><b>#About the Opportunity</b></h2>
<p></p>
<h2><b>#Responsibilities</b></h2>
<ul><li></li></ul>
<h2><b>#Requirements</b></h2>
<ul><li></li></ul>
`)
const [date,setDate] = useState(null)
const [immediateJoining, setImmediateJoining] = useState(false);
const [benefits, setBenefits] = useState([])
    
useEffect(() => {
    setField("description", about);
  }, [about]);
 const canSubmit = jobForm.domain.length>5 && jobForm.role.length>5 && jobForm.requiredSkills.length>=2 && jobForm.experience.length>0 && jobForm.salaryRange.min>1 && jobForm.salaryRange.max>jobForm.salaryRange.min && jobForm.benchmarkScore.length>0 && jobForm.nop.length>0
  
const handleSubmit =async (e) =>{
e.preventDefault()
if(!immediateJoining){
    setField("preferredJoiningDate","Immediate Joiner - 30 days")
}else setField("preferredJoiningDate",date)

if(benefits.length == 0){
    setField("extBenefits",[])
} 

console.log(jobForm)
try{
setLoading(true)
const response = await API.post("/recruiter/managePosting/createJobPosting",jobForm)
console.log(response,response.data)
const {success:succ,message} = response.data
if(succ){
toast.success(message)
resetForm() 
closeModal();
}
  else toast.error(message)
  }catch(err){
    toast.warning(err.message)
  }finally{
    setLoading(false)
  }
  }

const options = [
  "Health Insurance",
  "5 days a week",
  "Life Insurance",
  "Free Snacks and beverages",
  "Cab/Transportation facility",
  "Informal Dress Code"
]

 const toggleBenefit = (benefit) => {
    const updated = benefits.includes(benefit)
      ? benefits.filter(b => b !== benefit)
      : [...benefits, benefit]

    setBenefits(updated)
    setField("extBenefits", updated); // Immediately update the form store
  }

  return (
    
    <div className="relative">
      <h1 className="text-center text-lg my-3 font-semibold">Post New Job</h1>

        <form onSubmit={handleSubmit}>
        {/* Domain */}
        <div className="space-y-1 mb-8">
          <Label className="text-base">Domain <RequiredStar/></Label>
          <Input
            placeholder="e.g. Software Engineering"
            value={jobForm.domain}
            onChange={(e) => setField("domain", e.target.value)}
          />
        </div>

        {/* Role */}
        <div className="space-y-1 mb-8">
          <Label className="text-base">Role  <RequiredStar/></Label>
          <Input
            placeholder="e.g. Frontend Developer"
            value={jobForm.role}
            onChange={(e) => setField("role", e.target.value)}
          />
        </div>

        {/* Skills */}
        <div className="space-y-1 mb-8">
          <Label className="text-base">Required Skills (comma-separated)<RequiredStar/></Label>
          <Input
            placeholder="Enter required skills"
            value={jobForm.requiredSkills?.join(", ") || ""}
            onChange={(e) => {
              const skills = e.target.value.split(",").map(s => s.trim());
              setSkills(skills);
            }}
          />
        </div>

        <div className="space-y-1 mb-8">
          <Label className="text-base">Optional Skills (comma-separated)</Label>
          <Input
            placeholder="Enter the optional skills"
            value={jobForm.optionalSkills?.join(", ") || ""}
            onChange={(e) => {
              const skills = e.target.value.split(",").map(s => s.trim());
              setOptionalSkills(skills);
            }}
          />
        </div>


        {/*experience*/}
         <div className="space-y-1 mb-8">
          <Label className="text-base">Work Experience (in years) <RequiredStar/></Label>
          <Select
            value={jobForm.experience}
            onValueChange={(val) => setField("experience", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-1">0-1</SelectItem>
              <SelectItem value="1-2">1-2</SelectItem>
              <SelectItem value="2-3">2-3</SelectItem>
              <SelectItem value="3-4">3-4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-1 mb-8">
          <Label className="text-base">Location <RequiredStar/></Label>
          <Select
            value={jobForm.location}
            onValueChange={(val) => setField("location", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Remote">Remote</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
              <SelectItem value="On-Site">On-Site</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Salary Range */}
        <div className="flex flex-col gap-2 mb-8">
  <Label className="text-base">
    Salary Range <RequiredStar /> (per Annum)
  </Label>

  <div className="flex items-center gap-2">
    <Input
      type="number"
      placeholder="e.g. 3"
      value={jobForm.salaryRange.min}
      onChange={(e) => setSalaryField("min", Number(e.target.value))}
      className="w-full"
    />

    <span className="text-sm text-muted-foreground">to</span>

    <Input
      type="number"
      placeholder="e.g. 5.5"
      value={jobForm.salaryRange.max}
      onChange={(e) => setSalaryField("max", Number(e.target.value))}
      className="w-full"
    />

    <span className="text-sm text-muted-foreground whitespace-nowrap">LPA</span>
  </div>
</div>


         {/*bench mark score*/}
<div className="flex gap-4 mb-8">
  <div className="flex-1 space-y-1">
    <Label className="text-base">BenchMark Score<RequiredStar/></Label>
    <Select
    value={jobForm.benchmarkScore}
    onValueChange={(val) => setField("benchmarkScore", val)}
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Select BenchMark Score" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="ALL">ALL</SelectItem>
      <SelectItem value="25%">25%</SelectItem>
      <SelectItem value="50%">50%</SelectItem>
      <SelectItem value="75%">75%</SelectItem>
      <SelectItem value="100%">100%</SelectItem>
    </SelectContent>
          </Select>
          </div>
        </div>

         {/*nop */}
         <div className="flex gap-4 mb-8">
          <div className="flex-1 space-y-1">
            <Label className="text-base">Number of Positions<RequiredStar/></Label>
              <Input
              type="number"
              placeholder="e.g. 1,2,3"
              value={jobForm.nop}
              onChange={(e) => setField("nop",e.target.value)}
            />
          </div>
        </div>



        {/* Description */}
        
        <div className="flex flex-col gap-4 mb-8">
          <Label className="text-base">About Job<RequiredStar/></Label>
          <RichTextEditor value={about} onChange={setAbout}/>
        </div>


{/*preferred joining date*/}
<div className="flex flex-col gap-2 mb-8">
  <Label className="text-base">
    Preferred Joining Date<RequiredStar />
  </Label>
  
  <Popover>
    <PopoverTrigger 
      disabled={immediateJoining}
      className={cn(
        "sm:w-[250px] w-full inline-flex justify-between items-center px-4 py-2 border border-zinc-300 rounded-md text-sm",
        immediateJoining && "opacity-50 cursor-not-allowed bg-gray-100"
      )}
    >
      {date ? format(date, "dd / MMMM / yyyy") : "dd-mm-yyyy"}
      <CalendarIcon className="ml-2 h-4 w-4 text-gray-500" />
    </PopoverTrigger>
    
    <PopoverContent className="w-auto z-[1001] p-0">
      <Calendar
        mode="single"
        selected={immediateJoining ? null : date} // Don't show selection if immediate joining
        onSelect={(selectedDate) => {
          if (!immediateJoining) {
            setDate(selectedDate);
            setField("preferredJoiningDate", format(selectedDate, "dd-MM-yyyy"));
          }
        }}
        initialFocus
        captionLayout="dropdown"
        fromYear={new Date().getFullYear()}
        toYear={new Date().getFullYear() + 1}
        disabled={(day) => {
          if (immediateJoining) return true; // Disable all dates if immediate joining is checked
          
          const today = new Date();
          const threeMonthsLater = new Date();
          threeMonthsLater.setMonth(today.getMonth() + 3);
          return day < today || day > threeMonthsLater;
        }}
      />
    </PopoverContent>
  </Popover>
   <div className="flex items-center gap-2">
    <input
      type="checkbox"
      id="immediateJoining"
      checked={immediateJoining}
      onChange={(e) => {
        setImmediateJoining(e.target.checked);
        if (e.target.checked) {
          // Set date to 30 days from now when checked
          const thirtyDaysLater = new Date();
          thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
          setDate(thirtyDaysLater);
          setField("preferredJoiningDate", format(thirtyDaysLater, "dd-MM-yyyy"));
        } else {
          // Clear date when unchecked
          setDate(null);
          setField("preferredJoiningDate", "");
        }
      }}
      className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
    />
    <Label htmlFor="immediateJoining" className="text-base">
      Immediate Joiner (within 30 days)
    </Label>
  </div>
</div>

  {/*extra-benefits */}
    <div className="space-y-3 my-5">
      <p className="font-medium">Extra Benefits</p>
      {options.map((label) => (
        <div className="flex items-center space-x-2" key={label}>
        <Checkbox
            id={label}
            checked={benefits.includes(label)}
            onCheckedChange={() => toggleBenefit(label)} className="border-zinc-400 cursor-pointer"
          />
          <label htmlFor={label} className="text-[14px] font-light ">{label}</label>
        </div>
      ))}
    </div>


        <div className="flex w-full justify-end gap-3">
          <Button onClick={() => { resetForm(); closeModal(); }}>
            Cancel
          </Button>
          <Button canSubmit={canSubmit} loading={loading} type="submit">
            Post Job
          </Button>
        </div>
        </form>
    </div>
  )
}

export default JobForm
