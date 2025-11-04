"use client";
import FilterModal from "@/components/recruiterDashboard/ManagePosting/FilterModal";
import JobModalForm from "@/components/recruiterDashboard/ManagePosting/JobModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useFilterModal } from "@/store/recruiter/filtermodal";
import useJobFormStore from "@/store/recruiter/JobModal";
import API from "@/utils/interceptor";
import { Plus, Filter, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import empty from "@/assests/undraw_no-data_ig65.svg";
import Image from "next/image";
import { toast } from "sonner";
import JobSkeleton from "@/components/common/Skeleton/JobSkeleton";
import ButtonLoader from "@/utils/Loader";
import { IoMdClose } from "react-icons/io";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { isOpen } = useFilterModal();
  const { isOpen: isjobFormOpen } = useJobFormStore();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [changeStModal, setChangeStModal] = useState(false);

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
  }, [isjobFormOpen]);

  const formattedDate = (string) => {
    const dateObj = new Date(string);
    const formattedDate = `${dateObj.getDate().toString().padStart(2, "0")}-${(
      dateObj.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${dateObj.getFullYear()}`;
    return formattedDate;
  };

  // 🗑️ Delete Posting
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await API.delete(`/recruiter/managePosting/${id}`);
      setJobs((prev) => prev.filter((job) => job._id !== id));
      toast.success("Posting deleted successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  console.log(jobs);

  return (
    <div className="md:p-6 p-4 space-y-6 relative">
      {changeStModal && (
        <ChangeModal
          open={changeStModal}
          setOpen={() => setChangeStModal(false)}
        />
      )}

      {/* Top Controls */}
      {isOpen && <FilterModal />}
      {isjobFormOpen && <JobModalForm />}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <Input
          placeholder="Search by job title..."
          className="w-full lg:max-w-md border border-gray-300"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Filter + Create Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => useFilterModal.getState().openModal()}
            variant="outline"
            className="gap-2 cursor-pointer"
          >
            <Filter size={16} />
            Filter
          </Button>
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
          {jobs
            .filter((job) =>
              job.role?.toLowerCase().includes(search.toLowerCase())
            )
            .map((job) => {
              // 🧩 Define menu items for this specific job here
              const menuItems = [
                {
                  label: "View Details",
                  action: () =>
                    router.push(
                      `/recruiterDashboard/managePosting&applicants/${job._id}/getDetails`
                    ),
                },
                {
                  label: "Manage Applicants",
                  action: () =>
                    router.push(
                      `/recruiterDashboard/managePosting&applicants/${job._id}`
                    ),
                },
                {
                  label: "Change Status",
                  action: () => setChangeStModal(true),
                },
              ];

              return (
                <div
                  key={job._id}
                  onClick={() => {
                    router.push(
                      `/recruiterDashboard/managePosting&applicants/${job._id}`
                    );
                  }}
                  className="relative border border-gray-200 bg-white px-5 py-8 rounded-xl shadow-sm w-full md:max-w-72"
                >
                  {/* Status Badge top-right */}
                  <span
                    className={`absolute top-0 right-[74px] transform translate-x-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium rounded-full border ${
                      job.status === "Active"
                        ? "bg-green-100 text-green-600 border-green-600"
                        : "bg-red-100 text-red-600 border-red-600"
                    }`}
                  >
                    {job.status}
                  </span>

                  {/* Three-dot Menu */}
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

                        <Separator className="my-1" />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="w-full text-left text-red-600 px-2 py-1.5 text-sm hover:bg-red-50 rounded-md flex items-center gap-1">
                              Delete
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Posting?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. It will
                                permanently delete this posting and remove it
                                from your dashboard.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(job._id)}
                                className="bg-red-600 hover:bg-red-700 flex items-center gap-1"
                              >
                                {loading && <ButtonLoader />} Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

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
            alt=""
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

const ChangeModal = ({ open, setOpen }) => {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, []);
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black/50 backdrop-blur-md flex items-center justify-center z-[999] ">
      <div className="bg-white w-1/2 h-1/2 px-3 py-3 rounded-lg relative">
        <IoMdClose
          className="absolute right-3 cursor-pointer top-3 w-6 h-6"
          onClick={() => setOpen()}
        />
        <h1 className="text-xl font-semibold text-center mt-4">
          Change Status
        </h1>
      </div>
    </div>
  );
};
