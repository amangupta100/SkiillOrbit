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
import { useState, useEffect, Suspense } from "react"; // 👈 Added Suspense

// 👈 Fallback for Suspense (simple loading)
const FilterFallback = () => (
  <div className="fixed inset-0 z-[1000] flex justify-center h-screen py-8 backdrop-blur-md bg-black/60">
    <div className="w-[90%] sm:w-[75%] md:w-[60%] lg:w-[35%] rounded-lg min-h-fit py-6 px-5 bg-white max-h-[90vh] overflow-y-auto shadow-xl animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-4" />
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-300 rounded w-1/4" />
            <div className="h-8 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const FilterContent = ({ closeModal, isOpen }) => {
  // 👈 Extracted for Suspense
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

  // Reset filters (and URL) - 👈 Preserve other params like sort_by
  const resetFilters = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    // Clear filter params only
    [
      "jobType",
      "duration",
      "stipend_min",
      "stipend_max",
      "experience",
      "salary_min",
      "salary_max",
      "workMode",
      "companyType",
      "num_positions",
      "benchmark_score",
      "datePosted",
    ].forEach((key) => newParams.delete(key));
    const basePath = pathname.includes("saved_jobs")
      ? "/job-seekerDashboard/saved_jobs"
      : "/job-seekerDashboard/opportunities";
    router.push(`${basePath}?${newParams.toString()}`);
    // Reset state
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
  };

  // Apply filters (push to URL) - 👈 Use dynamic pathname
  const applyFilters = () => {
    const query = new URLSearchParams(searchParams.toString()); // Preserve existing like sort_by

    // Job Type
    if (filters.jobType && filters.jobType !== "All") {
      query.set("jobType", filters.jobType);
    } else {
      query.delete("jobType");
    }

    // Conditional filters
    if (filters.jobType === "Internship") {
      if (filters.duration && filters.duration !== "All")
        query.set("duration", filters.duration);
      else query.delete("duration");
      if (filters.stipendMin) query.set("stipend_min", filters.stipendMin);
      else query.delete("stipend_min");
      if (filters.stipendMax) query.set("stipend_max", filters.stipendMax);
      else query.delete("stipend_max");
      // Clear job fields
      ["experience", "salary_min", "salary_max"].forEach((key) =>
        query.delete(key)
      );
    } else if (filters.jobType === "Job") {
      if (filters.experience && filters.experience !== "All")
        query.set("experience", filters.experience);
      else query.delete("experience");
      if (filters.salaryMin) query.set("salary_min", filters.salaryMin);
      else query.delete("salary_min");
      if (filters.salaryMax) query.set("salary_max", filters.salaryMax);
      else query.delete("salary_max");
      // Clear internship fields
      ["duration", "stipend_min", "stipend_max"].forEach((key) =>
        query.delete(key)
      );
    } else {
      // All: Clear conditionals
      [
        "duration",
        "stipend_min",
        "stipend_max",
        "experience",
        "salary_min",
        "salary_max",
      ].forEach((key) => query.delete(key));
    }

    // Always available filters
    if (filters.workMode && filters.workMode !== "All")
      query.set("workMode", filters.workMode);
    else query.delete("workMode");
    if (filters.companyType && filters.companyType !== "All")
      query.set("companyType", filters.companyType);
    else query.delete("companyType");
    if (filters.numPositions) query.set("num_positions", filters.numPositions);
    else query.delete("num_positions");
    if (filters.benchmarkScore)
      query.set("benchmark_score", filters.benchmarkScore);
    else query.delete("benchmark_score");
    if (filters.datePosted && filters.datePosted !== "All")
      query.set("datePosted", filters.datePosted);
    else query.delete("datePosted");

    // Dynamic path
    const basePath = pathname.includes("saved_jobs")
      ? "/job-seekerDashboard/saved_jobs"
      : "/job-seekerDashboard/opportunities";
    router.push(`${basePath}?${query.toString()}`);

    closeModal();
  };

  if (!isOpen) return null;

  const isInternship = filters.jobType === "Internship";
  const isJob = filters.jobType === "Job";

  // 👈 Validate numerics (e.g., min <= max)
  const validateRanges = () => {
    if (isInternship) {
      const min = parseInt(filters.stipendMin) || 0;
      const max = parseInt(filters.stipendMax) || Infinity;
      if (min > max) {
        toast.warning("Stipend Min cannot exceed Max");
        return false;
      }
    } else if (isJob) {
      const min = parseInt(filters.salaryMin) || 0;
      const max = parseInt(filters.salaryMax) || Infinity;
      if (min > max) {
        toast.warning("Salary Min cannot exceed Max");
        return false;
      }
    }
    return true;
  };

  const onApply = () => {
    if (!validateRanges()) return;
    applyFilters();
  };

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
                min="0"
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
                min="0"
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
                min="0"
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
                min="0"
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
            min="0"
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
            min="0"
            max="100"
            placeholder="e.g. 70"
            value={filters.benchmarkScore}
            onChange={(e) =>
              setFilters((p) => ({ ...p, benchmarkScore: e.target.value }))
            }
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
              <SelectValue placeholder="Select date range" />
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
            onClick={onApply}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function JobSeekerFilterModal({ closeModal, isOpen }) {
  return (
    <Suspense fallback={<FilterFallback />}>
      <FilterContent closeModal={closeModal} isOpen={isOpen} />
    </Suspense>
  );
}
