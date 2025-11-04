"use client";
import { Input } from "@/components/ui/input";
import SearchTypingAnimation from "@/components/common/SearchTypingAnimation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Filter,
  ChevronDown,
  Calendar,
  User,
  SortAsc,
  CheckSquare,
  Square,
  X,
  MoreVertical,
} from "lucide-react";
import API from "@/utils/interceptor";
import { toast } from "sonner";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import ApplicantSkeleton from "@/components/common/Skeleton/AllApplicants";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import ButtonLoader from "@/utils/Loader";
import API2 from "@/utils/interceptor2";
import FilterApplicantModal from "@/components/recruiterDashboard/ManagePosting/FilterApplicantModal";

export default function Page() {
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const { id } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState("recent");
  const [actionLoading, setActionLoading] = useState({
    ats: {
      loading: false,
      text: "",
    },
    search: false,
    filter: false,
  });
  const [opporDet, setOpporDet] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedApplicants, setSelectedApplicants] = useState(new Set());
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterModal, setFilterModal] = useState(false);

  // ✅ Check for mobile screen size
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    setIsMobile(mediaQuery.matches);

    const handler = (e) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // ✅ Initialize sortType from URL params
  useEffect(() => {
    const urlSortType = searchParams.get("sort_by") || "recent";
    setSortType(urlSortType);
  }, [searchParams]);

  // ✅ Update URL params when sortType changes
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (sortType) {
      newSearchParams.set("sort_by", sortType);
    } else {
      newSearchParams.delete("sort_by");
    }
    router.replace(`?${newSearchParams.toString()}`);
  }, [sortType, searchParams, router]);

  // ✅ Fetch applicants
  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        setLoading(true);
        const res = await API.get(
          `/recruiter/managePosting/getallApplicants/${id}`
        );
        if (res.data.success) {
          setApplicants(res.data.applicants);

          const resp2 = await API.get(
            `/common/opportunity/getOpportunityDetail/${id}`
          );
          setOpporDet(resp2.data.data);
        } else {
          toast.warning(res.data.message || "Failed to fetch applicants");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchApplicants();
  }, [id]);

  // ✅ Format appliedAt date
  function formatAppliedAt(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  // ✅ Clear filters and sort
  const handleClear = () => {
    setSearch("");
    setSortType("recent");
    // If filters were implemented, reset them here
    toast.success("Filters and sort cleared");
  };

  // ✅ Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev);
    if (!isSelectionMode) {
      // Entering mode, reset selections
      setSelectedApplicants(new Set());
    } else {
      // Exiting mode, but don't reset selections if applying
    }
  };

  // ✅ Toggle individual applicant selection
  const toggleApplicant = (applicantId) => {
    setSelectedApplicants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(applicantId)) {
        newSet.delete(applicantId);
      } else {
        newSet.add(applicantId);
      }
      return newSet;
    });
  };

  // ✅ Get selected count
  const selectedCount = selectedApplicants.size;

  // ✅ Sorting logic
  const sortedApplicants = [...applicants].sort((a, b) => {
    if (sortType === "name-asc") {
      return a.user?.name?.localeCompare(b.user?.name);
    } else if (sortType === "name-desc") {
      return b.user?.name?.localeCompare(a.user?.name);
    } else if (sortType === "recent") {
      return new Date(b.appliedAt) - new Date(a.appliedAt);
    } else if (sortType === "oldest") {
      return new Date(a.appliedAt) - new Date(b.appliedAt);
    }
    return 0;
  });

  const handleATSScores = async (applyToAll = false) => {
    try {
      if (!opporDet) {
        toast.warning("Opportunity details not loaded");
        return;
      }

      // Determine which applicants to process
      let applicantIds = [];
      if (applyToAll) {
        applicantIds = applicants.map((a) => a._id);
      } else {
        if (selectedCount === 0) {
          toast.warning("Please select at least one applicant");
          return;
        }
        applicantIds = Array.from(selectedApplicants);
      }

      // Step 1: Fetch resumes for selected applicants
      setActionLoading((prev) => ({
        ...prev,
        ats: { loading: true, text: "Fetching resumes..." },
      }));

      const resp = await API.post(`/recruiter/ats/getResumes/${id}`, {
        applicantIds,
      });

      if (!resp.data.success) {
        toast.warning(resp.data.message || "Failed to fetch resumes");
        return;
      }

      const rawUsers = resp.data.applicants;
      if (!rawUsers.length) {
        toast.warning("No resumes found for selected applicants");
        return;
      }

      // Step 2: Prepare job details for scoring
      setActionLoading((prev) => ({
        ...prev,
        ats: { loading: true, text: "Scoring resumes..." },
      }));

      const isJob = opporDet.nop !== undefined;
      const jobDetails = {
        job_title: opporDet.role || "",
        job_description: isJob
          ? opporDet.description || ""
          : opporDet.about || "",
        requirements: isJob ? [opporDet.experience || ""] : [],
        required_skills: opporDet.requiredSkills || [],
        optional_skills: opporDet.optionalSkills || [],
        required_education: "",
        required_experience: isJob ? opporDet.experience || "" : "",
      };

      // Step 3: Prepare all applicant data for scoring
      const applicantsPayload = rawUsers.map((a) => ({
        id: a._id, // ✅ your backend expects this
        base64_data: a.resume?.data || "",
        file_type: a.resume?.contentType === "application/pdf" ? "pdf" : "docx",
      }));

      const scoreResp = await API2.post("/score_resumes", {
        job_details: jobDetails,
        resumes: applicantsPayload, // ✅ correct key name
        opporType: resp.data.opporType,
      });

      if (!scoreResp.data.success) {
        toast.error("Failed to score resumes");
        return;
      }

      const scores = scoreResp.data.scores || [];

      // Step 5: Update applicants state with received scores
      console.log(scoreResp);

      toast.success(`ATS scoring completed for ${scores.length} applicant(s)`);

      // Step 6: Reset selection mode
      if (!applyToAll) {
        setIsSelectionMode(false);
        setSelectedApplicants(new Set());
      }
    } catch (err) {
      console.error("ATS scoring error:", err);
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        ats: { loading: false, text: "" },
      }));
    }
  };

  const handleApplyToAll = () => {
    handleATSScores(true);
  };

  const handleApplyToSelected = () => {
    if (isSelectionMode) {
      handleATSScores(false);
    } else {
      toggleSelectionMode();
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedApplicants(new Set());
  };

  return (
    <div className="md:p-6 p-4 space-y-6">
      {filterModal && (
        <FilterApplicantModal
          isOpen={filterModal}
          closeModal={() => setFilterModal(false)}
        />
      )}
      <h1 className="text-lg font-semibold">All Applicants</h1>

      {/* 🔹 Top Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* 🔸 Search Input */}
        <div className="relative w-full md:max-w-md">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder=""
            className="w-full pr-3 pl-10 border border-gray-300 text-base"
          />
          {search === "" && (
            <span className="absolute text-base left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <SearchTypingAnimation
                words={[
                  "Search by applicant's name",
                  "Search by benchmarkScore",
                  "Search by appliedAt date",
                ]}
                typingSpeed={100}
                deletingSpeed={80}
                pauseTime={1500}
              />
            </span>
          )}
        </div>

        {/* 🔸 Buttons */}
        <div className="flex gap-3 flex-wrap items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SortAsc size={16} />
                Sort By <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side={isMobile ? "bottom" : "bottom"}
              className="w-44"
            >
              <DropdownMenuLabel>Sort Applicants</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSortType("recent")}
                className={
                  sortType === "recent" ? "font-semibold text-blue-600" : ""
                }
              >
                <Calendar className="mr-2 h-4 w-4" />
                Most Recent
                {sortType === "recent" && (
                  <CheckSquare className="ml-auto h-4 w-4 text-blue-600" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortType("oldest")}
                className={
                  sortType === "oldest" ? "font-semibold text-blue-600" : ""
                }
              >
                <Calendar className="mr-2 h-4 w-4" />
                Oldest First
                {sortType === "oldest" && (
                  <CheckSquare className="ml-auto h-4 w-4 text-blue-600" />
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSortType("name-asc")}
                className={
                  sortType === "name-asc" ? "font-semibold text-blue-600" : ""
                }
              >
                <User className="mr-2 h-4 w-4" />
                Name (A–Z)
                {sortType === "name-asc" && (
                  <CheckSquare className="ml-auto h-4 w-4 text-blue-600" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortType("name-desc")}
                className={
                  sortType === "name-desc" ? "font-semibold text-blue-600" : ""
                }
              >
                <User className="mr-2 h-4 w-4" />
                Name (Z–A)
                {sortType === "name-desc" && (
                  <CheckSquare className="ml-auto h-4 w-4 text-blue-600" />
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={sortType !== "recent" ? handleClear : undefined}
                disabled={sortType === "recent"}
                className={
                  sortType !== "recent"
                    ? "font-semibold text-blue-600 cursor-pointer"
                    : "text-gray-400 cursor-not-allowed"
                }
              >
                <X className="mr-2 h-4 w-4" />
                Clear
                {sortType !== "recent" && (
                  <CheckSquare className="ml-auto h-4 w-4 text-blue-600" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => setFilterModal(true)}
            variant="outline"
            className="gap-2 cursor-pointer"
          >
            <Filter size={16} />
            Filter
          </Button>
        </div>
      </div>

      {/* 🔹 Applicants List or Skeleton */}
      {loading ? (
        <ApplicantSkeleton count={6} />
      ) : (
        <div className="border-[1.6px] rounded-lg bg-zinc-100 border-zinc-200 ">
          <div className="bg-white rounded-lg py-2 mb-4 px-4 border-b-[1.6px] border-zinc-200 flex items-center justify-between">
            <h1 className="font-semibold">All Participants</h1>
            <div className="flex items-center gap-2">
              {isSelectionMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelSelection}
                  className="border-[1.6px] border-zinc-200"
                >
                  Cancel
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  disabled={actionLoading.ats.loading}
                >
                  <Button
                    disabled={actionLoading.ats.loading}
                    className="border-[1.6px] bg-zinc-600/90 border-zinc-200 gap-2"
                  >
                    {actionLoading.ats.loading ? (
                      <>
                        <ButtonLoader color="white" />
                        {actionLoading.ats.text || "Getting resumes..."}
                      </>
                    ) : isSelectionMode ? (
                      `Apply Selected (${selectedCount})`
                    ) : (
                      <>
                        Apply ATS <ChevronDown size={16} />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleApplyToAll}
                    disabled={actionLoading.ats.loading || isSelectionMode}
                  >
                    Apply To All
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleApplyToSelected}
                    disabled={actionLoading.ats.loading}
                  >
                    {isSelectionMode ? "Apply Selected" : "Select & Apply"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-wrap mt-10 gap-4">
            {sortedApplicants.length > 0 ? (
              sortedApplicants
                .filter((appl) =>
                  appl.user?.name
                    ?.toLowerCase()
                    .includes(search.toLowerCase().trim())
                )
                .map((appl) => (
                  <div
                    key={appl._id}
                    onClick={() =>
                      router.push(
                        `/recruiterDashboard/managePosting&applicants/${id}/aplId=${appl.user._id}`
                      )
                    }
                    className="border-[1.6px] cursor-pointer md:max-w-72 w-full flex items-center rounded-lg border-zinc-200 bg-white p-3 relative"
                  >
                    {/* Three-dot dropdown (top-right corner) */}
                    <div className="absolute border-[1.6px] border-zinc-200 rounded-full bg-white -top-4 cursor-pointer right-2 z-20">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()} // prevent card click
                            className="p-1 rounded-full hover:bg-zinc-100"
                          >
                            <MoreVertical className="h-4 w-4 text-zinc-600" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/recruiterDashboard/managePosting&applicants/${id}/aplId=${appl.user._id}`
                              );
                            }}
                          >
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Add shortlist logic here
                            }}
                          >
                            Shortlist Applicant
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Add shortlist logic here
                            }}
                          >
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Add reject logic here
                            }}
                          >
                            Reject Applicant
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Selection Checkbox (if selection mode active) */}
                    {isSelectionMode && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleApplicant(appl._id);
                          }}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          {selectedApplicants.has(appl._id) ? (
                            <CheckSquare size={20} className="text-green-600" />
                          ) : (
                            <Square size={20} className="text-gray-400" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Applicant Image */}
                    <div
                      className={`w-14 overflow-hidden relative border-[1.6px] border-zinc-200 h-14 rounded-full ${
                        isSelectionMode ? "ml-8" : ""
                      }`}
                    >
                      <Image
                        src={
                          appl.user?.image?.data ||
                          "/default-profile.png" /* fallback */
                        }
                        className="object-cover"
                        sizes="64px"
                        fill
                        alt="Applicant Profile"
                      />
                    </div>

                    {/* Applicant Info */}
                    <div
                      className={`flex flex-col ml-3 ${
                        isSelectionMode ? "ml-2" : ""
                      }`}
                    >
                      <h1 className="font-medium">{appl.user?.name}</h1>
                      <h1 className="text-sm text-zinc-600">
                        <span className="font-semibold">Applied At:</span>{" "}
                        {formatAppliedAt(appl.appliedAt)}
                      </h1>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-gray-500 w-full py-8">
                No applicants found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
