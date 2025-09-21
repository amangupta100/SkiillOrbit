"use client";
import API from "@/utils/interceptor";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CameraIcon, Edit, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FaFilePdf, FaFileWord, FaFile } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { Button } from "@/components/lightswind/button";
import { ImageUpload } from "@/components/common/ImageUpload"; // Import your ImageUpload component
import { FileUpload } from "@/components/ui/file-upload";
import { IoAddOutline } from "react-icons/io5";
import { MdOutlineEdit } from "react-icons/md";
import { DashboardSkeleton } from "@/components/common/Skeleton/UserDashbNetRec";
import ProfileSkeleton from "@/components/common/Skeleton/User/ProfilePage";
import MediaPreviewModal from "@/components/userDashboard/profile/projectModal/MediaPreviewModal";
import useAuthStore from "@/store/authStore";

const PdfIcon = FaFilePdf;
const WordIcon = FaFileWord;
const FileIcon = FaFile;

const page = () => {
  const [userDet, setUserDet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const dropdownRef = useRef(null);
  const [resumeUploadModal, setResumeUploadModal] = useState(false);
  const [skillsModal, setSkillsModal] = useState(false);
  const [projects, setProjects] = useState(null);
  const [previewProjectMediaModal, setPreviewModal] = useState(false);
  const [previewProject, setpreviewProject] = useState(null);
  const { checkAuth } = useAuthStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const req = await API.get("/job-seeker/profile/getUserDet");
        const req2 = await API.get("/job-seeker/profile/getProjects");
        checkAuth();
        setProjects(req2.data.projects);
        setUserDet(req.data.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [showImageUpload, resumeUploadModal]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  function formatFileSize(bytes) {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  const handleResumeClick = () => {
    if (userDet?.resume?.data) {
      const blob = new Blob([new Uint8Array(userDet.resume.data.data)], {
        type: userDet.resume.contentType,
      });
      const url = URL.createObjectURL(blob);

      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.style.display = "none";

      document.body.appendChild(iframe);

      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      if (isMobile) {
        window.location.href = url;
      } else {
        try {
          window.open(url, "_self");
        } catch (e) {
          window.location.href = url;
        }
      }

      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 10000);
    }
  };

  function formatDate(dateString) {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = String(date.getFullYear()).slice(-2); // Last 2 digits

    return `${day}-${month}-${year}`;
  }

  console.log(userDet, projects);

  return (
    <div className="p-5">
      {loading ? (
        <ProfileSkeleton />
      ) : (
        <>
          <h1 className="font-semibold text-2xl">Profile</h1>

          {/* Image Upload Modal */}
          {showImageUpload && (
            <ImageUpload
              data="UploadAnother"
              imageUpload
              onClose={() => setShowImageUpload(false)}
            />
          )}

          {resumeUploadModal && (
            <FileUpload
              profileChange={true}
              data={"Resume"}
              close={() => setResumeUploadModal(false)}
            />
          )}

          {previewProjectMediaModal && (
            <MediaPreviewModal
              project={userDet.projects[previewProject]}
              onClose={() => setPreviewModal(false)}
            />
          )}

          <div className="mt-5 border-[1.6px] relative border-gray-300 rounded-lg p-3">
            <div
              onClick={toggleDropdown}
              ref={dropdownRef}
              className="w-8 h-8 border-[1.6px] rounded-full absolute cursor-pointer hover:bg-zinc-300 duration-300 transition-all bg-zinc-200 z-[40] -top-4 right-0 flex justify-center items-center border-zinc-300"
            >
              <BsThreeDotsVertical className="text-sm" />

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 max-h-40 overflow-y-scroll bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="p-1">
                    <Button
                      className="w-full cursor-pointer text-black bg-white hover:bg-zinc-100"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowImageUpload(true);
                        setShowDropdown(false);
                      }}
                    >
                      Upload Profile Image
                    </Button>
                    <Button
                      className="w-full cursor-pointer text-black bg-white hover:bg-zinc-100"
                      onClick={(e) => {
                        e.preventDefault();
                        // Add your action here
                        setShowDropdown(false);
                        setResumeUploadModal(true);
                      }}
                    >
                      Upload Resume
                    </Button>
                    <Button
                      className={`${
                        userDet.resume && userDet.resume.length > 1
                          ? null
                          : "hidden"
                      } w-full cursor-pointer text-black bg-white hover:bg-zinc-100`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleResumeClick();
                        setShowDropdown(false);
                      }}
                    >
                      Download Resume
                    </Button>

                    {!userDet?.resume.length >= 1 && (
                      <>
                        <Button
                          className={`w-full cursor-pointer text-black bg-white hover:bg-zinc-100`}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href =
                              "/userDashboard/profile/education";
                          }}
                        >
                          Add Education
                        </Button>

                        <Button
                          className={`w-full cursor-pointer text-black bg-white hover:bg-zinc-100`}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href =
                              "/userDashboard/profile/projects";
                          }}
                        >
                          Add Projects
                        </Button>

                        <Button
                          className={`w-full cursor-pointer text-black bg-white hover:bg-zinc-100`}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href =
                              "/userDashboard/profile/experience";
                          }}
                        >
                          Add Experience
                        </Button>

                        <Button
                          className={`w-full cursor-pointer text-black bg-white hover:bg-zinc-100`}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href =
                              "/userDashboard/profile/achievements";
                          }}
                        >
                          Add Achievements
                        </Button>

                        <Button
                          className={`w-full cursor-pointer text-black bg-white hover:bg-zinc-100`}
                          onClick={(e) => {
                            e.preventDefault();
                            window.location.href =
                              "/userDashboard/profile/certifications";
                          }}
                        >
                          Add Certifications
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => setShowImageUpload(true)}
                      className="w-16 h-16 overflow-hidden rounded-full border-[1.6px] relative cursor-pointer border-zinc-400 flex justify-center items-center"
                    >
                      {userDet?.image ? (
                        <Image
                          src={userDet?.image.data}
                          fill // This makes the image fill the parent container
                          alt="User image"
                          className="object-cover" // This ensures full coverage while maintaining aspect ratio
                          sizes="64px" // Optional: optimizes for the known size
                        />
                      ) : (
                        <h1 className="text-xl"> {userDet?.name[0]} </h1>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload a profile picture</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex flex-col">
                <h1 className="font-semibold text-lg"> {userDet?.name} </h1>
                <h1> {userDet?.desiredRole} </h1>
              </div>
            </div>

            {userDet?.summary && (
              <div className="mt-4 mb-4">
                <h1 className="text-lg font-semibold">Profile Summary</h1>
                <h1 className="text-gray-500"> {userDet?.summary} </h1>
              </div>
            )}

            {userDet?.resume?.filename && (
              <div
                className="flex max-w-fit relative cursor-pointer mt-4 items-center p-3 border rounded-lg border-zinc-300 gap-3 hover:bg-zinc-50 transition-colors"
                onClick={handleResumeClick}
                role="button"
                tabIndex={0}
                aria-label="Open resume in new tab"
              >
                {/* File Icon */}
                <div className="p-2 bg-zinc-100 rounded-lg">
                  {userDet.resume.contentType === "application/pdf" ? (
                    <PdfIcon className="w-6 h-6 text-red-500" />
                  ) : userDet.resume.contentType?.includes("word") ||
                    userDet.resume.contentType?.includes("docx") ? (
                    <WordIcon className="w-6 h-6 text-blue-500" />
                  ) : (
                    <FileIcon className="w-6 h-6 text-zinc-500" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {userDet.resume.filename}
                  </p>
                  <div className="flex gap-2 text-xs text-zinc-500">
                    <span>
                      {userDet.resume.contentType?.split("/")[1]?.toUpperCase()}
                    </span>
                    <span>•</span>
                    <span>
                      {formatFileSize(userDet.resume.data?.data?.length || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {userDet?.education.length > 0 && (
            <div className="my-5  border-[1.6px] relative border-gray-300 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <h1 className="font-semibold text-lg">Education</h1>
                <div className="flex gap-4">
                  <IoAddOutline className="text-2xl cursor-pointer" />
                  <MdOutlineEdit className="text-2xl cursor-pointer" />
                </div>
              </div>

              <div className="flex-wrap flex mt-3 gap-5">
                {userDet?.education &&
                  userDet?.education.length > 0 &&
                  userDet?.education.map((edu, index) => {
                    return (
                      <div
                        key={index}
                        className="py-2 px-4 rounded-lg max-w-fit flex flex-col"
                      >
                        <h1> {edu?.institution} </h1>
                        <h1> {edu?.degree} </h1>
                        <hr
                          className={
                            `${userDet?.education.length == index - 1}`
                              ? "hidden"
                              : ""
                          }
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="mt-5 border-[1.6px] relative border-gray-300 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <h1 className="font-semibold text-lg">Skills</h1>
              <div className="flex gap-4">
                <IoAddOutline className="text-2xl cursor-pointer" />
                <MdOutlineEdit className="text-2xl cursor-pointer" />
              </div>
            </div>

            <div className="inline-flex flex-wrap max-w-6xl gap-x-2">
              {userDet?.skills.slice(0, 4).map((elem, index) => (
                <span key={index}>
                  {elem}
                  {index !== userDet.skills.length - 1 && ","}
                </span>
              ))}
            </div>
            {userDet?.skills.length > 4 && (
              <button className="text-blue-600 text-sm mt-2 hover:underline">
                Show all ${userDet?.skills.length} skills
              </button>
            )}
          </div>

          {userDet?.experience.length > 0 && (
            <div
              className={`${
                userDet?.experience && userDet?.experience.length > 0
                  ? "my-5  border-[1.6px] relative border-gray-300 rounded-lg p-3"
                  : "hidden"
              }`}
            >
              <div className="flex justify-between items-center">
                <h1 className="font-semibold text-lg">Experience</h1>
                <div className="flex gap-4">
                  <IoAddOutline className="text-2xl cursor-pointer" />
                  <MdOutlineEdit className="text-2xl cursor-pointer" />
                </div>
              </div>

              <div className="flex flex-col py-4">
                {userDet?.experience.map((elem, ind) => {
                  return (
                    <div key={ind} className="rounded-lg w-full p-3">
                      <h1 className="text-lg font-semibold">
                        {" "}
                        {elem.company}{" "}
                      </h1>
                      <h1 className="text-base font-normal">
                        {" "}
                        {elem.position}{" "}
                      </h1>
                      <h1 className="text-base font-normal">
                        {" "}
                        {elem.duration}{" "}
                      </h1>

                      <h1 className="text-[15px] mt-2 font-semibold">
                        Key Achievements :
                      </h1>
                      {elem?.achievements.map((ach, ind) => {
                        return (
                          <div key={ind}>
                            <ol>{ach.description}</ol>
                          </div>
                        );
                      })}
                    </div>
                  );
                  <hr
                    className={
                      `${userDet.education.length == index - 1}` ? "hidden" : ""
                    }
                  />;
                })}
              </div>
            </div>
          )}

          {userDet?.achievements.length > 0 && (
            <div
              className={`${
                userDet?.achievements
                  ? "my-5 border-[1.6px] relative border-gray-300 rounded-lg p-3"
                  : "hidden"
              }`}
            >
              <div className="flex justify-between items-center">
                <h1 className="font-semibold text-lg">Achievements</h1>
                <div className="flex gap-4">
                  <IoAddOutline className="text-2xl cursor-pointer" />
                  <MdOutlineEdit className="text-2xl cursor-pointer" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {userDet?.achievements.map((elem, idx) => {
                  return (
                    <div key={idx} className="">
                      <h2> {elem.description} </h2>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {userDet?.projects.length > 0 && (
            <div className=" border-[1.6px] relative border-gray-300 my-5 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <h1 className="font-semibold text-lg">Projects</h1>
                <div className="flex gap-4">
                  <IoAddOutline
                    onClick={() =>
                      (window.location.href = "/userDashboard/profile/projects")
                    }
                    className="text-2xl cursor-pointer"
                  />
                  <MdOutlineEdit
                    onClick={() =>
                      (window.location.href = "/userDashboard/profile/projects")
                    }
                    className="text-2xl cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex-col mt-5 flex">
                {userDet?.projects.length > 0 &&
                  projects.map((elem, idx) => {
                    console.log(idx);
                    return (
                      <div key={idx} className="">
                        <h1 className="text-base font-semibold">
                          {" "}
                          {elem?.title}{" "}
                        </h1>
                        <h2 className="font-normal text-base ">
                          {" "}
                          {elem.description}{" "}
                        </h2>
                        <h2
                          className={`${
                            elem.startDate && (elem.endDate || elem.isCurrent)
                              ? null
                              : "hidden"
                          }`}
                        >
                          {formatDate(elem.startDate)} -{" "}
                          {elem.isCurrent
                            ? "Present"
                            : formatDate(elem.endDate)}{" "}
                        </h2>

                        <h2>
                          {" "}
                          {elem?.skills?.join(" ,")}{" "}
                          {elem?.technologies.join(" ,")}{" "}
                        </h2>

                        <div className="flex gap-2">
                          {elem.media && elem.media.length > 0 && (
                            <div
                              className=""
                              onClick={() => setPreviewModal(true)}
                            >
                              {elem.media.map((el, idx) => {
                                <Image src={el.previewFiles} />;
                              })}
                            </div>
                          )}

                          {elem.links && elem.links.length > 0 && (
                            <div className="flex gap-3 mt-2">
                              {elem.links.map((el, idx) => (
                                <div
                                  key={idx}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setpreviewProject(idx);
                                    setPreviewModal(true);
                                  }}
                                >
                                  <Image
                                    src={el.thumbnail}
                                    alt={el.title || "Preview"}
                                    width={100}
                                    height={120}
                                    className="rounded border w-48 h-28"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {idx !== projects.length - 1 && ( // ✅ Only render if not last
                          <hr className="border-[1.6px] rounded-xl my-3 border-zinc-200" />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default page;
