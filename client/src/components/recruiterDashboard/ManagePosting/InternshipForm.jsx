"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RequiredStar from "@/components/ui/RequiredStar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useCallback, useRef, useState, useEffect } from "react";
import RichTextEditor from "../../common/DescriptionJob";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/Checkbox";
import moreInfo from "@/assests/circle-alert (1).svg";
import Image from "next/image";
import useJobFormStore from "@/store/recruiter/JobModal";
import { toast } from "sonner";
import API from "@/utils/interceptor";
import { debounce } from "@/components/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ButtonLoader from "@/utils/Loader";

const InternshipForm = () => {
  const currentYear = new Date().getFullYear();
  const [showGraduationYear, setShowGraduationYear] = useState(false);
  const [date, setDate] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [immediateJoining, setImmediateJoining] = useState(false);
  const { resetForm, closeModal } = useJobFormStore();
  const [jobForm, setJobForm] = useState({
    domain: "",
    role: "",
    requiredSkills: [],
    optionalSkills: [],
    duration: "",
    stipend: { min: "", max: "" },
    nop: "",
    benchmarkScore: "",
    location: "",
    preferredJoiningDate: "",
    mode: "",
    experience: "",
    about: `
<h2><b>#About the Internship</b></h2>
<p></p>
<h2><b>#Responsibilities</b></h2>
<ul><li></li></ul>
<h2><b>#Requirements</b></h2><ul><li></li></ul>`,
    benefits: [],
    preferences: {
      graduationYear: "",
      minimumCGPA: false,
      cgpaValue: "",
      others: "",
    },
  });
  const [selectedSkillsReq, setSelectedSkillsReq] = useState([]); // Changed to array for multiple selection
  const [selectedSkillsOpt, setSelectedSkillsOpt] = useState([]); // Changed to array for multiple selection
  const [open, setOpen] = useState(false);
  const [open2, setopen2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggesLoad, setSugLoad] = useState({
    domains: false,
    roles: false,
    skill: false,
  });
  const [suggestions, setSuggestions] = useState({
    domains: [],
    roles: [],
    skills: [],
  });

  // Refs for each input field
  const domainInputRef = useRef(null);
  const roleInputRef = useRef(null);
  const skillInputRef = useRef(null);
  // New per-field container refs
  const domainContainerRef = useRef(null);
  const roleContainerRef = useRef(null);
  const skillContainerRef = useRef(null);
  const [activeSuggestionBox, setActiveSuggestionBox] = useState(null); // "domain" | "role" | "skills" | null
  // Map for easy access in the handler
  const containerRefs = {
    domain: domainContainerRef,
    role: roleContainerRef,
    skills: skillContainerRef, // Note: your activeSuggestionBox uses "skills" (plural)
  };

  console.log(jobForm);

  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only check if there's an active suggestion box
      if (activeSuggestionBox) {
        const activeRef = containerRefs[activeSuggestionBox];
        if (activeRef.current && !activeRef.current.contains(event.target)) {
          setActiveSuggestionBox(null);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeSuggestionBox]); // Depend on activeSuggestionBox to re-run if it changes

  const options = [
    "Letter of Recommendation",
    "Certificate",
    "Flexible Hours",
    "Free Snacks and beverages",
    "Performance Bonus",
    "Job Offer",
  ];

  const handleDomainChange = (e) => {
    const value = e.target.value;
    setJobForm((prev) => ({ ...prev, domain: value }));
    searchDomains(value);
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    setJobForm((prev) => ({ ...prev, role: value }));
    searchRoles(value);
  };

  const handleSkillsChange = (e) => {
    const value = e.target.value;
    setJobForm((prev) => ({ ...prev, role: value }));
    searchRoles(value);
  };

  const handleInputChange = (field, value) => {
    setJobForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedInputChange = (parent, field, value) => {
    setJobForm((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const toggleBenefit = (benefit) => {
    setJobForm((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter((b) => b !== benefit)
        : [...prev.benefits, benefit],
    }));
  };

  const togglePreference = (preference) => {
    setJobForm((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [preference]:
          preference === "minimumCGPA"
            ? !prev.preferences.minimumCGPA
            : prev.preferences.others === ""
            ? " "
            : "",
        ...(preference === "minimumCGPA" && !prev.preferences.minimumCGPA
          ? { cgpaValue: "" }
          : {}),
      },
    }));
  };

  const handleOtherPrefChange = (value) => {
    setJobForm((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        others: value,
      },
    }));
  };

  const handleCgpaChange = (value) => {
    setJobForm((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        cgpaValue: value,
      },
    }));
  };

  const searchDomains = useCallback(
    debounce(async (query) => {
      if (!query) {
        setSuggestions((prev) => ({ ...prev, domains: [] }));
        return;
      }
      try {
        setSugLoad((prev) => ({ ...prev, domains: true }));
        const response = await API.get("/job-seeker/skills/getDomain", {
          params: { type: "domains", q: query },
        });
        setSuggestions((prev) => ({ ...prev, domains: response.data }));
      } catch (error) {
        toast.error("Error fetching domains:", error);
      } finally {
        setSugLoad((prev) => ({ ...prev, domains: false }));
      }
    }, 300),
    [jobForm.domain]
  );

  const searchRoles = useCallback(
    debounce(async (query) => {
      if (!query) {
        setSuggestions((prev) => ({ ...prev, roles: [] }));
        return;
      }
      try {
        setSugLoad((prev) => ({ ...prev, roles: true }));
        const response = await API.get("/job-seeker/skills/getRoles", {
          params: { type: "roles", q: query, domain: jobForm.domain },
        });
        setSuggestions((prev) => ({
          ...prev,
          roles: response.data.map((role) => role.title),
        }));
      } catch (error) {
        toast.error("Error fetching roles:", error);
      } finally {
        setSugLoad((prev) => ({ ...prev, roles: false }));
      }
    }, 300),
    [jobForm.role]
  );

  const searchSkills = useCallback(
    debounce(async (query) => {
      if (!query) {
        setSugLoad((prev) => ({ ...prev, skill: [] }));
        return;
      }
      try {
        setSugLoad((prev) => ({ ...prev, skill: true }));
        const response = await API.get("/job-seeker/skills/getSkills", {
          params: { type: "skills", q: query },
        });
        setSuggestions((prev) => ({ ...prev, skills: response.data }));
      } catch (error) {
        toast.error("Error fetching skills:", error);
      } finally {
        setSugLoad((prev) => ({ ...prev, skill: false }));
      }
    }, 300),
    [jobForm.requiredSkills, jobForm.optionalSkills]
  );

  const selectDomain = (domain) => {
    setJobForm((prev) => ({ ...prev, domain }));
    setSuggestions((prev) => ({ ...prev, domains: [] }));
    setActiveSuggestionBox(null);
  };

  const selectRole = (role) => {
    setJobForm((prev) => ({ ...prev, role }));
    setSuggestions((prev) => ({ ...prev, role: [] }));
    setActiveSuggestionBox(null);
  };

  const toggleSkillReq = (skill) => {
    setSelectedSkillsReq((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleSkillOpt = (skill) => {
    setSelectedSkillsOpt((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const canSubmit =
    jobForm.role.length > 5 &&
    jobForm.domain.length > 5 &&
    selectedSkillsReq.length >= 1 &&
    jobForm.mode.length > 0 &&
    jobForm.stipend.min > 500 &&
    jobForm.stipend.max > jobForm.stipend.min &&
    jobForm.benchmarkScore.length > 0 &&
    jobForm.nop.length > 0 &&
    jobForm.duration.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedForm = {
      ...jobForm,
      requiredSkills: selectedSkillsReq,
      optionalSkills: selectedSkillsOpt,
      preferredJoiningDate: immediateJoining
        ? "Immediate Joiner - 30 days"
        : date
        ? format(date, "dd-MM-yyyy")
        : "",
    };

    // Then set the state and log
    setJobForm(updatedForm);
    console.log(updatedForm);
    try {
      setLoading(true);
      const response = await API.post(
        "/recruiter/managePosting/createInternPosting",
        jobForm
      );
      const { success: succ, message } = response.data;
      if (succ) {
        toast.success(message);
        resetForm();
        closeModal();
      } else toast.warning(message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const SkeletonLoader = ({ count = 3 }) => {
    return (
      <ul className="mt-1 border rounded">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="p-2">
            <div className="h-6 p-4 bg-gray-200 rounded animate-pulse"></div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div ref={containerRef}>
      <h1 className="text-center text-lg my-3 font-semibold">
        Post New Internship
      </h1>

      <div>
        <form onSubmit={handleSubmit}>
          {/* domain */}
          <div className="space-y-1 mb-8">
            <Label className="text-base">
              Internship Domain <RequiredStar />
            </Label>
            <div ref={domainContainerRef}>
              <input
                className="w-full p-2 border rounded"
                type="text"
                placeholder="e.g. Software Engineering"
                ref={domainInputRef}
                value={jobForm.domain}
                onFocus={(e) => setActiveSuggestionBox("domain")}
                onChange={handleDomainChange}
              />

              {suggesLoad.domains ? (
                <SkeletonLoader count={3} />
              ) : (
                activeSuggestionBox === "domain" &&
                suggestions.domains.length > 0 && (
                  <ul className="mt-1 border rounded shadow bg-white z-50 relative">
                    {suggestions.domains.map((domain, i) => (
                      <li
                        key={i}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          selectDomain(domain);
                          setActiveSuggestionBox(null); // close after selecting
                        }}
                      >
                        {domain}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>

          <div className="space-y-1 mb-8">
            <Label className="text-base">
              Internship Role <RequiredStar />
            </Label>
            <div ref={roleContainerRef}>
              <input
                className="w-full p-2 border rounded"
                type="text"
                placeholder="e.g. Software Engineering"
                ref={roleInputRef}
                value={jobForm.role}
                onFocus={() => setActiveSuggestionBox("role")}
                onChange={handleRoleChange}
              />
              {suggesLoad.roles ? (
                <SkeletonLoader count={3} />
              ) : (
                activeSuggestionBox === "role" &&
                suggestions.roles.length > 0 && (
                  <ul className="mt-1 border rounded shadow bg-white z-50 relative">
                    {suggestions.roles.map((role, i) => (
                      <li
                        key={i}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          selectRole(role);
                          setActiveSuggestionBox(null); // close after selecting
                        }}
                      >
                        {role}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>

          {/*required skill*/}
          <div className="w-full mb-8">
            <Label className="text-base">
              Required Skills <RequiredStar />
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  role="combobox"
                  aria-expanded={open}
                  className="w-full border-[1.6px] !text-black border-zinc-200 relative justify-between"
                  variant="outline"
                >
                  {selectedSkillsReq.length > 0
                    ? `${selectedSkillsReq.length} skill(s) selected`
                    : "Search & select skills"}
                  <ChevronsUpDown className="h-4 w-4 absolute top-3 right-2 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full z-[1001] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Type skill name..."
                    onValueChange={searchSkills}
                  />
                  {suggesLoad.skill ? (
                    <div className="p-4">
                      <Skeleton className="h-5 w-full mb-2" />
                      <Skeleton className="h-5 w-2/3" />
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>No skills found.</CommandEmpty>
                      <CommandGroup>
                        {suggestions.skills.length > 0 &&
                          suggestions.skills.map((skill, idx) => (
                            <CommandItem
                              key={idx}
                              onSelect={() => toggleSkillReq(skill)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedSkillsReq.includes(skill)
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

            {selectedSkillsReq.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedSkillsReq.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                    <button
                      type="button"
                      className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none"
                      onClick={() => toggleSkillReq(skill)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/*optional skills*/}
          <div className="w-full mb-8">
            <Label className="text-base">Optional Skills</Label>
            <Popover open={open2} onOpenChange={setopen2}>
              <PopoverTrigger asChild>
                <Button
                  role="combobox"
                  aria-expanded={open2}
                  className="w-full border-[1.6px] !text-black border-zinc-200 relative justify-between"
                  variant="outline"
                >
                  {selectedSkillsOpt.length > 0
                    ? `${selectedSkillsOpt.length} optional skill(s) selected`
                    : "Search & select optional skills"}
                  <ChevronsUpDown className="h-4 w-4 absolute top-3 right-2 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full z-[1001] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Type optional skill name..."
                    onValueChange={searchSkills}
                  />
                  {suggesLoad.skill ? (
                    <div className="p-4">
                      <Skeleton className="h-5 w-full mb-2" />
                      <Skeleton className="h-5 w-2/3" />
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>No skills found.</CommandEmpty>
                      <CommandGroup>
                        {suggestions.skills.length > 0 &&
                          suggestions.skills.map((skill, idx) => (
                            <CommandItem
                              key={idx}
                              onSelect={() => toggleSkillOpt(skill)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedSkillsOpt.includes(skill)
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

            {selectedSkillsOpt.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedSkillsOpt.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {skill}
                    <button
                      type="button"
                      className="ml-1.5 inline-flex text-green-400 hover:text-green-600 focus:outline-none"
                      onClick={() => toggleSkillOpt(skill)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-1 mb-8">
            <Label className="text-base">
              Duration (months) <RequiredStar />
            </Label>
            <Select
              value={jobForm.duration}
              onValueChange={(value) => handleInputChange("duration", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Set Internship duration" />
              </SelectTrigger>
              <SelectContent>
                {["2-3", "3-4", "4-5", "5-6", "6-7", "7-8", "8-9", "9-10"].map(
                  (val, i) => (
                    <SelectItem key={`duration-${val}-${i}`} value={val}>
                      {val}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Stipend Range */}
          <div className="flex flex-col gap-2 mb-8">
            <Label className="text-base">
              Stipend (per month) <RequiredStar />
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="e.g. ₹30000"
                className="w-full"
                value={jobForm.stipend.min}
                onChange={(e) =>
                  handleNestedInputChange("stipend", "min", e.target.value)
                }
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="e.g. ₹45000"
                className="w-full"
                value={jobForm.stipend.max}
                onChange={(e) =>
                  handleNestedInputChange("stipend", "max", e.target.value)
                }
              />
            </div>
          </div>

          {/* Number of Positions */}
          <div className="flex gap-4 mb-3">
            <div className="flex-1 space-y-1">
              <Label className="text-base">
                Number of Positions
                <RequiredStar />
              </Label>
              <Input
                type="number"
                placeholder="e.g. 1,2,3"
                value={jobForm.nop}
                onChange={(e) => handleInputChange("nop", e.target.value)}
              />
            </div>
          </div>

          {/* Graduation Year Preference */}
          <div className="flex mb-5 items-center space-x-2">
            <Checkbox
              id="graduationYearPref"
              checked={showGraduationYear}
              onCheckedChange={(checked) => {
                setShowGraduationYear(checked);
                if (!checked) {
                  handleNestedInputChange("preferences", "graduationYear", "");
                }
              }}
              className="border-zinc-400 cursor-pointer"
            />
            <label className="text-[14px] font-light">
              Preference for Year of Graduation?
            </label>
          </div>

          {showGraduationYear && (
            <div className="space-y-1 mb-8">
              <Select
                value={jobForm.preferences.graduationYear}
                onValueChange={(value) =>
                  handleNestedInputChange(
                    "preferences",
                    "graduationYear",
                    value
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select graduation year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: 10 },
                    (_, i) => currentYear - 5 + i
                  ).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Benchmark Score */}
          <div className="flex gap-4 mb-8">
            <div className="flex-1 space-y-1">
              <Label className="text-base">
                BenchMark Score
                <RequiredStar />
              </Label>
              <Select
                value={jobForm.benchmarkScore}
                onValueChange={(value) =>
                  handleInputChange("benchmarkScore", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select BenchMark Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ALL</SelectItem>
                  <SelectItem value="25%">25%</SelectItem>
                  <SelectItem value="50%">50%</SelectItem>
                  <SelectItem value="75%">75%</SelectItem>
                  <SelectItem value="100%">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1 mb-8">
            <Label className="text-base">
              Location <RequiredStar />
            </Label>
            <Select
              value={jobForm.location}
              onValueChange={(value) => handleInputChange("location", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose Office Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Remote">Remote</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
                <SelectItem value="On-Site">On-Site</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Internship Joining Date */}
          <div className="flex flex-col gap-2 mb-8">
            <Label className="text-base">
              Internship Join Date
              <RequiredStar />
            </Label>

            <Popover>
              <PopoverTrigger
                className={cn(
                  "sm:w-[250px] w-full inline-flex justify-between items-center px-4 py-2 border border-zinc-300 rounded-md text-sm",
                  immediateJoining &&
                    "opacity-50 cursor-not-allowed bg-gray-100"
                )}
              >
                {date ? format(date, "dd / MMMM / yyyy") : "dd-mm-yyyy"}
                <CalendarIcon className="ml-2 h-4 w-4 text-gray-500" />
              </PopoverTrigger>

              <PopoverContent className="w-auto z-[1001] p-0">
                <Calendar
                  mode="single"
                  selected={immediateJoining ? null : date}
                  onSelect={(selectedDate) => {
                    if (!immediateJoining) {
                      setDate(selectedDate);
                      handleInputChange(
                        "preferredJoiningDate",
                        format(selectedDate, "dd-MM-yyyy")
                      );
                    }
                  }}
                  initialFocus
                  captionLayout="dropdown"
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 1}
                  disabled={(day) => {
                    if (immediateJoining) return true;

                    const today = new Date();
                    const threeMonthsLater = new Date();
                    threeMonthsLater.setMonth(today.getMonth() + 3);
                    return day < today || day > threeMonthsLater;
                  }}
                />
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="immediateJoining"
                checked={immediateJoining}
                onChange={(e) => {
                  setImmediateJoining(e.target.checked);
                  if (e.target.checked) {
                    const thirtyDaysLater = new Date();
                    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
                    setDate(thirtyDaysLater);
                    handleInputChange(
                      "preferredJoiningDate",
                      format(thirtyDaysLater, "dd-MM-yyyy")
                    );
                  } else {
                    setDate(null);
                    handleInputChange("preferredJoiningDate", "");
                  }
                }}
                className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="immediateJoining" className="text-base">
                Immediate Joiner (within 30 days)
              </Label>
            </div>
          </div>

          {/* Internship Mode */}
          <div className="space-y-1 mb-8">
            <Label className="text-base">
              Internship Mode <RequiredStar />
            </Label>
            <Select
              value={jobForm.mode}
              onValueChange={(value) => handleInputChange("mode", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Part-Time">
                  Part-Time (3-4 hrs/day)
                </SelectItem>
                <SelectItem value="Semi-Full-Time">
                  Semi-Full-Time (5-6 hrs/day)
                </SelectItem>
                <SelectItem value="Full-Time">
                  Full-Time (7-8 hrs/day)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Experience of Interns */}
          <div className="space-y-1 mb-8">
            <div className="flex justify-between">
              <Label>Experience of Interns Required</Label>

              <div className="relative flex items-center group">
                <Image
                  alt=""
                  className="cursor-pointer select-none"
                  src={moreInfo}
                  onClick={() => setIsOpen(!isOpen)}
                  width={22}
                  height={22}
                />

                <div
                  className={`
                absolute right-full top-1/2 -translate-y-1/2 mr-3 w-64 md:w-80 
                bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg 
                transition-all duration-300 z-50
                opacity-0 invisible
                group-hover:opacity-100 group-hover:visible
                ${isOpen ? "opacity-100 visible" : ""}
              `}
                >
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-gray-900"></div>
                  <p>
                    <strong>Expert:</strong> The candidate should have at least
                    – 1 work experience AND 1 project.
                  </p>
                  <p className="mt-2">
                    <strong>Intermediate:</strong> The candidate should have at
                    least – 1 work experience OR 2 projects.
                  </p>
                  <p className="mt-2">
                    <strong>Beginner:</strong> The candidate should have at
                    least – 1 project on relevant tech stack.
                  </p>
                </div>
              </div>
            </div>

            <Select
              value={jobForm.experience}
              onValueChange={(val) => handleInputChange("experience", val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Experience of Interns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* About Internship */}
          <div className="flex flex-col gap-4 mb-8">
            <Label className="text-base">
              About Internship
              <RequiredStar />
            </Label>
            <RichTextEditor
              value={jobForm.about}
              onChange={(value) => handleInputChange("about", value)}
            />
          </div>

          {/* Extra Benefits */}
          <div className="space-y-3 my-5">
            <Label className="text-base">Extra Benefits</Label>
            {options.map((label) => (
              <div className="flex items-center space-x-2" key={label}>
                <Checkbox
                  id={label}
                  checked={jobForm.benefits.includes(label)}
                  onCheckedChange={() => toggleBenefit(label)}
                />
                <label htmlFor={label} className="text-[14px] font-light">
                  {label}
                </label>
              </div>
            ))}
          </div>

          {/* Other Preferences */}
          <div className="space-y-3 my-5">
            <Label className="text-base">Set Other Preferences</Label>

            {/* Minimum CGPA Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="minimumCGPA"
                checked={jobForm.preferences.minimumCGPA}
                onCheckedChange={() => togglePreference("minimumCGPA")}
              />
              <label htmlFor="minimumCGPA" className="text-[14px] font-light">
                Minimum CGPA
              </label>
            </div>

            {/* CGPA Input (shown when checked) */}
            {jobForm.preferences.minimumCGPA && (
              <div className="ml-6 space-y-1">
                <Label className="text-sm">Enter Minimum CGPA</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="e.g. 7.5"
                  value={jobForm.preferences.cgpaValue}
                  onChange={(e) => handleCgpaChange(e.target.value)}
                />
              </div>
            )}

            {/* Others Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="others"
                checked={!!jobForm.preferences.others}
                onCheckedChange={() => togglePreference("others")}
              />
              <label htmlFor="others" className="text-[14px] font-light">
                Others
              </label>
            </div>

            {/* Others Input (shown when checked) */}
            {jobForm.preferences.others !== "" && (
              <div className="ml-6 space-y-1">
                <Label className="text-sm">Specify Other Preferences</Label>
                <Input
                  placeholder="Type your other preferences"
                  value={jobForm.preferences.others}
                  onChange={(e) => handleOtherPrefChange(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex w-full justify-end gap-3">
            <Button
              onClick={() => {
                resetForm();
                closeModal();
              }}
              className="border-[1.6px] border-zinc-200 text-black hover:bg-gray-300  bg-white"
            >
              Cancel
            </Button>
            <Button
              disabled={!canSubmit || loading}
              type="submit"
              className="border-[1.6px] disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center border-zinc-200 text-black hover:bg-gray-200/30 bg-white"
            >
              {loading ? <ButtonLoader /> : "Post Job"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InternshipForm;
