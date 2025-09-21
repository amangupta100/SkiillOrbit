"use client";
import { ImageUpload } from "@/components/common/ImageUpload";
import Button from "@/components/ui/button2";
import { Checkbox } from "@/components/ui/Checkbox";
import { FileUpload } from "@/components/ui/file-upload";
import useAuthStore from "@/store/authStore";
import API from "@/utils/interceptor";
import Cookies from "js-cookie";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { toast } from "sonner";

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

const page = () => {
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    domain: "",
    role: "",
    skills: [],
  });
  const [suggestions, setSuggestions] = useState({
    domains: [],
    roles: [],
    skills: [],
  });
  const [currentSkillInput, setCurrentSkillInput] = useState("");
  const [loading, setLoading] = useState({
    domains: false,
    roles: false,
    skills: false,
  });
  const [btnLoading, setBtnLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const isProceedActive = selectedOption !== null;
  const [showContent, setContent] = useState(null);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [databyMethod, setdatabyMethod] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [inpResumeData, setInpResumeData] = useState(null);
  const [imageUpload, setImageUpload] = useState(false);

  const handleCheckboxChange = (option) => {
    setSelectedOption(option === selectedOption ? null : option);
  };

  // Refs for each input field
  const domainInputRef = useRef(null);
  const roleInputRef = useRef(null);
  const skillInputRef = useRef(null);

  const searchDomains = useCallback(
    debounce(async (query) => {
      if (!query) {
        setSuggestions((prev) => ({ ...prev, domains: [] }));
        return;
      }
      try {
        setLoading((prev) => ({ ...prev, domains: true }));
        const response = await API.get("/job-seeker/getDomain", {
          params: { type: "domains", q: query },
        });
        setSuggestions((prev) => ({ ...prev, domains: response.data }));
      } catch (error) {
        console.error("Error fetching domains:", error);
      } finally {
        setLoading((prev) => ({ ...prev, domains: false }));
      }
    }, 300),
    []
  );

  const searchRoles = useCallback(
    debounce(async (query) => {
      if (!query) {
        setSuggestions((prev) => ({ ...prev, roles: [] }));
        return;
      }
      try {
        setLoading((prev) => ({ ...prev, roles: true }));
        const response = await API.get("/job-seeker/getRoles", {
          params: { type: "roles", q: query, domain: formData.domain },
        });
        setSuggestions((prev) => ({
          ...prev,
          roles: response.data.map((role) => role.title),
        }));
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoading((prev) => ({ ...prev, roles: false }));
      }
    }, 300),
    [formData.domain]
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
        setSuggestions((prev) => ({ ...prev, skills: response.data }));
      } catch (error) {
        console.error("Error fetching skills:", error);
      } finally {
        setLoading((prev) => ({ ...prev, skills: false }));
      }
    }, 300),
    []
  );

  const handleDomainChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, domain: value, role: "" }));
    searchDomains(value);
  };

  const selectDomain = (domain) => {
    setFormData((prev) => ({ ...prev, domain }));
    setSuggestions((prev) => ({ ...prev, domains: [] }));
    domainInputRef.current?.focus();
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, role: value }));
    searchRoles(value);
  };

  const selectRole = (role) => {
    setFormData((prev) => ({ ...prev, role }));
    setSuggestions((prev) => ({ ...prev, roles: [] }));
    roleInputRef.current?.focus();
  };

  const handleSkillInputChange = (e) => {
    const value = e.target.value;
    setCurrentSkillInput(value);
    searchSkills(value);
  };

  const addSkill = (skill) => {
    if (!formData.skills.includes(skill)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
    }
    setCurrentSkillInput("");
    setSuggestions((prev) => ({ ...prev, skills: [] }));
    skillInputRef.current?.focus();
  };

  const removeSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  useEffect(() => {
    const ResumeDataToken = Cookies.get("rDV");
    const getResumeData = async () => {
      const resp = await API.get("/auth/getResumeData");
      setResumeData(resp.data.decoded);
      setdatabyMethod("Resume");
      const data =
        typeof resp.data.decoded.resumeData === "string"
          ? JSON.parse(resp.data.decoded.resumeData)
          : resp.data.decoded.resumeData;

      // 4. Set the structured data in state
      setInpResumeData({
        candidate: {
          role: data.candidate?.role || "",
          summary: data.candidate?.summary || "",
        },
        skills: {
          technical: data.skills?.technical || [],
          languages: data.skills?.languages || [],
          tools: data.skills?.tools || [],
          certifications: data.skills?.certifications || [],
        },
        experience: data.experience || [],
        education: data.education || [],
        projects: data.projects || [],
        achievements: data.achievements || [],
      });
    };

    ResumeDataToken ? getResumeData() : null;
  }, []);

  console.log(inpResumeData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get userId from localStorage
      const userId = localStorage.getItem("userId");

      // Prepare the request data combining formData and userId
      const requestData = {
        ...formData,
        userId: userId,
      };
      setBtnLoading(true);
      // Make the API call
      const resp = await API.post("/auth/uploadDomainData", requestData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const { success: succ, message } = resp.data;

      if (succ) {
        toast.success(message);
        // localStorage.removeItem("userId");
        // localStorage.removeItem("image-upload");
        // window.location.href = "/userDashboard";
        setImageUpload(true);
      } else toast.warning(message);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setBtnLoading(false);
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
    <div className="w-full min-h-[calc(100vh-4rem)] flex justify-center items-center bg-transparent">
      {imageUpload && (
        <ImageUpload
          setImageUpload={setImageUpload}
          imageUpload={imageUpload}
          onClose={() => setImageUpload(false)}
          data="Register"
        />
      )}

      <div className="lg:w-[50%] md:w-[84%] sm:w-[90%] w-[95%] relative sm:mx-0 py-8 px-5 mx-auto h-[50%] border-[1.6px] border-zinc-300 border-dashed">
        {selectedOption && showContent && (
          <Button
            onClick={() => {
              setSelectedOption(null);
              setContent(null);
            }}
            className="absolute top-3 left-3 max-w-fit bg-black hover:bg-black/70 duration-300"
          >
            Go back
          </Button>
        )}
        <h2 className="text-xl text-center font-bold mb-4">Profile Setup</h2>

        {selectedOption && showContent ? (
          selectedOption === "Upload Resume" ? (
            <div className="py-3">
              <FileUpload data={"Resume"} />
            </div>
          ) : (
            <div className="">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Domain Field */}
                <div>
                  <label className="block mb-1">Domain</label>
                  <input
                    ref={domainInputRef}
                    type="text"
                    value={formData.domain}
                    onChange={handleDomainChange}
                    className="w-full p-2 border rounded"
                    placeholder="e.g. Software Engineering"
                  />
                  {loading.domains ? (
                    <SkeletonLoader count={3} />
                  ) : (
                    suggestions.domains.length > 0 && (
                      <ul className="mt-1 border rounded">
                        {suggestions.domains.map((domain, i) => (
                          <li
                            key={i}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectDomain(domain)}
                          >
                            {domain}
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </div>

                {/* Role Field */}
                <div>
                  <label className="block mb-1">Role</label>
                  <input
                    ref={roleInputRef}
                    type="text"
                    value={formData.role}
                    onChange={handleRoleChange}
                    className="w-full p-2 border rounded"
                    placeholder="e.g. Frontend Developer"
                    disabled={!formData.domain}
                  />
                  {loading.roles ? (
                    <SkeletonLoader count={3} />
                  ) : (
                    suggestions.roles.length > 0 && (
                      <ul className="mt-1 border rounded">
                        {suggestions.roles.map((role, i) => (
                          <li
                            key={i}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectRole(role)}
                          >
                            {role}
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </div>

                {/* Skills Field */}
                <div>
                  <label className="block mb-1">Skills</label>
                  <input
                    ref={skillInputRef}
                    type="text"
                    value={currentSkillInput}
                    onChange={handleSkillInputChange}
                    className="w-full p-2 border rounded"
                    placeholder="Add skills"
                  />
                  {loading.skills ? (
                    <SkeletonLoader count={3} />
                  ) : (
                    suggestions.skills.length > 0 && (
                      <ul className="mt-1 border rounded">
                        {suggestions.skills.map((skill, i) => (
                          <li
                            key={i}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => addSkill(skill)}
                          >
                            {skill}
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills.map((skill, i) => (
                      <div
                        key={i}
                        className="flex items-center bg-gray-200 px-2 py-1 rounded"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={btnLoading}
                  canSubmit={
                    formData.domain &&
                    formData.role &&
                    formData.skills.length > 0
                  }
                  className="bg-black w-fit p-2 hover:*bg-black/70 duration-300"
                >
                  Save Profile
                </Button>
              </form>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center mt-12">
            <div className="flex items-center">
              <Checkbox
                onCheckedChange={() => handleCheckboxChange("Upload Resume")}
                className="border-[1.6px] border-zinc-300 cursor-pointer"
              />
              <label htmlFor="" className="ml-2">
                Upload Resume
              </label>
            </div>

            <div className="flex w-full my-3 items-center">
              <p className="w-[100%] h-[1.3px] bg-gray-300"></p>
              <p className="mx-2">or</p>
              <p className="w-[100%] h-[1.5px] bg-gray-300"></p>
            </div>

            <div className="flex items-center">
              <Checkbox
                onCheckedChange={() => handleCheckboxChange("Fill")}
                className="border-[1.6px] border-zinc-300 cursor-pointer"
              />
              <label htmlFor="" className="ml-2">
                Fill Manually
              </label>
            </div>

            <Button
              type="submit"
              canSubmit={isProceedActive}
              onClick={() => setContent("Show")}
              className="bg-black text-white mt-4 max-w-fit"
            >
              Proceed
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default page;
