"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react"; // 👈 Added Suspense
import API from "@/utils/interceptor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Lock } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import money from "@/assests/badge-indian-rupee.svg";
import duration from "@/assests/clock.svg";
import { useRouter, useSearchParams } from "next/navigation";
import JobSkeleton from "@/components/common/Skeleton/JobSkeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import useAuthStore from "@/store/authStore";
import JobSeekerFilterModal from "@/components/userDashboard/OpporFilterModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchTypingAnimation from "@/components/common/SearchTypingAnimation";
import { formatDistanceToNow } from "date-fns";

/** Simple debounce helper (top-level so it's stable) */
function debounce(func, wait) {
  let timeout = null;
  return (...args) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const PageContent = () => {
  // 👈 Extracted for Suspense wrapping
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allJobs, setAllJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort_by") || "postings_new"
  );
  // 👈 Removed unused showSaved (comment if needed later)
  const [openFilterModal, setOpenFilterModal] = useState(false);

  const { user } = useAuthStore();

  console.log(allJobs);

  const monthsMapper = {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    10: "October",
    11: "November",
    12: "December",
  };

  function formatPreferredJoiningDate(dateString) {
    const [day, month, year] = dateString.split("-");
    return `${day} ${monthsMapper[month]} ${year}`;
  }

  const getSalary = (job) => {
    if (!job) return 0;
    if (job.type === "Internship") {
      const min = parseInt(job.stipend?.min || 0, 10);
      const max = parseInt(job.stipend?.max || 0, 10);
      return (min + max) / 2 / 1000; // k per month
    } else {
      const min = job.salaryRange?.min || 0;
      const max = job.salaryRange?.max || 0;
      return (min + max) / 2; // LPA
    }
  };

  const sortBasedOn = (sortType, jobs) => {
    if (jobs.length === 0) return jobs;

    let sorted = [...jobs];

    // Active first, then non-active (closed, filled, etc.)
    const statusComparator = (a, b) => {
      const sA = a.status === "Active" ? 1 : 0;
      const sB = b.status === "Active" ? 1 : 0;
      return sB - sA;
    };

    const keyComparator = (a, b, comp) => {
      const statusDiff = statusComparator(a, b);
      if (statusDiff !== 0) return statusDiff;
      return comp(a, b);
    };

    switch (sortType) {
      case "postings_new":
        return sorted.sort((a, b) =>
          keyComparator(
            a,
            b,
            (x, y) =>
              new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
          )
        );
      case "postings_old":
        return sorted.sort((a, b) =>
          keyComparator(
            a,
            b,
            (x, y) =>
              new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime()
          )
        );
      case "title_az":
        return sorted.sort((a, b) =>
          keyComparator(a, b, (x, y) =>
            (x.title || "")
              .toLowerCase()
              .localeCompare((y.title || "").toLowerCase())
          )
        );
      case "role_az":
        return sorted.sort((a, b) =>
          keyComparator(a, b, (x, y) =>
            (x.role || "")
              .toLowerCase()
              .localeCompare((y.role || "").toLowerCase())
          )
        );
      case "salary":
        return sorted.sort((a, b) =>
          keyComparator(a, b, (x, y) => getSalary(y) - getSalary(x))
        );
      case "saved":
        return sorted.sort((a, b) => {
          const savedDiff = Number(b.saved) - Number(a.saved);
          if (savedDiff !== 0) return savedDiff;
          // then newest first
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      default:
        // default to newest with Active first
        return sorted.sort((a, b) =>
          keyComparator(
            a,
            b,
            (x, y) =>
              new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
          )
        );
    }
  };

  // Client-side processed list (all postings, sorted, Active first)
  const processedJobs = useMemo(() => {
    // 👈 Removed showSaved dep (unused)
    let temp = allJobs;
    return sortBasedOn(sortBy, temp);
  }, [allJobs, sortBy]);

  // Final jobs to show:
  // - If user typed something (>=1 char) → use backend search results + sort
  // - Otherwise → use main processed list
  const jobsToRender = useMemo(() => {
    if (searchTerm.trim().length >= 1) {
      return sortBasedOn(sortBy, searchResults);
    }
    return processedJobs;
  }, [searchTerm, searchResults, processedJobs, sortBy]);

  // ----- Backend Search -----
  const performSearch = async (query) => {
    const trimmed = query.trim();

    // Option A: search even from 1 character
    if (trimmed.length < 1) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await API.get(
        `/job-seeker/opportunity/search?q=${encodeURIComponent(trimmed)}`
      );
      setSearchResults(res.data.postings || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = useMemo(
    () =>
      debounce((value) => {
        performSearch(value);
      }, 400),
    [] // 👈 Stable deps, no ESLint disable needed
  );

  // ----- Initial fetch of all postings -----
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await API.get(
          `/job-seeker/opportunity/getallOpportunities?sort_by=recent`
        );
        setAllJobs(res.data.postings || []);
      } catch (err) {
        toast.warning(err?.message || "Failed to load opportunities");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // ----- Ensure default sort_by in URL -----
  useEffect(() => {
    const currentSort = searchParams.get("sort_by");
    if (!currentSort) {
      router.replace(`?sort_by=postings_new`, { scroll: false });
    }
  }, [searchParams, router]); // 👈 Added router dep

  const formattedDate = (createdAt) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();

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
      return createdDate.toLocaleDateString();
    }
  };

  const formatStipend = (amount) => {
    if (amount == null) return "";
    const num = parseInt(amount, 10);
    if (isNaN(num) || num <= 0) return "";
    return num / 1000;
  };

  const handleSaveOpp = async (id, type) => {
    try {
      setSavingId(id);

      const res = await API.post("/job-seeker/opportunity/save", {
        itemId: id,
        itemType: type,
      });

      setAllJobs((prev) =>
        prev.map((j) => (j._id === id ? { ...j, saved: res.data.saved } : j))
      );
      // Also update search results list if visible
      setSearchResults((prev) =>
        prev.map((j) => (j._id === id ? { ...j, saved: res.data.saved } : j))
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error saving");
    } finally {
      setSavingId(null);
    }
  };

  // 👈 Fallback for Suspense (simple skeleton reuse)
  if (loading) return <JobSkeleton count={3} />;

  return (
    <div className="sm:p-6 p-3 relative">
      <JobSeekerFilterModal
        isOpen={openFilterModal}
        closeModal={() => setOpenFilterModal(false)}
      />

      {/* Search + Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative w-full md:max-w-md">
          <Input
            className="w-full lg:max-w-md border border-gray-300"
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              handleSearch(value);
            }}
          />

          {searchTerm === "" && (
            <span className="absolute text-base left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <SearchTypingAnimation
                words={[
                  "Search by Role",
                  "Search by Skill",
                  "Search by Domain",
                ]}
                typingSpeed={100}
                deletingSpeed={80}
                pauseTime={1500}
              />
            </span>
          )}
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button
            disabled
            onClick={() => setOpenFilterModal(true)}
            variant="outline"
            className="gap-2 cursor-pointer"
          >
            <Filter size={16} />
            Filter
          </Button>
        </div>
      </div>

      {/* Sort row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Sort by:</span>
          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value);
              router.push(`?sort_by=${value}`, { scroll: false });
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="postings_new">Postings - New</SelectItem>
              <SelectItem value="postings_old">Postings - Old</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Listing */}
      {isSearching && searchTerm.trim().length >= 1 ? (
        <div className="mt-5 text-center text-gray-500">Searching...</div>
      ) : jobsToRender && jobsToRender.length > 0 ? (
        <div className="mt-5">
          <h1 className="text-sm mb-1 text-gray-400">
            {searchTerm.trim().length >= 1
              ? `Showing ${jobsToRender.length} result${
                  jobsToRender.length === 1 ? "" : "s"
                } for "${searchTerm.trim()}"`
              : `Showing ${jobsToRender.length} postings`}
          </h1>
          <div className="flex flex-wrap gap-8">
            {jobsToRender.map((job) => {
              const isClosed = job.status === "Closed";
              const alreadyApplied =
                user?.id &&
                job.applications?.some(
                  // 👈 Added user?.id null check
                  (application) => application.user === user.id
                );

              return (
                <div
                  key={job._id}
                  className={`${
                    isClosed ? "opacity-60 pointer-events-none select-none" : ""
                  } rounded-xl border border-gray-200 p-4 shadow-sm w-full mx-auto relative`}
                >
                  {/* Overlay Lock Icon for Closed */}
                  {isClosed && (
                    <div className="absolute inset-0 bg-white/75 rounded-xl z-10 pointer-events-none">
                      <div className="absolute inset-0 flex items-center justify-center flex-col text-zinc-700">
                        <Lock className="w-6 h-6" />
                        <p className="text-xs font-medium">Closed</p>
                      </div>

                      {/* Hoverable info icon */}
                      <div className="absolute pointer-events-auto flex items-center justify-center gap-1 top-2 right-2">
                        <div className="cursor-pointer rounded-full p-1">
                          <Button
                            onClick={() =>
                              router.push(
                                `/job-seekerDashboard/opportunities/${job._id}`
                              )
                            }
                          >
                            Get Details
                          </Button>
                        </div>

                        <div className="">
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className=""
                                  onClick={() =>
                                    toast.info(
                                      `Closed ${formatDistanceToNow(
                                        new Date(
                                          job?.closureDetails?.closedAt ||
                                            Date.now()
                                        ),
                                        { addSuffix: true }
                                      )}. Reason: ${
                                        job?.closureDetails?.reason ||
                                        "No reason provided."
                                      }`
                                    )
                                  }
                                >
                                  <Info className="w-5 h-5 text-zinc-700" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side="left"
                                className="text-xs max-w-[200px]"
                              >
                                {`Closed ${formatDistanceToNow(
                                  new Date(
                                    job?.closureDetails?.closedAt || Date.now()
                                  ),
                                  { addSuffix: true }
                                )}.`}
                                <br />
                                {`Reason: ${
                                  job?.closureDetails?.reason ||
                                  "No reason provided."
                                }`}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isClosed && (
                    <>
                      {/* Badges */}
                      <div className="absolute -top-[18px] right-5 flex space-x-3">
                        <span className="text-sm bg-gray-100 px-3 py-1 font-medium rounded-full border-[1.5px] border-zinc-300">
                          {job.location}
                        </span>
                        <span className="text-sm bg-gray-100 px-3 py-1 font-medium rounded-full border-[1.5px] border-zinc-300">
                          {job.type}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Header */}
                  <div className="flex items-start gap-4 mt-2 mb-2">
                    <Image
                      src={job.company.logo.data}
                      alt={job.company.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 object-contain rounded-full border border-gray-200"
                    />
                    <div className="flex-1 flex justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold">
                            {job?.title || job?.role}
                          </h2>
                        </div>
                        <div className="flex items-center">
                          <p className="text-base text-gray-400">
                            {job?.company.name}
                          </p>
                          <p className="text-gray-400 text-lg mx-1">|</p>
                          <p className="text-base text-gray-400">
                            {job?.company.headquarters}
                          </p>
                        </div>
                      </div>
                      <svg
                        onClick={() => handleSaveOpp(job._id, job.type)}
                        xmlns="http://www.w3.org/2000/svg"
                        fill={job.saved ? "red" : "none"}
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke={job.saved ? "red" : "currentColor"}
                        className={`w-5 h-5 cursor-pointer mt-0.5 ${
                          savingId === job._id ? "animate-pulse" : ""
                        }`}
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
                    {job.requiredSkills?.map((skill, indx) => (
                      <span
                        key={indx}
                        className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap justify-between gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <div className="text-gray-400 flex items-center gap-1 text-[15px]">
                        <Image src={money} alt="Money" width={20} height={20} />
                        {job.type === "Internship"
                          ? "Stipend per month"
                          : "Job Offer"}
                      </div>
                      <div className="font-medium">
                        ₹{" "}
                        {job.type === "Internship"
                          ? `${formatStipend(
                              job.stipend.min
                            )}k - ${formatStipend(job.stipend.max)}k`
                          : `${job.salaryRange.min}LPA - ${job.salaryRange.max}LPA`}
                      </div>
                    </div>

                    {job.type === "Internship" && (
                      <div>
                        <div className="text-gray-400 flex items-center gap-1 text-[15px]">
                          <Image
                            src={duration}
                            alt="Duration"
                            width={18}
                            height={18}
                          />{" "}
                          Duration
                        </div>
                        <div className="font-medium">{job.duration} Months</div>
                      </div>
                    )}

                    <div>
                      <div className="text-gray-400 flex items-center gap-1 text-[15px]">
                        #Openings
                      </div>
                      <div className="font-medium">
                        {job?.nop || job?.positionsAvailable}
                      </div>
                    </div>

                    {job.type === "Job" && (
                      <div>
                        <div className="text-gray-400 flex items-center gap-1 text-[15px]">
                          Experience
                        </div>
                        <div className="font-medium">
                          {job?.experience} years
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-gray-400 flex items-center gap-1 text-[15px]">
                        Office Location
                      </div>
                      <div className="font-medium">
                        {job.company.headquarters}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3">
                    <div className="flex flex-col lg:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex-col flex lg:flex-row justify-between w-full md:w-auto text-blue-600 font-medium text-sm md:text-base relative">
                        {job.preferredJoiningDate
                          ?.toLowerCase()
                          .includes("immediate") ? (
                          <>
                            <span>Immediate Joiner Preferred</span>
                            <span className="font-bold mx-1 hidden md:inline-block">
                              •
                            </span>
                            <span className="hidden md:inline-block">
                              Posted {formattedDate(job.createdAt)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span>
                              Apply by{" "}
                              {formatPreferredJoiningDate(
                                job.preferredJoiningDate
                              )}
                            </span>
                            <span className="font-bold mx-1 hidden md:inline-block">
                              •
                            </span>
                            <span className="hidden md:inline-block">
                              Posted {formattedDate(job.createdAt)}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex justify-between gap-2 w-auto">
                        <div className="flex min-w-auto gap-4 items-center">
                          <Button
                            onClick={() =>
                              (window.location.href = `/job-seekerDashboard/opportunities/${job._id}`)
                            }
                            className="text-black bg-white border-[1.6px] hover:bg-slate-200/70 cursor-pointer border-zinc-200"
                          >
                            View Details
                          </Button>

                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center">
                                  <Button
                                    disabled={alreadyApplied}
                                    className={`flex items-center gap-2 ${
                                      alreadyApplied
                                        ? "cursor-not-allowed opacity-50"
                                        : "hover:bg-blue-600"
                                    }`}
                                  >
                                    {alreadyApplied && (
                                      <Info
                                        className={`w-4 h-4 ${
                                          alreadyApplied
                                            ? "text-gray-200"
                                            : "text-white/70"
                                        }`}
                                      />
                                    )}
                                    <span>
                                      {alreadyApplied ? "Applied" : "Apply"}
                                    </span>
                                  </Button>
                                </div>
                              </TooltipTrigger>

                              <TooltipContent
                                side="top"
                                align="center"
                                className="max-w-[250px] text-center cursor-pointer select-none"
                              >
                                {alreadyApplied ? (
                                  <>
                                    You’ve already applied for this opportunity.
                                    <br />
                                    Check the current status under{" "}
                                    <strong>Applied Opportunities</strong>.
                                  </>
                                ) : (
                                  "Click to apply for this opportunity."
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="text-center py-8 text-gray-500">
            {/* 👈 Removed showSaved (unused) */}
            {searchTerm.trim().length >= 1
              ? "No results found."
              : "No jobs found."}
          </div>
        )
      )}
    </div>
  );
};

// 👈 New: Fallback component for Suspense
const PageFallback = () => <JobSkeleton count={3} />;

const Page = () => (
  <Suspense fallback={<PageFallback />}>
    <PageContent />
  </Suspense>
);

export default Page;
