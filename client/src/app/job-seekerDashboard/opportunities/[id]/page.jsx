"use client";
import API from "@/utils/interceptor";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import money from "@/assests/badge-indian-rupee.svg";
import duration from "@/assests/clock.svg";
import Clock from "@/assests/clock.svg";
import { Info, Share2 } from "lucide-react";
import { OpportunityFooter } from "@/components/userDashboard/OpportunitesFooter";
import JobDetailsSkeleton from "@/components/common/Skeleton/JobDetails";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useAuthStore from "@/store/authStore";

const page = () => {
  const { id } = useParams();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();
  const [savingId, setSavingId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleTooltipToggle = () => setOpen((prev) => !prev);
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

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await API.get(
          `/common/opportunity/getOpportunityDetail/${id}`
        );
        setOpportunity(res.data.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const formattedDate = (createdAt) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now - createdDate; // Difference in milliseconds

    const diffInSeconds = Math.floor(diffMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);

    if (diffInHours < 1) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d${diffInDays === 1 ? "w" : ""} ago`;
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks}w${diffInWeeks === 1 ? "w" : ""} ago`;
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

  function formatPreferredJoiningDate(dateString) {
    const [day, month, year] = dateString.split("-");
    if (dateString.includes("Immediate")) {
      return "Immediate Joiner";
    }
    return `Apply by  ${day} ${monthsMapper[month]} ${year}`;
  }

  const renderDescription = () => {
    const description = opportunity?.description || opportunity?.about;

    if (!description) return null;

    const sections = description.split(/<h2><strong>(.*?)<\/strong><\/h2>/);
    let meaningfulSections = [];

    for (let i = 1; i < sections.length; i += 2) {
      const heading = sections[i];
      const content = sections[i + 1] || "";

      const plainText = content
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, "")
        .trim();

      if (plainText) {
        meaningfulSections.push({ heading, content });
      }
    }

    if (meaningfulSections.length === 0) return null;

    return (
      <div className="space-y-6">
        {meaningfulSections.map((sec, idx) => (
          <div key={idx}>
            <h2 className="text-xl font-bold mb-3">
              {sec.heading.replace(/^#/, "")}
            </h2>
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: sec.content }}
            />
          </div>
        ))}
      </div>
    );
  };

  const desc = renderDescription();

  const handleApply = () => {
    if (!opportunity) return;
    const allSkills = [
      ...(opportunity.requiredSkills || []),
      ...(opportunity.optionalSkills || []),
    ];

    const skillParams = encodeURIComponent(JSON.stringify(allSkills));
    router.push(
      `/job-seekerDashboard/opportunities/${id}/match-skill?skills=${skillParams}`
    );
  };

  console.log("opportunity", opportunity);

  const alreadyApplied = opportunity?.applications.some(
    (application) => application.user === user.id
  );

  console.log(user.id);

  const handleSaveOpp = async (id, type) => {
    // 🔥 immediately toggle UI
    setIsSaved((prev) => !prev);

    try {
      const res = await API.post("/job-seeker/opportunity/save", {
        itemId: id,
        itemType: type,
      });

      // Update based on backend response if needed
      setIsSaved(res.data.saved);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error saving");

      // revert UI if failed
      setIsSaved((prev) => !prev);
    }
  };

  useEffect(() => {
    if (opportunity?.saved) {
      setIsSaved(opportunity.saved); // initialize local state
    }
  }, [opportunity]);

  return (
    <div className="px-4 py-8">
      {loading ? (
        <JobDetailsSkeleton />
      ) : opportunity ? (
        <div className="w-full">
          {/* Header section */}
          <div className="w-full relative py-4 px-3 rounded-lg border-[1.6px] border-zinc-200">
            {/* Badge section */}
            <div className="absolute -top-[18px] right-5 flex space-x-3">
              <span className="text-sm bg-gray-100 px-3 py-1 font-medium rounded-full border-[1.5px] border-zinc-300">
                {opportunity.location}
              </span>
              <span className="text-sm bg-gray-100 px-3 py-1 font-medium rounded-full border-[1.5px] border-zinc-300">
                {opportunity.type}
              </span>
            </div>

            {/* opportunity Title */}
            <div className="flex items-start gap-4 mt-2 mb-2">
              {" "}
              {/* Changed to items-start */}
              <Image
                src={opportunity.company.imagePath}
                alt={opportunity.company.name}
                width={48}
                height={48}
                className="h-12 w-12 object-contain rounded-full border border-gray-200"
              />
              <div className="flex-1 flex justify-between">
                {" "}
                {/* Added flex-1 and removed bg colors */}
                <div className="flex flex-col">
                  {" "}
                  {/* Changed to column layout */}
                  <div className="flex items-center gap-2">
                    {" "}
                    {/* Added gap for spacing */}
                    <h2 className="text-lg font-semibold">
                      {opportunity?.title || opportunity?.role}
                    </h2>
                  </div>
                  <div className="flex items-center">
                    <p className="text-base text-gray-400">
                      {opportunity?.company.name}
                    </p>
                    <p className="text-gray-400 text-lg mx-1">|</p>
                    <p className="text-base text-gray-400">
                      {opportunity?.company.headquarters}
                    </p>
                  </div>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  onClick={() =>
                    handleSaveOpp(opportunity._id, opportunity.type)
                  }
                  fill={isSaved ? "red" : "none"}
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke={isSaved ? "red" : "currentColor"}
                  className="w-5 h-5 md:inline-flex hidden cursor-pointer mt-0.5"
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
              {opportunity.requiredSkills.map((skill, indx) => (
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
                <div className=" text-gray-400 flex items-center gap-1 text-[15px] ">
                  <Image src={money} alt="Money" width={20} height={20} />{" "}
                  {opportunity.type === "Internship"
                    ? "Stipend per month"
                    : "Job Offer"}{" "}
                </div>
                <div className="font-medium">
                  ₹{" "}
                  {opportunity.type === "Internship"
                    ? `${formatStipend(
                        opportunity.stipend.min
                      )}k - ${formatStipend(opportunity.stipend.max)}k`
                    : `${opportunity.salaryRange.min}LPA - ${opportunity.salaryRange.max}LPA`}
                </div>
              </div>
              <div
                className={`${
                  opportunity.type == "Internship" ? null : "hidden"
                }`}
              >
                <div
                  className={`text-gray-400 flex items-center gap-1 text-[15px]`}
                >
                  <Image src={duration} alt="Duration" width={18} height={18} />{" "}
                  Duration
                </div>
                <div className="font-medium">
                  {" "}
                  {opportunity.duration} Months{" "}
                </div>
              </div>

              <div>
                <div
                  className={`text-gray-400 flex items-center gap-1 text-[15px]`}
                >
                  #Openings
                </div>
                <div className="font-medium">
                  {" "}
                  {opportunity?.nop || opportunity?.positionsAvailable}{" "}
                </div>
              </div>

              <div className={`${opportunity.type == "Job" ? null : "hidden"}`}>
                <div
                  className={`text-gray-400 flex items-center gap-1 text-[15px]`}
                >
                  Experience
                </div>
                <div className="font-medium">
                  {" "}
                  {opportunity?.experience} years{" "}
                </div>
              </div>

              <div>
                <div className="text-gray-400 flex items-center gap-1 text-[15px]">
                  Office Location
                </div>
                <div className="font-medium">
                  {" "}
                  {opportunity.company.headquarters}{" "}
                </div>
              </div>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-pointer inline-block">
                    <h1 className="text-lg font-bold">
                      Benchmark Score: {opportunity?.benchmarkScore}
                    </h1>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>
                    <p>
                      This benchmark score is used to filter out the applicants
                      who are below the {opportunity?.benchmarkScore} by taking
                      the average of required skills.
                    </p>
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Actions */}
            <div className="mt-3">
              <div className="flex flex-col lg:flex-row md:items-center md:justify-between gap-3">
                {/* Apply by / Posted part */}
                <div className="flex justify-between w-full md:w-auto text-blue-600 font-medium text-sm md:text-base relative">
                  {opportunity.preferredJoiningDate
                    .toLowerCase()
                    .includes("immediate") ? (
                    <div className="flex items-center gap-2 w-full relative">
                      {/* Info icon top-right */}
                      <TooltipProvider>
                        <Tooltip open={open} onOpenChange={setOpen}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={handleTooltipToggle}
                              className=" text-blue-600 hover:text-blue-800 cursor-pointer"
                            >
                              {alreadyApplied && <Info className="w-4 h-4" />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="start"
                            className="max-w-xs text-sm text-gray-700 bg-white border shadow-md"
                          >
                            This opportunity prefers candidates who can join
                            immediately or within a short notice period (0–30
                            days).
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span>Immediate Joiner Preferred</span>
                      <span className="font-bold mx-1 md:inline-block hidden">
                        •
                      </span>
                      <span className="hidden md:inline-block">
                        Posted {formattedDate(opportunity.createdAt)}
                      </span>
                      <span className="md:hidden visible bg-blue-50 px-3 py-[2px] rounded-full flex items-center gap-2">
                        <Image src={Clock} width={15} height={15} alt="" />{" "}
                        Posted {formattedDate(opportunity.createdAt)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <span>
                        {" "}
                        {formatPreferredJoiningDate(
                          opportunity.preferredJoiningDate
                        )}
                      </span>
                      <span className="font-bold mx-1 md:inline-block hidden">
                        •
                      </span>
                      <span className="hidden md:inline-block">
                        Posted {formattedDate(opportunity.createdAt)}
                      </span>
                      <span className="md:hidden visible bg-blue-50 px-3 py-[2px] rounded-full flex items-center gap-2">
                        <Image src={Clock} width={15} height={15} alt="" />{" "}
                        Posted {formattedDate(opportunity.createdAt)}
                      </span>
                    </>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex justify-between gap-2 w-auto">
                  <div className="flex gap-2 items-center md:hidden">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      stroke={isSaved ? "red" : "currentColor"}
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      onClick={() =>
                        handleSaveOpp(opportunity._id, opportunity.type)
                      }
                      fill={isSaved ? "red" : "none"}
                      className="w-5 h-5 text-gray-500 cursor-pointer mt-0.5" // Adjusted size and added small top margin
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                      />
                    </svg>

                    <Share2 className="text-gray-500 mt-1 w-[23px] h-[23px] " />
                  </div>

                  <div className="flex min-w-auto gap-4 items-center">
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
                                      ? "text-gray-200 hover:text-white"
                                      : "text-white/70"
                                  }`}
                                />
                              )}
                              <span>
                                {alreadyApplied ? " Applied" : "Apply Now"}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            <div className="lg:col-span-2 space-y-6">
              {/*left section - Description Card */}

              {desc ? (
                <div className="w-full relative py-5 px-4 rounded-lg border-[1.6px] border-zinc-200 bg-white">
                  {desc}
                </div>
              ) : (
                <p className="mb-6">No description available</p>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-6">
              {/* Skills - Mandatory */}
              <div className="w-full py-5 px-4 rounded-lg border-[1.6px] border-zinc-200 bg-white">
                <h1 className="text-lg">Skills - Mandatory</h1>
                <div className="flex flex-wrap gap-2">
                  {opportunity?.requiredSkills.map((skill, indx) => (
                    <span
                      key={indx}
                      className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Skills - Optional (if available) */}
                {opportunity?.optionalSkills?.length > 0 && (
                  <div className="mt-5">
                    Skills - Optional
                    <div className="flex flex-wrap gap-2">
                      {opportunity.optionalSkills.map((skill, indx) => (
                        <span
                          key={indx}
                          className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {opportunity?.preferences &&
                  Object.keys(opportunity?.preferences).length > 0 && (
                    <div className="mt-5">
                      Preferences
                      <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                        {Object.entries(opportunity?.preferences).map(
                          ([key, value]) =>
                            value !== "" &&
                            value !== null &&
                            value !== undefined ? (
                              <li key={key}>
                                <strong className="text-base">{key}:</strong>{" "}
                                {value}
                              </li>
                            ) : null
                        )}
                      </ul>
                    </div>
                  )}
              </div>

              {/* Benefits Section (if available) */}
              {(opportunity?.extBenefits?.length > 0 ||
                opportunity?.benefits?.length > 0) && (
                <div className="w-full py-5 px-4 rounded-lg border-[1.6px] border-zinc-200 bg-white">
                  <h1 className="text-lg mb-3">Perks & Benefits</h1>
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                    {opportunity?.extBenefits?.map((benefit, i) => (
                      <li key={`ext-${i}`}>{benefit}</li>
                    ))}
                    {opportunity?.benefits?.map((benefit, i) => (
                      <li key={`benefit-${i}`}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>No data found</div>
      )}

      <OpportunityFooter
        nextBtn="Apply Now"
        onApply={handleApply} // ✅ pass your handler
        goBack={() => router.back()}
        loading={false}
        disabled={opportunity?.applications.some(
          (application) => application.user === user.id
        )}
      />
    </div>
  );
};

export default page;
