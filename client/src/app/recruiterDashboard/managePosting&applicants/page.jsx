"use client";
import JobModalForm from "@/components/recruiterDashboard/ManagePosting/JobModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import useJobFormStore from "@/store/recruiter/JobModal";
import API from "@/utils/interceptor";
import { Plus, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import empty from "@/assests/undraw_no-data_ig65.svg";
import Image from "next/image";
import { toast } from "sonner";
import JobSkeleton from "@/components/common/Skeleton/JobSkeleton";
import { Separator } from "@/components/ui/separator";
import { Info, Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import ChangeStatusModal from "@/components/recruiterDashboard/ManagePosting/ChangeStatusModal";

export default function Page() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("mostRecent");
  const router = useRouter();
  const { isOpen: isjobFormOpen } = useJobFormStore();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [changeStModal, setChangeStModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const sortOptions = [
    { value: "mostRecent", label: "Most Recent" },
    { value: "oldest", label: "Oldest First" },
    { value: "titleAZ", label: "Title A-Z" },
    { value: "titleZA", label: "Title Z-A" },
  ];

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await API.get(
          "/recruiter/managePosting/getallPosting"
        );
        const { success, jobs } = response.data;
        if (success) {
          setJobs(jobs);
        }
      } catch (err) {
        toast.warning(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [isjobFormOpen, changeStModal]);

  const formattedDate = (string) => {
    const dateObj = new Date(string);
    return `${dateObj.getDate().toString().padStart(2, "0")}-${(
      dateObj.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${dateObj.getFullYear()}`;
  };

  const getSortedJobs = (jobsToSort) => {
    return jobsToSort.sort((a, b) => {
      const titleA = a.role || a.title || "";
      const titleB = b.role || b.title || "";
      if (sortBy === "mostRecent") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === "titleAZ") {
        return titleA.localeCompare(titleB);
      }
      if (sortBy === "titleZA") {
        return titleB.localeCompare(titleA);
      }
      return 0; // Default no sort
    });
  };

  const currentSortLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label || "Most Recent";

  const filteredAndSortedJobs = getSortedJobs(
    jobs.filter((job) => job.role?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="md:p-6 p-4 space-y-6 relative">
      {changeStModal && (
        <ChangeStatusModal
          open={changeStModal}
          setOpen={() => setChangeStModal(false)}
          opportunityId={selectedJobId}
        />
      )}
      {isjobFormOpen && <JobModalForm />}

      {/* Top Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <Input
          placeholder="Search by job title..."
          className="w-full lg:max-w-md border border-gray-300"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-3 flex-wrap items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Sort by: {currentSortLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="gap-2 cursor-pointer"
            onClick={() => useJobFormStore.getState().openModal()}
          >
            <Plus size={16} />
            Create New Opening
          </Button>
        </div>
      </div>

      {/* Job Postings List */}
      {loading ? (
        <JobSkeleton count={7} />
      ) : jobs && jobs.length > 0 ? (
        <div className="flex flex-wrap gap-8 py-4">
          {filteredAndSortedJobs.map((job) => {
            const isClosed = job.status === "Closed";

            const menuItems = [
              {
                label: "View Details",
                action: () =>
                  router.push(
                    `/recruiterDashboard/managePosting&applicants/${job._id}`
                  ),
              },
              {
                label: "Manage Applicants",
                action: () =>
                  router.push(
                    `/recruiterDashboard/managePosting&applicants/manageApplicants/${job._id}`
                  ),
              },
              {
                label: "Change Status",
                action: () => {
                  setSelectedJobId(job._id);
                  setChangeStModal(true);
                },
              },
            ];

            return (
              <div
                key={job._id}
                className={`relative border border-gray-200 bg-white px-5 py-8 min-h-48 rounded-xl shadow-sm w-full lg:max-w-80 transition-all duration-200 ${
                  isClosed ? "opacity-60 pointer-events-none select-none" : ""
                }`}
              >
                {/* Overlay Lock Icon for Closed */}
                {isClosed && (
                  <div className="absolute inset-0 bg-white/85 rounded-xl z-10 pointer-events-none">
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
                              `/recruiterDashboard/managePosting&applicants/${job._id}`
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
                    {" "}
                    {/* Status Badge */}
                    <span
                      className={`absolute top-0 right-[74px] transform translate-x-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium rounded-full border ${
                        job.status === "Active"
                          ? "bg-green-100 text-green-600 border-green-600"
                          : "bg-red-100 text-red-600 border-red-600"
                      }`}
                    >
                      {job.status}
                    </span>
                    {/* Dropdown Menu */}
                    <div className="absolute cursor-pointer top-0 right-1 bg-gray-100 border-[1.6px] border-zinc-200 rounded-full p-1 transform -translate-y-1/2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded-full hover:bg-gray-100">
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44 shadow-md border border-zinc-100 rounded-md bg-white"
                        >
                          {menuItems.map((item, idx) => (
                            <div key={idx}>
                              <DropdownMenuItem
                                onClick={item.action}
                                className="cursor-pointer hover:bg-gray-50"
                              >
                                {item.label}
                              </DropdownMenuItem>
                              {idx < menuItems.length - 1 && (
                                <Separator className="my-1" />
                              )}
                            </div>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                )}

                {/* Job details */}
                <span className="absolute top-4 left-5 bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                  {job?.type}
                </span>
                <h3 className="mt-6 text-lg font-semibold">
                  {job?.role || job?.title}
                </h3>
                <p className="text-sm text-gray-500 mt-3">
                  Posted: {formattedDate(job?.createdAt)}
                </p>
                <p className="text-sm">
                  Applicants: {job?.applications?.length}
                </p>
                <p className="text-sm">
                  Benchmark Score: {job?.benchmarkScore}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="w-full min-h-[calc(100vh-11rem)] flex flex-col items-center justify-center">
          <Image
            src={empty}
            alt="Empty"
            width={200}
            height={180}
            className="lg:w-[20%] md:w-[35%]"
          />
          <h1 className="mt-4 text-lg">No postings found!</h1>
        </div>
      )}
    </div>
  );
}
