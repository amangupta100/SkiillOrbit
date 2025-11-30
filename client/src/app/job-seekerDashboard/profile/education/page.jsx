"use client";

import React, { useEffect, useState } from "react";
import API from "@/utils/interceptor";
import { toast } from "sonner";
import { IoAddOutline } from "react-icons/io5";
import { MdOutlineEdit } from "react-icons/md";
import { X } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import ButtonLoader from "@/utils/Loader";

// ===== Skeleton Loader =====
const EducationSkeleton = () => (
  <div className="border-[1.6px] border-gray-300 rounded-lg p-4 animate-pulse">
    <div className="h-5 w-40 bg-gray-300 rounded mb-4"></div>
    <div className="h-4 w-56 bg-gray-200 rounded mb-2"></div>
    <div className="h-4 w-36 bg-gray-200 rounded"></div>
  </div>
);

const page = () => {
  const [loading, setLoading] = useState(false);
  const [educations, setEducations] = useState([]);

  // Modal
  const [showModal, setShowModal] = useState(false);

  // Mode: "add" | "edit"
  const [mode, setMode] = useState("add");

  // Current Editable Object
  const [currentEdu, setCurrentEdu] = useState({
    institution: "",
    degree: "",
    startDate: "",
    endDate: "",
    attachments: { type: "link", url: "" },
  });
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchSearchResults = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);

      const res = await API.get(
        `/job-seeker/profile/getPlaces?q=${encodeURIComponent(query)}`
      );

      // const data = await res.json();

      setSearchResults(res.data.data.search_result || []); // API returns { data: [...] }
    } catch (err) {
      console.log(err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchSearchResults(searchText);
    }, 400);

    return () => clearTimeout(delay);
  }, [searchText]);

  const [saving, setSaving] = useState(false);

  // ========= Fetch All Educations =========
  const fetchEducations = async () => {
    setLoading(true);
    try {
      const res = await API.get("/job-seeker/profile/getEducations");
      if (res.data.success) {
        setEducations(res.data.data);
      } else {
        toast.error("Could not load education details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch education");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducations();
  }, [showModal]);

  // ========= Add Modal =========
  const openAddModal = () => {
    setMode("add");
    setCurrentEdu({
      institution: "",
      degree: "",
      startDate: "",
      endDate: "",
      attachments: { type: "link", url: "" },
    });
    setShowModal(true);
  };

  // ========= Edit Modal =========
  const openEditModal = (edu) => {
    setMode("edit");
    setCurrentEdu(edu);
    setShowModal(true);
  };

  // ========= Close Modal =========
  const closeModal = () => {
    setShowModal(false);
    setCurrentEdu(null);
  };

  // ========= Create or Update Education =========
  const handleSaveEducation = async () => {
    try {
      setSaving(true);

      if (mode === "add") {
        // --- CREATE ---
        const res = await API.post(
          "/job-seeker/profile/createEducation",
          currentEdu
        );

        if (res.data.success) {
          toast.success("Education added successfully");
        }
      } else {
        // --- UPDATE ---
        const res = await API.put(
          `/job-seeker/profile/education/update/${currentEdu._id}`,
          currentEdu
        );

        if (res.data.success) {
          toast.success("Education updated successfully");
        }
      }

      closeModal();
      fetchEducations();
    } catch (err) {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <h1 className="font-semibold text-2xl">Education</h1>

        {/* ADD BUTTON → opens modal*/}
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
        >
          <IoAddOutline className="text-xl" />
          <h1 className="text-center">Add Education</h1>
        </button>
      </div>

      {/* ===== Skeleton Loading ===== */}
      {loading ? (
        <div className="flex flex-col gap-4">
          <EducationSkeleton />
          <EducationSkeleton />
        </div>
      ) : educations.length === 0 ? (
        <p className="text-gray-600">No education records found.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {educations.map((edu, index) => (
            <div
              key={index}
              className="border-[1.6px] border-gray-300 rounded-lg p-4 relative"
            >
              {/* Edit Button */}
              <button
                onClick={() => openEditModal(edu)}
                className="absolute top-3 right-3 p-2 hover:bg-gray-200 rounded-full transition-all"
              >
                <MdOutlineEdit className="text-xl" />
              </button>

              <h2 className="font-semibold text-lg">{edu.institution}</h2>
              <p className="text-gray-700 mt-1">{edu.degree}</p>

              {edu.startDate && edu.endDate && (
                <p className="text-gray-600 mt-2 text-sm">
                  {format(new Date(edu.startDate), "dd-MM-yyyy")} -{" "}
                  {format(new Date(edu.endDate), "dd-MM-yyyy")}
                </p>
              )}

              {edu?.attachments?.url && (
                <a
                  href={edu.attachments.url}
                  target="_blank"
                  className="text-blue-600 text-sm underline mt-2 block"
                >
                  Visit Attachment
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================================
          MODAL (ADD + EDIT)
      ================================ */}
      {showModal && currentEdu && (
        <div className="fixed inset-0 items-center z-[1000] flex justify-center h-screen overflow-y-auto py-8 backdrop-blur-md bg-black/60">
          <div className="w-[90%] sm:w-[75%] md:w-[60%] lg:w-[35%] rounded-lg relative max-h-fit py-6 px-5 bg-white overflow-y-auto">
            <X
              onClick={closeModal}
              className="absolute top-2 right-2 cursor-pointer"
            />

            <h2 className="text-xl font-semibold mb-4">
              {mode === "add" ? "Add Education" : "Edit Education"}
            </h2>

            {/* Institution */}
            <label className="text-sm font-medium">Institution</label>
            <input
              type="text"
              value={currentEdu.institution}
              onChange={(e) =>
                setCurrentEdu({ ...currentEdu, institution: e.target.value })
              }
              className="w-full border rounded p-2 mt-1 mb-3"
            />

            {/* Degree */}
            <label className="text-sm font-medium">Degree</label>
            <input
              type="text"
              value={currentEdu.degree}
              onChange={(e) =>
                setCurrentEdu({ ...currentEdu, degree: e.target.value })
              }
              className="w-full border rounded p-2 mt-1 mb-3"
            />

            {/* Years */}
            <div className="flex gap-4">
              {/* Start Date */}
              <div className="w-1/2">
                <label className="text-sm font-medium">Start Date</label>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full border rounded p-2 mt-1 mb-3 text-left">
                      {currentEdu.startDate
                        ? format(new Date(currentEdu.startDate), "dd-MM-yyyy")
                        : "Select start date"}
                    </button>
                  </PopoverTrigger>

                  <PopoverContent className="p-0 z-[1001]">
                    <Calendar
                      mode="single"
                      selected={
                        currentEdu.startDate
                          ? new Date(currentEdu.startDate)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (!date) return;
                        setCurrentEdu({
                          ...currentEdu,
                          startDate: date.toISOString(),
                        });
                      }}
                      captionLayout="dropdown"
                      fromYear={1970}
                      toYear={new Date().getFullYear() + 2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="w-1/2">
                <label className="text-sm font-medium">End Date</label>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full border rounded p-2 mt-1 mb-3 text-left">
                      {currentEdu.endDate
                        ? format(new Date(currentEdu.endDate), "dd-MM-yyyy")
                        : "Select end date"}
                    </button>
                  </PopoverTrigger>

                  <PopoverContent className="p-0 z-[1001]">
                    <Calendar
                      mode="single"
                      selected={
                        currentEdu.endDate
                          ? new Date(currentEdu.endDate)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (!date) return;
                        setCurrentEdu({
                          ...currentEdu,
                          endDate: date.toISOString(),
                        });
                      }}
                      captionLayout="dropdown"
                      fromYear={1970}
                      toYear={new Date().getFullYear() + 10}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Attachment */}
            <label className="text-sm font-medium">Attachment URL</label>
            <input
              type="text"
              value={currentEdu.attachments?.url || ""}
              onChange={(e) =>
                setCurrentEdu({
                  ...currentEdu,
                  attachments: { type: "link", url: e.target.value },
                })
              }
              className="w-full border rounded p-2 mt-1 mb-4"
            />

            <button
              onClick={handleSaveEducation}
              className="w-full flex gap-1 justify-center items-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all"
            >
              {saving ? (
                <>
                  <ButtonLoader color="white" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{mode === "add" ? "Add Education" : "Save Changes"}</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default page;
