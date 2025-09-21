"use client";
import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import API from "@/utils/interceptor";
import { X } from "lucide-react";
import API2 from "@/utils/interceptor2";
import { toast } from "sonner";
import ButtonLoader from "@/utils/Loader";
import useAuthStore from "@/store/authStore";
import RotateDevice from "@/lib/common/RotateDevice";

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export default function InterviewTypeSelection() {
  // State for each interview type
  const [technicalData, setTechnicalData] = useState({
    role: "",
    skills: [],
    domain: "",
  });
  const [hrData, setHrData] = useState({ role: "" });
  const [behavioralData, setBehavioralData] = useState({
    role: "",
  });
  const [otherData, setOtherData] = useState({ interviewType: "", role: "" });
  const { user } = useAuthStore();

  const [suggestions, setSuggestions] = useState({ roles: [], skills: [] });
  const [loading, setLoading] = useState({ roles: false, skills: false });
  const [skillsInputValue, setSkillsInputValue] = useState("");
  const [loading2, setLoading2] = useState(false);
  const [showRoleSuggestions, setShowRoleSuggestions] = useState({
    technical: false,
    hr: false,
    behavioral: false,
    other: false,
  });
  const [notallowedToOpen, setnotAllowedToOpen] = useState(false);

  const handleStart = async () => {
    if (window.innerWidth < 768) {
      setnotAllowedToOpen(true);
      return;
    }

    const dataSend = {
      role: technicalData.role,
      skills: technicalData.skills,
      interview_type: "Technical Interview",
      name: user?.name,
    };
    setLoading2(true);
    try {
      const req = await API2.post("/tts/create-session", dataSend);
      const { data, success: succ, message } = req.data;

      if (succ) {
        window.location.href = `/userDashboard/interviewPreparation/interview`;
      } else {
        toast.error(message);
      }
    } catch (error) {
      toast.error("Failed to start interview");
      console.error("Error starting interview:", error);
    } finally {
      setLoading2(false);
    }
  };

  const handleStartHR = async () => {
    if (window.innerWidth < 768) {
      setnotAllowedToOpen(true);
      return;
    }

    const dataSend = {
      role: hrData.role,
      interview_type: "HR Interview",
      name: user?.name,
    };

    setLoading2(true);
    try {
      const req = await API2.post("/tts/create-session", dataSend);
      const { data, success: succ, message } = req.data;

      if (succ) {
        window.location.href = `/userDashboard/interviewPreparation/interview`;
      } else {
        toast.error(message);
      }
    } catch (error) {
      toast.error("Failed to start interview");
      console.error("Error starting interview:", error);
    } finally {
      setLoading2(false);
    }
  };

  const handleStartBehavioral = async () => {
    if (window.innerWidth < 768) {
      setnotAllowedToOpen(true);
      return;
    }
    const dataSend = {
      role: behavioralData.role,
      interview_type: "Behavioral Interview",
      name: user?.name,
    };

    setLoading2(true);
    try {
      const req = await API2.post("/tts/create-session", dataSend);
      const { data, success: succ, message } = req.data;

      if (succ) {
        window.location.href = `/userDashboard/interviewPreparation/interview`;
      } else {
        toast.error(message);
      }
    } catch (error) {
      toast.error("Failed to start interview");
      console.error("Error starting interview:", error);
    } finally {
      setLoading2(false);
    }
  };

  const handleStartOtherInt = async () => {
    if (window.innerWidth < 768) {
      setnotAllowedToOpen(true);
      return;
    }
    const dataSend = {
      role: otherData.role,
      interview_type: "Other Interview Round",
      name: user?.name,
    };

    setLoading2(true);
    try {
      const req = await API2.post("/tts/create-session", dataSend);
      const { data, success: succ, message } = req.data;

      if (succ) {
        window.location.href = `/userDashboard/interviewPreparation/interview`;
      } else {
        toast.error(message);
      }
    } catch (error) {
      toast.error("Failed to start interview");
      console.error("Error starting interview:", error);
    } finally {
      setLoading2(false);
    }
  };

  // -------- API Calls --------
  const searchRoles = useCallback(
    debounce(async (query, tabType) => {
      if (!query) {
        setSuggestions((prev) => ({ ...prev, roles: [] }));
        setShowRoleSuggestions((prev) => ({ ...prev, [tabType]: false }));
        return;
      }
      try {
        setLoading((prev) => ({ ...prev, roles: true }));
        const response = await API.get("/job-seeker/getRoles", {
          params: {
            type: "roles",
            q: query,
            domain: user?.domain || "",
          },
        });

        // Handle different response structures
        let rolesData = [];
        if (Array.isArray(response.data)) {
          // If response.data is already an array
          rolesData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          // If response.data has a data property that's an array
          rolesData = response.data.data;
        } else if (response.data && Array.isArray(response.data.roles)) {
          // If response.data has a roles property that's an array
          rolesData = response.data.roles;
        }

        // Extract role titles - handle different object structures
        const roleTitles = rolesData.map((role) => {
          if (typeof role === "string") return role;
          return (
            role.title ||
            role.name ||
            role.role ||
            role.value ||
            JSON.stringify(role)
          );
        });

        setSuggestions((prev) => ({
          ...prev,
          roles: roleTitles,
        }));
        setShowRoleSuggestions((prev) => ({
          ...prev,
          [tabType]: roleTitles.length > 0,
        }));
      } catch (error) {
        console.error("Error fetching roles:", error);
        setShowRoleSuggestions((prev) => ({ ...prev, [tabType]: false }));
      } finally {
        setLoading((prev) => ({ ...prev, roles: false }));
      }
    }, 300),
    [user?.domain]
  );

  const searchSkills = useCallback(
    debounce(async (query) => {
      if (!query) {
        setSuggestions((prev) => ({ ...prev, skills: [] }));
        return;
      }
      try {
        setLoading((prev) => ({ ...prev, skills: true }));
        const response = await API.get("/job-seeker/getSkills", {
          params: { type: "skills", q: query },
        });

        // Handle different response structures for skills
        let skillsData = [];
        if (Array.isArray(response.data)) {
          skillsData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          skillsData = response.data.data;
        } else if (response.data && Array.isArray(response.data.skills)) {
          skillsData = response.data.skills;
        }

        setSuggestions((prev) => ({ ...prev, skills: skillsData }));
      } catch (error) {
        console.error("Error fetching skills:", error);
      } finally {
        setLoading((prev) => ({ ...prev, skills: false }));
      }
    }, 300),
    []
  );

  const handleSkillSelect = (skill) => {
    if (!technicalData.skills.includes(skill)) {
      setTechnicalData({
        ...technicalData,
        skills: [...technicalData.skills, skill],
      });
    }
    setSkillsInputValue("");
    setSuggestions((prev) => ({ ...prev, skills: [] }));
  };

  const removeSkill = (skillToRemove) => {
    setTechnicalData({
      ...technicalData,
      skills: technicalData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const handleInputKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      skillsInputValue.trim() &&
      !technicalData.skills.includes(skillsInputValue.trim())
    ) {
      e.preventDefault();
      handleSkillSelect(skillsInputValue.trim());
    }
  };

  const handleRoleSelect = (role, tabType) => {
    switch (tabType) {
      case "technical":
        setTechnicalData({ ...technicalData, role });
        break;
      case "hr":
        setHrData({ ...hrData, role });
        break;
      case "behavioral":
        setBehavioralData({ ...behavioralData, role });
        break;
      case "other":
        setOtherData({ ...otherData, role });
        break;
    }
    setShowRoleSuggestions((prev) => ({ ...prev, [tabType]: false }));
  };

  if (notallowedToOpen) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <RotateDevice />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Select Interview Type</h1>

      <Tabs defaultValue="technical" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="hr">HR</TabsTrigger>
          <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        {/* ------------------ Technical ------------------ */}
        <TabsContent value="technical">
          <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <h2 className="text-xl font-semibold mb-2">Technical Interview</h2>

            {/* Role with suggestions */}
            <div className="flex flex-col space-y-1 mt-7 relative">
              <Label htmlFor="tech-role">Role</Label>
              <Input
                id="tech-role"
                value={technicalData.role}
                placeholder="Type to search role..."
                onChange={(e) => {
                  setTechnicalData({ ...technicalData, role: e.target.value });
                  searchRoles(e.target.value, "technical");
                }}
                onFocus={() => {
                  if (technicalData.role && suggestions.roles.length > 0) {
                    setShowRoleSuggestions((prev) => ({
                      ...prev,
                      technical: true,
                    }));
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setShowRoleSuggestions((prev) => ({
                      ...prev,
                      technical: false,
                    }));
                  }, 200);
                }}
              />
              {showRoleSuggestions.technical &&
                suggestions.roles.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 border rounded-md mt-1 bg-white shadow-lg max-h-40 overflow-y-auto z-10">
                    {suggestions.roles.map((role, idx) => (
                      <li
                        key={idx}
                        onMouseDown={() => handleRoleSelect(role, "technical")}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {role}
                      </li>
                    ))}
                  </ul>
                )}
            </div>

            {/* Skills Combobox */}
            <div className="flex flex-col space-y-1 mt-3">
              <Label htmlFor="tech-skills">Skills</Label>
              <Command className="border rounded-md">
                <CommandInput
                  placeholder="Search skills or type to add..."
                  value={skillsInputValue}
                  onValueChange={(val) => {
                    setSkillsInputValue(val);
                    searchSkills(val);
                  }}
                  onKeyDown={handleInputKeyDown}
                />
                <CommandList>
                  <CommandEmpty>
                    {skillsInputValue
                      ? "No skills found. Press Enter to add custom skill."
                      : "Type to search skills..."}
                  </CommandEmpty>
                  <CommandGroup>
                    {suggestions.skills
                      .filter((skill) => !technicalData.skills.includes(skill))
                      .map((skill, idx) => (
                        <CommandItem
                          key={idx}
                          onSelect={() => handleSkillSelect(skill)}
                        >
                          {skill}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>

              {/* Selected skills chips */}
              {technicalData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {technicalData.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="button"
              disabled={
                !technicalData.role ||
                technicalData.skills.length === 0 ||
                loading2
              }
              onClick={handleStart}
            >
              {loading2 && <ButtonLoader />}
              Start
            </Button>
          </div>
        </TabsContent>

        {/* ------------------ HR ------------------ */}
        <TabsContent value="hr">
          <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <h2 className="text-xl font-semibold mb-2">HR Interview</h2>
            <div className="flex flex-col space-y-1 mt-7 relative">
              <Label htmlFor="hr-role">Role</Label>
              <Input
                id="hr-role"
                value={hrData.role}
                placeholder="Type to search role..."
                onChange={(e) => {
                  setHrData({ ...hrData, role: e.target.value });
                  searchRoles(e.target.value, "hr");
                }}
                onFocus={() => {
                  if (hrData.role && suggestions.roles.length > 0) {
                    setShowRoleSuggestions((prev) => ({ ...prev, hr: true }));
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setShowRoleSuggestions((prev) => ({ ...prev, hr: false }));
                  }, 200);
                }}
              />
              {showRoleSuggestions.hr && suggestions.roles.length > 0 && (
                <ul className="absolute top-full left-0 right-0 border rounded-md mt-1 bg-white shadow-lg max-h-40 overflow-y-auto z-10">
                  {suggestions.roles.map((role, idx) => (
                    <li
                      key={idx}
                      onMouseDown={() => handleRoleSelect(role, "hr")}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {role}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button
              type="button"
              disabled={!hrData.role || loading2}
              onClick={handleStartHR}
            >
              Start
            </Button>
          </div>
        </TabsContent>

        {/* ------------------ Behavioral ------------------ */}
        <TabsContent value="behavioral">
          <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <h2 className="text-xl font-semibold mb-2">Behavioral Interview</h2>
            <div className="flex flex-col space-y-1 mt-7 relative">
              <Label htmlFor="beh-role">Role</Label>
              <Input
                id="beh-role"
                value={behavioralData.role}
                placeholder="Type to search role..."
                onChange={(e) => {
                  setBehavioralData({
                    ...behavioralData,
                    role: e.target.value,
                  });
                  searchRoles(e.target.value, "behavioral");
                }}
                onFocus={() => {
                  if (behavioralData.role && suggestions.roles.length > 0) {
                    setShowRoleSuggestions((prev) => ({
                      ...prev,
                      behavioral: true,
                    }));
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setShowRoleSuggestions((prev) => ({
                      ...prev,
                      behavioral: false,
                    }));
                  }, 200);
                }}
              />
              {showRoleSuggestions.behavioral &&
                suggestions.roles.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 border rounded-md mt-1 bg-white shadow-lg max-h-40 overflow-y-auto z-10">
                    {suggestions.roles.map((role, idx) => (
                      <li
                        key={idx}
                        onMouseDown={() => handleRoleSelect(role, "behavioral")}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      >
                        {role}
                      </li>
                    ))}
                  </ul>
                )}
              {loading.roles && (
                <div className="absolute right-2 top-8">
                  <ButtonLoader size="sm" />
                </div>
              )}
            </div>

            <Button
              type="button"
              disabled={!behavioralData.role || loading2}
              onClick={() => handleStartBehavioral()}
            >
              Start
            </Button>
          </div>
        </TabsContent>

        {/* ------------------ Other ------------------ */}
        <TabsContent value="other">
          <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
            <h2 className="text-xl font-semibold mb-2">Other Interview</h2>
            <div className="flex flex-col space-y-1 mt-7">
              <Label htmlFor="other-type">Interview Type</Label>
              <Input
                id="other-type"
                value={otherData.interviewType}
                placeholder="Enter interview type"
                onChange={(e) =>
                  setOtherData({ ...otherData, interviewType: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col space-y-1 relative">
              <Label htmlFor="other-role">Role</Label>
              <Input
                id="other-role"
                value={otherData.role}
                placeholder="Type to search role..."
                onChange={(e) => {
                  setOtherData({ ...otherData, role: e.target.value });
                  searchRoles(e.target.value, "other");
                }}
                onFocus={() => {
                  if (otherData.role && suggestions.roles.length > 0) {
                    setShowRoleSuggestions((prev) => ({
                      ...prev,
                      other: true,
                    }));
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setShowRoleSuggestions((prev) => ({
                      ...prev,
                      other: false,
                    }));
                  }, 200);
                }}
              />
              {showRoleSuggestions.other && suggestions.roles.length > 0 && (
                <ul className="absolute top-full left-0 right-0 border rounded-md mt-1 bg-white shadow-lg max-h-40 overflow-y-auto z-10">
                  {suggestions.roles.map((role, idx) => (
                    <li
                      key={idx}
                      onMouseDown={() => handleRoleSelect(role, "other")}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {role}
                    </li>
                  ))}
                </ul>
              )}
              {loading.roles && (
                <div className="absolute right-2 top-8">
                  <ButtonLoader size="sm" />
                </div>
              )}
            </div>
            <Button
              type="button"
              disabled={!otherData.interviewType || loading2}
              onClick={handleStartOtherInt}
            >
              Start
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
