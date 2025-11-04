"use client";
import React, { useEffect, useState } from "react";
import API from "@/utils/interceptor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Share2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import money from "@/assests/badge-indian-rupee.svg";
import duration from "@/assests/clock.svg";
import { useRouter } from "next/navigation";
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

const Page = () => {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
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
  const router = useRouter();
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const { user } = useAuthStore();

  function formatPreferredJoiningDate(dateString) {
    const [day, month, year] = dateString.split("-");
    return `${day} ${monthsMapper[month]} ${year}`;
  }

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await API.get(
          "/job-seeker/opportunity/getallOpportunities"
        );
        setJobs(res.data.postings);
      } catch (err) {
        toast.warning(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

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

  console.log(jobs);

  return (
    <div className="sm:p-6 p-3 relative">
      <JobSeekerFilterModal
        isOpen={openFilterModal}
        closeModal={() => setOpenFilterModal(false)}
      />
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search Input */}
        <Input
          placeholder="Search by job title..."
          className="w-full lg:max-w-md border border-gray-300"
        />

        {/* Filter + Create Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => setOpenFilterModal(true)}
            variant="outline"
            className="gap-2 cursor-pointer"
          >
            <Filter size={16} />
            Filter
          </Button>
        </div>
      </div>

      {loading ? (
        <JobSkeleton count={3} />
      ) : (
        jobs &&
        jobs.length > 0 && (
          <div className="flex flex-wrap gap-8 py-8">
            {jobs.map((job) => {
              const alreadyApplied = job.applications?.some(
                (application) => application.user === user.id
              );

              return (
                <div
                  key={job._id}
                  className={`${
                    job.status === "Active" ? "bg-white" : "bg-black/10"
                  } rounded-xl border border-gray-200 p-4 shadow-sm w-full mx-auto relative`}
                >
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
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-5 h-5 md:inline-flex  cursor-pointer mt-0.5"
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
                    {job.requiredSkills.map((skill, indx) => (
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

                  {/* Actions */}
                  <div className="mt-3">
                    <div className="flex flex-col lg:flex-row md:items-center md:justify-between gap-3">
                      {/* Posted / Apply by */}
                      <div className="flex-col flex lg:flex-row justify-between w-full md:w-auto text-blue-600 font-medium text-sm md:text-base relative">
                        {job.preferredJoiningDate
                          .toLowerCase()
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

                      {/* Buttons */}
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
        )
      )}
    </div>
  );
};

export default Page;
