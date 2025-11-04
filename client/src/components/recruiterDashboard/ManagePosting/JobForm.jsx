"use client";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import React, { useRef } from "react";
import useJobFormStore from "@/store/recruiter/JobModal";
import RequiredStar from "@/components/ui/RequiredStar";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import API from "@/utils/interceptor";
import { Button } from "@/components/ui/button";
import RichTextEditor from "../../common/DescriptionJob";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/Checkbox";
import { debounce } from "@/components/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import ButtonLoader from "@/utils/Loader";

const JobForm = () => {
  const {
    closeModal,
    jobForm,
    setField,
    setSalaryField,
    setSkills,
    setOptionalSkills,
    resetForm,
  } = useJobFormStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [about, setAbout] = useState(`
<h2><b>#About the Opportunity</b></h2>
<p></p>
<h2><b>#Responsibilities</b></h2>
<ul><li></li></ul>
<h2><b>#Requirements</b></h2>
<ul><li></li></ul>
`);
  const [date, setDate] = useState(null);
  const [immediateJoining, setImmediateJoining] = useState(false);
  const [benefits, setBenefits] = useState([]);
  const [selectedSkillsReq, setSelectedSkillsReq] = useState([]); // Changed to array for multiple selection
  const [selectedSkillsOpt, setSelectedSkillsOpt] = useState([]); // Changed to array for multiple selection
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
  const [open2, setopen2] = useState(false);
  const [open, setOpen] = useState(false);

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

  useEffect(() => {
    setField("description", about);
  }, [about]);
  const canSubmit =
    jobForm.domain.length > 5 &&
    jobForm.role.length > 5 &&
    jobForm.requiredSkills.length >= 2 &&
    jobForm.experience.length > 0 &&
    jobForm.salaryRange.min > 1 &&
    jobForm.salaryRange.max > jobForm.salaryRange.min &&
    jobForm.benchmarkScore.length > 0 &&
    jobForm.nop.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!immediateJoining) {
      setField("preferredJoiningDate", "Immediate Joiner - 30 days");
    } else setField("preferredJoiningDate", date);

    if (benefits.length == 0) {
      setField("extBenefits", []);
    }

    console.log(jobForm);
    try {
      setLoading(true);
      const response = await API.post(
        "/recruiter/managePosting/createJobPosting",
        jobForm
      );
      console.log(response, response.data);
      const { success: succ, message } = response.data;
      if (succ) {
        toast.success(message);
        resetForm();
        closeModal();
      } else toast.error(message);
    } catch (err) {
      toast.warning(err.message);
    } finally {
      setLoading(false);
    }
  };

  const options = [
    "Health Insurance",
    "5 days a week",
    "Life Insurance",
    "Free Snacks and beverages",
    "Cab/Transportation facility",
    "Informal Dress Code",
  ];

  const handleDomainChange = (e) => {
    const value = e.target.value;
    setField("domain", value);
    searchDomains(value);
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

  // Sync required skills to store whenever selectedSkillsReq changes
  useEffect(() => {
    setSkills(selectedSkillsReq);
  }, [selectedSkillsReq]);

  // Sync optional skills to store whenever selectedSkillsOpt changes
  useEffect(() => {
    setOptionalSkills(selectedSkillsOpt);
  }, [selectedSkillsOpt]);

  const selectDomain = (domain) => {
    setField("domain", domain);
    setSuggestions((prev) => ({ ...prev, domains: [] }));
    setActiveSuggestionBox(null);
  };

  const selectRole = (role) => {
    setField("role", role);
    setSuggestions((prev) => ({ ...prev, role: [] }));
    setActiveSuggestionBox(null);
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    setField("role", value);
    searchRoles(value);
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

  const toggleBenefit = (benefit) => {
    const updated = benefits.includes(benefit)
      ? benefits.filter((b) => b !== benefit)
      : [...benefits, benefit];

    setBenefits(updated);
    setField("extBenefits", updated); // Immediately update the form store
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
    <div className="relative">
      <h1 className="text-center text-lg my-3 font-semibold">Post New Job</h1>

      <form onSubmit={handleSubmit}>
        {/* Domain */}
        <div className="space-y-1 mb-8">
          <Label className="text-base">
            Domain <RequiredStar />
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

        {/* Role */}
        <div className="space-y-1 mb-8">
          <Label className="text-base">
            Role <RequiredStar />
          </Label>

          <div ref={roleContainerRef}>
            <input
              className="w-full p-2 border rounded"
              type="text"
              placeholder="e.g. Software Engineering"
              ref={roleContainerRef}
              value={jobForm.role}
              onFocus={(e) => setActiveSuggestionBox("role")}
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

        {/* required skill */}
        <div className="space-y-1 mb-8">
          <Label className="text-base">
            Required Skills (comma-separated)
            <RequiredStar />
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
        <div className="space-y-1 mb-8">
          <Label className="text-base">Optional Skills (comma-separated)</Label>

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

        {/*experience*/}
        <div className="space-y-1 mb-8">
          <Label className="text-base">
            Work Experience (in years) <RequiredStar />
          </Label>
          <Select
            value={jobForm.experience}
            onValueChange={(val) => setField("experience", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-1">0-1</SelectItem>
              <SelectItem value="1-2">1-2</SelectItem>
              <SelectItem value="2-3">2-3</SelectItem>
              <SelectItem value="3-4">3-4</SelectItem>
              <SelectItem value="4-5">4-5</SelectItem>
              <SelectItem value="5-6">5-6</SelectItem>
              <SelectItem value="6-7">6-7</SelectItem>
              <SelectItem value="7-8">7-8</SelectItem>
              <SelectItem value="8-9">8-9</SelectItem>
              <SelectItem value="9-10">9-10</SelectItem>
              <SelectItem value="10+">10+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-1 mb-8">
          <Label className="text-base">
            Location <RequiredStar />
          </Label>
          <Select
            value={jobForm.location}
            onValueChange={(val) => setField("location", val)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Remote">Remote</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
              <SelectItem value="On-Site">On-Site</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Salary Range */}
        <div className="flex flex-col gap-2 mb-8">
          <Label className="text-base">
            Salary Range <RequiredStar /> (per Annum)
          </Label>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="e.g. 3"
              value={jobForm.salaryRange.min}
              onChange={(e) => setSalaryField("min", Number(e.target.value))}
              className="w-full"
            />

            <span className="text-sm text-muted-foreground">to</span>

            <Input
              type="number"
              placeholder="e.g. 5.5"
              value={jobForm.salaryRange.max}
              onChange={(e) => setSalaryField("max", Number(e.target.value))}
              className="w-full"
            />

            <span className="text-sm text-muted-foreground whitespace-nowrap">
              LPA
            </span>
          </div>
        </div>

        {/*bench mark score*/}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 space-y-1">
            <Label className="text-base">
              BenchMark Score
              <RequiredStar />
            </Label>
            <Select
              value={jobForm.benchmarkScore}
              onValueChange={(val) => setField("benchmarkScore", val)}
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

        {/*nop */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 space-y-1">
            <Label className="text-base">
              Number of Positions
              <RequiredStar />
            </Label>
            <Input
              type="number"
              placeholder="e.g. 1,2,3"
              value={jobForm.nop}
              onChange={(e) => setField("nop", e.target.value)}
            />
          </div>
        </div>

        {/* Description */}

        <div className="flex flex-col gap-4 mb-8">
          <Label className="text-base">
            About Job
            <RequiredStar />
          </Label>
          <RichTextEditor value={about} onChange={setAbout} />
        </div>

        {/*preferred joining date*/}
        <div className="flex flex-col gap-2 mb-8">
          <Label className="text-base">
            Preferred Joining Date
            <RequiredStar />
          </Label>

          <Popover>
            <PopoverTrigger
              disabled={immediateJoining}
              className={cn(
                "sm:w-[250px] w-full inline-flex justify-between items-center px-4 py-2 border border-zinc-300 rounded-md text-sm",
                immediateJoining && "opacity-50 cursor-not-allowed bg-gray-100"
              )}
            >
              {date ? format(date, "dd / MMMM / yyyy") : "dd-mm-yyyy"}
              <CalendarIcon className="ml-2 h-4 w-4 text-gray-500" />
            </PopoverTrigger>

            <PopoverContent className="w-auto z-[1001] p-0">
              <Calendar
                mode="single"
                selected={immediateJoining ? null : date} // Don't show selection if immediate joining
                onSelect={(selectedDate) => {
                  if (!immediateJoining) {
                    setDate(selectedDate);
                    setField(
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
                  if (immediateJoining) return true; // Disable all dates if immediate joining is checked

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
                  // Set date to 30 days from now when checked
                  const thirtyDaysLater = new Date();
                  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
                  setDate(thirtyDaysLater);
                  setField(
                    "preferredJoiningDate",
                    format(thirtyDaysLater, "dd-MM-yyyy")
                  );
                } else {
                  // Clear date when unchecked
                  setDate(null);
                  setField("preferredJoiningDate", "");
                }
              }}
              className="h-4 w-4 rounded border-zinc-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="immediateJoining" className="text-base">
              Immediate Joiner (within 30 days)
            </Label>
          </div>
        </div>

        {/*extra-benefits */}
        <div className="space-y-3 my-5">
          <p className="font-medium">Extra Benefits</p>
          {options.map((label) => (
            <div className="flex items-center space-x-2" key={label}>
              <Checkbox
                id={label}
                checked={benefits.includes(label)}
                onCheckedChange={() => toggleBenefit(label)}
                className="border-zinc-400 cursor-pointer"
              />
              <label htmlFor={label} className="text-[14px] font-light ">
                {label}
              </label>
            </div>
          ))}
        </div>

        <div className="flex w-full justify-end gap-3">
          <Button
            className=""
            onClick={() => {
              resetForm();
              closeModal();
            }}
          >
            Cancel
          </Button>
          <Button className="cursor-pointer" disabled={!canSubmit}>
            {loading && <ButtonLoader color="black" />}
            Post Job
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
