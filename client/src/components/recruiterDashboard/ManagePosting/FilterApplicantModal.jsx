"use client";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import API from "@/utils/interceptor";

const FilterApplicantModal = ({
  isOpen,
  closeModal,
  opportunityId,
  setApplicants,
  setFiltered, // ✅ parent state to toggle between “All” or “Filtered”
}) => {
  const [filters, setFilters] = useState({
    name: "",
    minScore: "",
    maxScore: "",
    benchmark: "", // ✅ NEW: Benchmark Score filter
    experience: "",
    education: "",
    status: "",
    location: "",
    skill: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Prefill filters from URL params on modal open
  useEffect(() => {
    if (isOpen) {
      const urlParams = new URLSearchParams(window.location.search);
      const prefilledFilters = {
        name: urlParams.get("name") || "",
        minScore: urlParams.get("minScore") || "",
        maxScore: urlParams.get("maxScore") || "",
        benchmark: urlParams.get("benchmark") || "", // ✅ NEW
        experience: urlParams.get("experience") || "",
        education: urlParams.get("education") || "",
        status: urlParams.get("status") || "",
        location: urlParams.get("location") || "",
        skill: urlParams.get("skill") || "",
      };
      setFilters(prefilledFilters);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [isOpen]);

  if (!isOpen) return null;

  const setFilterValue = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // 🔹 Reset filters and update URL
  const handleReset = async () => {
    const emptyFilters = {
      name: "",
      minScore: "",
      maxScore: "",
      benchmark: "", // ✅ NEW
      experience: "",
      education: "",
      status: "",
      location: "",
      skill: "",
    };
    setFilters(emptyFilters);
    // Update URL to empty
    window.history.replaceState(null, "", window.location.pathname);
    setFiltered(false); // ✅ tell parent we're back to all
    toast.success("Showing all applicants");
    closeModal();
  };

  // 🔹 Apply filters
  const handleApplyFilters = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val && val.trim() !== "") params.append(key, val);
      });

      const urlParams = params.toString();
      // ✅ Update URL with filters (ensures they appear and persist)
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${urlParams}`
      );

      const res = await API.get(
        `/recruiter/managePosting/filterApplicants/${opportunityId}?${urlParams}`
      );

      if (res.data.success) {
        setApplicants(res.data.applicants);
        setFiltered(true); // ✅ tell parent we’re filtered
        toast.success(`Showing ${res.data.total} filtered applicants`);
        closeModal();
      } else {
        toast.warning(res.data.message || "Failed to filter applicants");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error applying filters");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center h-screen overflow-y-auto py-8 backdrop-blur-md bg-black/60">
      <div className="w-[90%] sm:w-[75%] md:w-[60%] lg:w-[35%] rounded-lg relative min-h-fit py-6 px-5 bg-white max-h-[90vh] overflow-y-auto">
        <X
          onClick={() => closeModal()}
          className="absolute top-2 right-2 cursor-pointer hover:scale-110 transition"
        />
        <h1 className="text-center text-lg my-5 font-semibold">
          Filter Applicants
        </h1>

        <div className="flex justify-end">
          <Button
            variant="ghost"
            className="border-[1.6px] border-zinc-200"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset
          </Button>
        </div>

        {/* Name/Keyword */}
        <div className="space-y-1 mt-5">
          <Label>Name/Keyword</Label>
          <Input
            placeholder="Search by name"
            value={filters.name}
            onChange={(e) => setFilterValue("name", e.target.value)}
          />
        </div>

        {/* Skill */}
        <div className="space-y-1 mt-5">
          <Label>Skill</Label>
          <Input
            placeholder="e.g. React, Django"
            value={filters.skill}
            onChange={(e) => setFilterValue("skill", e.target.value)}
          />
        </div>

        {/* ATS Score */}
        <div className="flex items-center gap-3 mt-7">
          <div className="flex-1 space-y-1">
            <Label>Min Score (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={filters.minScore}
              onChange={(e) => setFilterValue("minScore", e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label>Max Score (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={filters.maxScore}
              onChange={(e) => setFilterValue("maxScore", e.target.value)}
            />
          </div>
        </div>

        {/* ✅ NEW: Benchmark Score */}
        <div className="space-y-1 mt-7">
          <Label>Benchmark Score</Label>
          <Select
            value={filters.benchmark}
            onValueChange={(val) => setFilterValue("benchmark", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select benchmark" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="25%">25%</SelectItem>
              <SelectItem value="50%">50%</SelectItem>
              <SelectItem value="75%">75%</SelectItem>
              <SelectItem value="100%">100%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Experience */}
        <div className="space-y-1 mt-7">
          <Label>Experience (Years)</Label>
          <Select
            value={filters.experience}
            onValueChange={(val) => setFilterValue("experience", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-1">0 - 1 Years</SelectItem>
              <SelectItem value="1-3">1 - 3 Years</SelectItem>
              <SelectItem value="3-5">3 - 5 Years</SelectItem>
              <SelectItem value="5+">5+ Years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Education */}
        <div className="space-y-1 mt-7">
          <Label>Education</Label>
          <Select
            value={filters.education}
            onValueChange={(val) => setFilterValue("education", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select education" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High School">High School</SelectItem>
              <SelectItem value="Bachelors">Bachelors</SelectItem>
              <SelectItem value="Masters">Masters</SelectItem>
              <SelectItem value="PhD">PhD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status (matches ApplicationModel enums) */}
        <div className="space-y-1 mt-7">
          <Label>Application Status</Label>
          <Select
            value={filters.status}
            onValueChange={(val) => setFilterValue("status", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="seen">Seen</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="interview_scheduled">
                Interview Scheduled
              </SelectItem>
              <SelectItem value="interviewed">Interviewed</SelectItem>
              <SelectItem value="offered">Offered</SelectItem>
              <SelectItem value="selected">Selected</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-1 mt-7">
          <Label>Preferred Location</Label>
          <Select
            value={filters.location}
            onValueChange={(val) => setFilterValue("location", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Remote">Remote</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
              <SelectItem value="On-site">On-site</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => closeModal()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="bg-black text-white hover:bg-black/90"
            onClick={handleApplyFilters}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Applying...
              </>
            ) : (
              "Apply Filters"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterApplicantModal;
