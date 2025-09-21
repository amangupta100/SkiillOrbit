"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IoMdClose } from "react-icons/io";
import { useEffect, useRef, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Check } from "lucide-react";
import { toast } from "sonner";
import API from "@/utils/interceptor";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import AddMedia from "./AddMedia";
import { FiEdit } from "react-icons/fi"; // import edit icon from react-icons
import AddLink from "./AddLink";
import ButtonLoader from "@/utils/Loader";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const years = Array.from({ length: 50 }, (_, i) => 1980 + i); // 1980 → 2029

const GenProjectModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    projectName: "",
    projectDescription: "",
    skills: "",
    selectedSkills: [],
    isCurrent: false,
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
  });

  const [SuggestedSkills, setSuggestedSkills] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [addMediaDropDown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [addlink, setaddLink] = useState(false);
  const [addMedia, setaddMedia] = useState(false);
  const [mediaList, setMediaList] = useState([]);
  const [editingMediaIndex, setEditingMediaIndex] = useState(null);
  const [linkList, setLinkList] = useState([]);
  const [editingLinkIndex, setEditingLinkIndex] = useState(null);

  console.log(mediaList);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleSaveProject = async () => {
    setLoading(true);
    try {
      // Convert mediaList files to base64 objects
      const mediaBase64 = await Promise.all(
        mediaList.map(async (m) => {
          const file = m?.file?.file;
          if (!file) return null;
          const base64 = await fileToBase64(file);
          return {
            url: base64,
            type: file.type.startsWith("image/")
              ? "image"
              : file.type === "application/pdf"
              ? "document"
              : "file",
          };
        })
      );

      // Prepare links with possible thumbnail
      const linksBase64 = await Promise.all(
        linkList.map(async (l) => {
          let thumb = l.thumbnail;
          // If thumbnail is a File object, convert it
          if (l.fileMeta && l.fileMeta.name && thumb && thumb instanceof File) {
            thumb = await fileToBase64(thumb);
          }
          return {
            title: l.title || "",
            description: l.description || "",
            url: l.link, // the actual link
            thumbnail: thumb || "", // base64 string or empty
            fileMeta: l.fileMeta || null,
          };
        })
      );

      // Build payload
      const payload = {
        title: formData.projectName,
        description: formData.projectDescription,
        skills: formData.selectedSkills,
        isCurrent: formData.isCurrent,
        startDate: new Date(`${formData.startMonth} 1, ${formData.startYear}`),
        endDate: formData.isCurrent
          ? null
          : new Date(`${formData.endMonth} 1, ${formData.endYear}`),
        links: linksBase64,
        media: mediaBase64.filter(Boolean),
      };

      console.log("Submitting payload:", payload);

      const req = await API.post("/job-seeker/profile/uploadProject", payload);
      const { success: succ, message } = req.data;
      if (succ) {
        toast.success("Project saved successfully!");
        onClose();
      } else toast.error(message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedia = (media) => {
    setMediaList((prev) => [...prev, media]);
  };

  const handleAddLink = (linkData) => {
    setLinkList((prev) => [...prev, linkData]);
  };

  // Fetch skills
  useEffect(() => {
    const fetchSkills = async () => {
      if (formData.skills.length < 1) return;
      try {
        setLoading(true);
        const res = await API.get(
          `/job-seeker/profile/getSkills/?q=${formData.skills}`
        );
        setSuggestedSkills(res.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSkills, 300);
    return () => clearTimeout(timer);
  }, [formData.skills]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    if (addMediaDropDown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [addMediaDropDown]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const toggleSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skill)
        ? prev.selectedSkills.filter((s) => s !== skill)
        : [...prev.selectedSkills, skill],
    }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="inset-0 absolute z-[999] flex items-center justify-center w-screen h-screen bg-black/70 backdrop-blur-md">
      {addMedia ? (
        <AddMedia
          setaddMedia={setaddMedia}
          onAddMedia={(updatedMedia) => {
            if (editingMediaIndex !== null) {
              if (updatedMedia === null) {
                // Delete media
                setMediaList((prev) =>
                  prev.filter((_, i) => i !== editingMediaIndex)
                );
              } else {
                // Update media
                setMediaList((prev) =>
                  prev.map((m, i) =>
                    i === editingMediaIndex ? updatedMedia : m
                  )
                );
              }
              setEditingMediaIndex(null);
            } else {
              handleAddMedia(updatedMedia);
            }
          }}
          edit={
            editingMediaIndex !== null ? mediaList[editingMediaIndex] : null
          }
        />
      ) : addlink ? (
        <AddLink
          setaddLink={setaddLink}
          onAddLink={(updatedLink) => {
            if (editingLinkIndex !== null) {
              if (updatedLink === null) {
                setLinkList((prev) =>
                  prev.filter((_, i) => i !== editingLinkIndex)
                );
              } else {
                setLinkList((prev) =>
                  prev.map((l, i) => (i === editingLinkIndex ? updatedLink : l))
                );
              }
              setEditingLinkIndex(null);
            } else {
              handleAddLink(updatedLink);
            }
          }}
          edit={editingLinkIndex !== null ? linkList[editingLinkIndex] : null}
        />
      ) : (
        <div className="w-[680px] max-h-[680px] overflow-y-scroll bg-white rounded-lg shadow-lg relative">
          {/* Modal header */}
          <div className="flex sticky top-0 bg-white z-[1000] justify-between items-center p-3 border-b-2 border-zinc-300">
            <h1 className="font-semibold mx-1 text-xl">Add Project</h1>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 rounded-full"
            >
              <IoMdClose className="text-xl" />
            </button>
          </div>

          {/* Modal content */}
          <div className="p-4">
            {/* Project Name */}
            <div className="flex flex-col gap-1 my-2">
              <Label className="text-lg font-medium">Project Name</Label>
              <Input
                className="border border-zinc-400"
                value={formData.projectName}
                onChange={(e) => handleChange("projectName", e.target.value)}
                placeholder="Enter project name"
              />
            </div>

            {/* Project Description */}
            <div className="flex flex-col gap-1 my-6">
              <Label className="text-lg font-medium">Project Description</Label>
              <Textarea
                className="border border-zinc-400"
                value={formData.projectDescription}
                onChange={(e) =>
                  handleChange("projectDescription", e.target.value)
                }
                placeholder="Write a short description..."
              />
            </div>

            {/* Skills */}
            <div className="flex flex-col gap-1 my-6 relative">
              <Label className="text-lg font-medium">Skills</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    role="combobox"
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                    className="w-full justify-between"
                    variant="outline"
                  >
                    {formData.selectedSkills.length > 0
                      ? `${formData.selectedSkills.length} skill(s) selected`
                      : "Search & select skills"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-full p-0 z-[999]"
                  side="up"
                  align="start"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Type skill name..."
                      value={formData.skills}
                      onValueChange={(val) => handleChange("skills", val)}
                    />
                    {loading ? (
                      <div className="p-4">
                        <Skeleton className="h-5 w-full mb-2" />
                        <Skeleton className="h-5 w-2/3" />
                      </div>
                    ) : (
                      <>
                        <CommandEmpty>No skills found.</CommandEmpty>
                        <CommandGroup>
                          {SuggestedSkills?.map((skill, idx) => (
                            <CommandItem
                              key={idx}
                              onSelect={() => {
                                toggleSkill(skill);
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.selectedSkills.includes(skill)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {skill}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>

              {formData.selectedSkills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                      <button
                        type="button"
                        className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none"
                        onClick={() => toggleSkill(skill)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Media */}
            <div
              className="my-6 flex flex-col gap-1 relative"
              ref={dropdownRef}
            >
              <Label className="text-lg font-medium">Media</Label>
              <p className="text-sm text-gray-600">
                Here you may upload link, photos, document & presentation
                related to project
              </p>
              <Button
                className="mt-2"
                onClick={() => setShowDropdown((p) => !p)}
              >
                Add Media
              </Button>
              {addMediaDropDown && (
                <div className="absolute left-0 top-26 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="p-1 flex flex-col">
                    <Button
                      variant="ghost"
                      className="justify-start w-full"
                      onClick={() => {
                        setaddLink(true);
                        setShowDropdown(false);
                      }}
                    >
                      Add a link
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start w-full"
                      onClick={() => {
                        setShowDropdown(false);
                        setaddMedia(true);
                      }}
                    >
                      Add Media
                    </Button>
                  </div>
                </div>
              )}
              {/* Show Media Below */}
              <div className="mt-4 flex flex-col gap-3">
                {linkList.map((link, idx) => (
                  <div
                    key={idx}
                    className="relative p-3 border rounded-md flex items-center gap-3"
                  >
                    {/* Edit Icon */}
                    <button
                      onClick={() => {
                        setEditingLinkIndex(idx); // Save index of link being edited
                        setaddLink(true); // Open AddLink modal
                      }}
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      <FiEdit className="cursor-pointer" size={18} />
                    </button>

                    {/* Thumbnail Preview */}
                    {link.thumbnail ? (
                      <img
                        src={link.thumbnail}
                        alt={link.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-20 flex items-center justify-center bg-gray-200 rounded text-gray-500">
                        🔗
                      </div>
                    )}

                    {/* Link Info */}
                    <div>
                      <h3 className="font-semibold">
                        {link.title || "Untitled Link"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {link.description}
                      </p>
                      <a
                        href={link.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline"
                      >
                        {link.link}
                      </a>

                      {/* File meta info if available */}
                      {link.fileMeta && (
                        <p className="text-xs text-gray-400 mt-1">
                          {link.fileMeta.type} ({link.fileMeta.size})
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {mediaList.map((media, idx) => {
                  const file = media?.file?.file; // get the actual File
                  const preview = media?.file?.preview;

                  return (
                    <div
                      key={idx}
                      className="relative p-3 border rounded-md flex items-center gap-3"
                    >
                      {/* Edit Icon */}
                      <button
                        onClick={() => {
                          setEditingMediaIndex(idx); // Save index of media being edited
                          setaddMedia(true); // Open AddMedia module
                        }}
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                      >
                        <FiEdit className="cursor-pointer" size={18} />
                      </button>

                      {/* File Preview */}
                      {file ? (
                        file.type.startsWith("image/") ? (
                          <img
                            src={preview || URL.createObjectURL(file)}
                            alt={media.title}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ) : file.type === "application/pdf" ? (
                          <iframe
                            src={preview || URL.createObjectURL(file)}
                            title="PDF Preview"
                            className="w-20 h-20"
                          />
                        ) : (
                          <div className="w-20 h-20 flex items-center justify-center bg-gray-200 rounded">
                            📄
                          </div>
                        )
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center bg-gray-200 rounded">
                          ❓
                        </div>
                      )}

                      {/* File Info */}
                      <div>
                        <h3 className="font-semibold">
                          {media.title || "Untitled"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {media.description}
                        </p>
                        {file && (
                          <p className="text-xs text-gray-400">
                            {file.type} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                            MB)
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Details */}
            <div className="my-6 flex flex-col gap-3">
              <Label className="text-lg font-medium">Additional Details</Label>

              {/* Current Project Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isCurrent}
                  onChange={(e) => handleChange("isCurrent", e.target.checked)}
                />
                <span>I am currently working on this project</span>
              </div>

              {/* Start Date */}
              <div className="flex flex-col gap-1">
                <Label className="text-base font-medium">Start Date</Label>
                <div className="flex gap-2">
                  <select
                    className="border border-gray-400 rounded-md p-2 flex-1"
                    value={formData.startMonth}
                    onChange={(e) => handleChange("startMonth", e.target.value)}
                  >
                    <option value="">Month</option>
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border border-gray-400 rounded-md p-2 flex-1"
                    value={formData.startYear}
                    onChange={(e) => handleChange("startYear", e.target.value)}
                  >
                    <option value="">Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* End Date */}
              {!formData.isCurrent && (
                <div className="flex flex-col gap-1">
                  <Label className="text-base font-medium">End Date</Label>
                  <div className="flex gap-2">
                    <select
                      className="border border-gray-400 rounded-md p-2 flex-1"
                      value={formData.endMonth}
                      onChange={(e) => handleChange("endMonth", e.target.value)}
                    >
                      <option value="">Month</option>
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      className="border border-gray-400 rounded-md p-2 flex-1"
                      value={formData.endYear}
                      onChange={(e) => handleChange("endYear", e.target.value)}
                    >
                      <option value="">Year</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => handleSaveProject()}
                disabled={loading}
                className="bg-green-600 flex items-center hover:bg-green-700"
              >
                {loading && <ButtonLoader />} Save Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenProjectModal;
