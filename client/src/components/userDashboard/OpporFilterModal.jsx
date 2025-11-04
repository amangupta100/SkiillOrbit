"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

export default function JobSeekerFilterModal({ closeModal, isOpen }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    jobType: "",
    duration: "",
    stipendMin: "",
    stipendMax: "",
    experience: "",
    salaryMin: "",
    salaryMax: "",
    workMode: "",
    companyType: "",
    numPositions: "",
    benchmarkScore: "",
    datePosted: "",
  });

  // Load existing filters from URL
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    setFilters((prev) => ({
      ...prev,
      jobType: params.jobType || "",
      duration: params.duration || "",
      stipendMin: params.stipend_min || "",
      stipendMax: params.stipend_max || "",
      experience: params.experience || "",
      salaryMin: params.salary_min || "",
      salaryMax: params.salary_max || "",
      workMode: params.workMode || "",
      companyType: params.companyType || "",
      numPositions: params.num_positions || "",
      benchmarkScore: params.benchmark_score || "",
      datePosted: params.datePosted || "",
    }));
  }, [searchParams]);

  // Reset filters (and URL)
  const resetFilters = () => {
    setFilters({
      jobType: "",
      duration: "",
      stipendMin: "",
      stipendMax: "",
      experience: "",
      salaryMin: "",
      salaryMax: "",
      workMode: "",
      companyType: "",
      numPositions: "",
      benchmarkScore: "",
      datePosted: "",
    });
    router.push("/job-seekerDashboard/opportunities");
  };

  // Apply filters (push to URL)
  const applyFilters = () => {
    const query = new URLSearchParams();

    // Job Type
    if (filters.jobType && filters.jobType !== "All") {
      query.append("jobType", filters.jobType);
    }

    // Conditional filters
    if (filters.jobType === "Internship") {
      if (filters.duration && filters.duration !== "All")
        query.append("duration", filters.duration);
      if (filters.stipendMin) query.append("stipend_min", filters.stipendMin);
      if (filters.stipendMax) query.append("stipend_max", filters.stipendMax);
    } else if (filters.jobType === "Job") {
      if (filters.experience && filters.experience !== "All")
        query.append("experience", filters.experience);
      if (filters.salaryMin) query.append("salary_min", filters.salaryMin);
      if (filters.salaryMax) query.append("salary_max", filters.salaryMax);
    }

    // Always available filters
    if (filters.workMode && filters.workMode !== "All")
      query.append("workMode", filters.workMode);
    if (filters.companyType && filters.companyType !== "All")
      query.append("companyType", filters.companyType);
    if (filters.numPositions)
      query.append("num_positions", filters.numPositions);
    if (filters.benchmarkScore)
      query.append("benchmark_score", filters.benchmarkScore);
    if (filters.datePosted && filters.datePosted !== "All")
      query.append("datePosted", filters.datePosted);

    // If it's saved jobs view
    if (pathname.includes("saved_jobs")) {
      router.push(`/job-seekerDashboard/saved_jobs?${query.toString()}`);
    } else {
      router.push(`/job-seekerDashboard/opportunities?${query.toString()}`);
    }

    closeModal();
  };

  if (!isOpen) return null;

  const isInternship = filters.jobType === "Internship";
  const isJob = filters.jobType === "Job";

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center h-screen overflow-y-auto py-8 backdrop-blur-md bg-black/60">
      <div className="w-[90%] sm:w-[75%] md:w-[60%] lg:w-[35%] rounded-lg relative min-h-fit py-6 px-5 bg-white max-h-[90vh] overflow-y-auto shadow-xl">
        <X
          onClick={closeModal}
          className="absolute top-3 right-3 cursor-pointer hover:text-red-500"
        />

        <h1 className="text-center text-lg my-5 font-semibold">
          Filter Opportunities
        </h1>

        <div className="flex justify-end">
          <Button
            variant="ghost"
            className="border-[1.6px] border-zinc-200"
            onClick={resetFilters}
          >
            Reset
          </Button>
        </div>

        {/* Job Type */}
        <div className="space-y-1 mt-6">
          <Label>Job Type</Label>
          <Select
            value={filters.jobType}
            onValueChange={(val) => {
              setFilters((p) => ({
                ...p,
                jobType: val,
                // Clear conditional filters when changing type
                ...(val !== "Internship"
                  ? { duration: "", stipendMin: "", stipendMax: "" }
                  : {}),
                ...(val !== "Job"
                  ? { experience: "", salaryMin: "", salaryMax: "" }
                  : {}),
              }));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
              <SelectItem value="Job">Job</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conditional Filters for Internship */}
        {isInternship && (
          <>
            {/* Duration */}
            <div className="space-y-1 mt-6">
              <Label>Duration</Label>
              <Select
                value={filters.duration}
                onValueChange={(val) =>
                  setFilters((p) => ({ ...p, duration: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="1-3">1-3 months</SelectItem>
                  <SelectItem value="3-6">3-6 months</SelectItem>
                  <SelectItem value="6+">6+ months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stipend Range */}
            <div className="space-y-1 mt-6">
              <Label>Stipend Min (₹/month)</Label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={filters.stipendMin}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, stipendMin: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1 mt-6">
              <Label>Stipend Max (₹/month)</Label>
              <Input
                type="number"
                placeholder="e.g. 20000"
                value={filters.stipendMax}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, stipendMax: e.target.value }))
                }
              />
            </div>
          </>
        )}

        {/* Conditional Filters for Job */}
        {isJob && (
          <>
            {/* Work Experience */}
            <div className="space-y-1 mt-6">
              <Label>Work Experience</Label>
              <Select
                value={filters.experience}
                onValueChange={(val) =>
                  setFilters((p) => ({ ...p, experience: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Fresher">Fresher</SelectItem>
                  <SelectItem value="Junior">Junior (1–2 years)</SelectItem>
                  <SelectItem value="Mid">Mid (3–5 years)</SelectItem>
                  <SelectItem value="Senior">Senior (5+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Salary Range */}
            <div className="space-y-1 mt-6">
              <Label>Salary Min (₹/month)</Label>
              <Input
                type="number"
                placeholder="e.g. 30000"
                value={filters.salaryMin}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, salaryMin: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1 mt-6">
              <Label>Salary Max (₹/month)</Label>
              <Input
                type="number"
                placeholder="e.g. 100000"
                value={filters.salaryMax}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, salaryMax: e.target.value }))
                }
              />
            </div>
          </>
        )}

        {/* Always Available Filters */}

        {/* Work Mode */}
        <div className="space-y-1 mt-6">
          <Label>Work Mode</Label>
          <Select
            value={filters.workMode}
            onValueChange={(val) =>
              setFilters((p) => ({ ...p, workMode: val }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select work mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
              <SelectItem value="On-site">On-site</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Company Type */}
        <div className="space-y-1 mt-6">
          <Label>Company Type</Label>
          <Select
            value={filters.companyType}
            onValueChange={(val) =>
              setFilters((p) => ({ ...p, companyType: val }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select company type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Startup">Startup</SelectItem>
              <SelectItem value="MNC">MNC</SelectItem>
              <SelectItem value="Government">Government</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Number of Positions */}
        <div className="space-y-1 mt-6">
          <Label>Min Number of Positions</Label>
          <Input
            type="number"
            placeholder="e.g. 1"
            value={filters.numPositions}
            onChange={(e) =>
              setFilters((p) => ({ ...p, numPositions: e.target.value }))
            }
          />
        </div>

        {/* Benchmark Score */}
        <div className="space-y-1 mt-6">
          <Label>Min Benchmark Score</Label>
          <Input
            type="number"
            placeholder="e.g. 70"
            value={filters.benchmarkScore}
            onChange={(e) =>
              setFilters((p) => ({ ...p, benchmarkScore: e.target.value }))
            }
            max="100"
          />
        </div>

        {/* Date Posted */}
        <div className="space-y-1 mt-6">
          <Label>Date Posted</Label>
          <Select
            value={filters.datePosted}
            onValueChange={(val) =>
              setFilters((p) => ({ ...p, datePosted: val }))
            }
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

        {/* Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            className="bg-black text-white hover:bg-black/90 w-full"
            onClick={applyFilters}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
