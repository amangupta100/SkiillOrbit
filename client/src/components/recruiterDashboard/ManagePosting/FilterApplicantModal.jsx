"use client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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

const FilterApplicantModal = ({ isOpen, closeModal }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    benchmark: "",
    experience: "",
    education: "",
    location: "",
    status: "",
    keyword: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    setFilters({
      benchmark: "",
      experience: "",
      education: "",
      location: "",
      status: "",
      keyword: "",
    });
  };

  const handleApplyFilters = () => {
    // Build filter string for URL
    const activeFilters = Object.entries(filters)
      .filter(([_, val]) => val && val !== "")
      .map(([key, val]) => `${key}:${encodeURIComponent(val)}`)
      .join(",");

    const url = activeFilters ? `?filter=${activeFilters}` : "";
    router.push(url);
    onClose();
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
          >
            Reset
          </Button>
        </div>

        {/* Keyword Search */}
        <div className="space-y-1 mt-5">
          <Label>Keyword</Label>
          <Input
            placeholder="Search by name, skill, etc."
            value={filters.keyword}
            onChange={(e) => setFilterValue("keyword", e.target.value)}
          />
        </div>

        {/* Benchmark Score */}
        <div className="space-y-1 mt-7">
          <Label>Benchmark Score (%)</Label>
          <Select
            value={filters.benchmark}
            onValueChange={(val) => setFilterValue("benchmark", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select benchmark" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25%</SelectItem>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="75">75%</SelectItem>
              <SelectItem value="100">100%</SelectItem>
              <SelectItem value="above100">Above 100%</SelectItem>
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

        {/* Education Level */}
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
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="High School">High School</SelectItem>
              <SelectItem value="Bachelor">Bachelor's</SelectItem>
              <SelectItem value="Master">Master's</SelectItem>
              <SelectItem value="PhD">PhD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Application Status */}
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
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Reviewed">Reviewed</SelectItem>
              <SelectItem value="Shortlisted">Shortlisted</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
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
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
              <SelectItem value="On-site">On-site</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between mt-8">
          <Button
            className="bg-black text-white hover:bg-black/90"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterApplicantModal;
