"use client";
import { useEffect, useState, useRef } from "react";
import { recruiterProfileFields } from "@/app/(auth)/InputFields";
import API from "@/utils/interceptor";
import { toast } from "sonner";
import { UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import useRecruiterAuthStore from "@/store/recruiter/recruiterauthStore";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function ProfileSetup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    company: "",
    companyWebsite: "",
    companySize: "",
    industryType: "",
    linkedin: "",
    aboutCompany: "",
    companyTagline: "",
    companyType: "",
    foundyear: "", // Add this
    headquarterLocation: "",
    twitter: "",
  });
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const { setAuth } = useRecruiterAuthStore();
  // ==============================
  // 💠 LOCATION AUTOCOMPLETE STATES
  // ==============================
  const [locQuery, setLocQuery] = useState("");
  const [locResults, setLocResults] = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const locRef = useRef(null);

  // ==============================
  // Fetch Location Suggestions
  // ==============================
  const fetchLocationSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setLocResults([]);
      return;
    }

    try {
      setLocLoading(true);

      const res = await API.get(
        `/common/getExternalAPI/getLocation?q=${encodeURIComponent(query)}`
      );

      setLocResults(res.data?.data.search_result || []);
      setShowLocDropdown(true);
    } catch (error) {
      console.log("Location search error:", error);
    } finally {
      setLocLoading(false);
    }
  };

  // Debounce input 400ms
  useEffect(() => {
    const timer = setTimeout(() => fetchLocationSuggestions(locQuery), 400);
    return () => clearTimeout(timer);
  }, [locQuery]);

  // ==============================
  // CLICK OUTSIDE → CLOSE DROPDOWN
  // ==============================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locRef.current && !locRef.current.contains(e.target)) {
        setShowLocDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Load initial data from localStorage
    const storedData = localStorage.getItem("RecruiterData");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setFormData((prev) => ({
        ...prev,
        ...parsedData,
      }));
    }

    // Check for existing logo in localStorage
    const storedLogo = localStorage.getItem("RecruiterLogo");
    if (storedLogo) {
      setLogoPreview(storedLogo);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match("image.*")) {
      toast.warning("Please upload an image file");
      return;
    }

    // Validate file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.warning("File size should be less than 4MB");
      return;
    }

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    localStorage.removeItem("RecruiterLogo");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Regex patterns for URL validation
  const LINKEDIN_REGEX =
    /^https?:\/\/(www\.)?linkedin\.com\/(in\/|company\/|school\/|groups\/)?[a-zA-Z0-9\-._\/]+$/i;
  const TWITTER_REGEX = /^https?:\/\/(twitter\.com|x\.com)\/[a-zA-Z0-9_]+$/i;
  const GENERAL_URL_REGEX =
    /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)$/i;

  const isValidUrl = (url, fieldName) => {
    if (!url || !url.trim()) return false;
    const trimmedUrl = url.trim();
    switch (fieldName) {
      case "linkedin":
        return LINKEDIN_REGEX.test(trimmedUrl);
      case "twitter":
        return TWITTER_REGEX.test(trimmedUrl);
      case "companyWebsite":
        return GENERAL_URL_REGEX.test(trimmedUrl);
      default:
        return false;
    }
  };

  const getFormErrors = () => {
    const requiredFields = recruiterProfileFields.filter(
      (field) => field.required
    );
    const errors = [];

    // Check required fields
    requiredFields.forEach((field) => {
      const value = formData[field.name]?.toString().trim();
      if (!value) {
        errors.push(`${field.label} is required`);
        return;
      }
      if (field.type === "number") {
        if (isNaN(Number(value))) {
          errors.push(`${field.label} must be a valid number`);
        }
      }
      if (field.type === "url") {
        if (!isValidUrl(value, field.name)) {
          const platform =
            field.name === "linkedin" ? "valid LinkedIn" : "valid";
          errors.push(`${field.label} must be a ${platform} URL`);
        }
      }
    });

    // Check logo
    if (!logoPreview) {
      errors.push("Company logo upload is required");
    }

    // Optional Twitter URL validation (only if filled, and add to errors if invalid)
    if (formData.twitter && !isValidUrl(formData.twitter, "twitter")) {
      errors.push("Twitter URL must be valid (if provided)");
    }

    return errors;
  };

  const isFormComplete = () => {
    const errors = getFormErrors();
    return errors.length === 0;
  };

  const fileToBase64 = (file) => {
    // FIXED: Early reject if no valid file
    if (!file || !(file instanceof File || file instanceof Blob)) {
      return Promise.reject(
        new Error("Invalid file: Not a Blob or File object")
      );
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();

      // append text fields
      Object.keys(formData).forEach((key) => {
        fd.append(key, formData[key]);
      });

      // append file
      if (logoFile) fd.append("logo", logoFile);

      const response = await API.post("/recruiter/auth/register", fd);

      const { success, message } = response.data;

      if (success) {
        toast.success(message);

        // send greet mail
        // await API.post("/recruiter/sendMail/greetRec", {
        //   email: formData.email,
        //   name: formData.name,
        // });

        localStorage.removeItem("RecruiterData");
        localStorage.removeItem("RecruiterLogo");

        window.location.href = "/recruiterDashboard";
      } else {
        toast.warning(message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const errors = getFormErrors();

  return (
    <div className="py-10 max-w-2xl sm:max-w-6xl border-[1.6px] border-zinc-200 rounded-lg my-20 sm:mx-auto px-4">
      <h1 className="text-2xl sm:text-2xl font-bold mb-8 text-center">
        Complete Your Profile
      </h1>

      <div className="flex flex-col justify-center md:flex-row gap-8 md:mb-8">
        {/* Logo Upload Section */}
        <div className="md:w-1/3 flex flex-col items-center">
          <div className="w-full max-w-xs mb-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {logoPreview ? (
                <div className="relative">
                  <Image
                    width={150}
                    height={150}
                    src={logoPreview}
                    alt="Company logo preview"
                    className="w-full h-auto max-h-64 object-contain rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute cursor-pointer -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="py-8">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm text-gray-600">
                    <label
                      htmlFor="logo-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="logo-upload"
                        name="logo-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        accept="image/*"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG up to 4MB
                  </p>
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Upload your company logo (required)
          </p>
        </div>

        {/* Form Section */}
        <div className="md:w-2/3">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recruiterProfileFields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>

                  {/* ==============================
              SPECIAL FIELD: LOCATION AUTOCOMPLETE
           =============================== */}
                  {field.name === "headquarterLocation" ? (
                    <div className="relative" ref={locRef}>
                      <input
                        type="text"
                        name="headquarterLocation"
                        value={formData.headquarterLocation}
                        onChange={(e) => {
                          setLocQuery(e.target.value);
                          setFormData({
                            ...formData,
                            headquarterLocation: e.target.value,
                          });
                        }}
                        className="w-full px-4 py-2 border rounded-md"
                        placeholder="Enter location"
                        autoComplete="off"
                        required={field.required}
                      />

                      {/* Loader Spinner */}
                      {locLoading && (
                        <div className="absolute right-3 top-3 w-4 h-4 border-2 border-gray-400 border-t-transparent animate-spin rounded-full"></div>
                      )}

                      {/* DROPDOWN */}
                      {showLocDropdown && (
                        <div className="absolute bg-white border rounded shadow-lg w-full mt-1 z-[500] max-h-64 overflow-y-auto">
                          {/* Loading Skeleton */}
                          {locLoading && (
                            <>
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className="p-3 border-b animate-pulse"
                                >
                                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                                  <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                                </div>
                              ))}
                            </>
                          )}

                          {/* Results */}
                          {!locLoading && locResults.length > 0 && (
                            <>
                              {locResults.map((item, i) => (
                                <div
                                  key={i}
                                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                  onClick={() => {
                                    const combined = `${item.placeName}  - ${item.description}`;
                                    setFormData({
                                      ...formData,
                                      headquarterLocation: combined,
                                    });

                                    setLocQuery(combined); // set input visible value
                                    setShowLocDropdown(false);
                                  }}
                                >
                                  <p className="font-medium">
                                    {item.placeName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {item.description}
                                  </p>
                                </div>
                              ))}
                            </>
                          )}

                          {/* No Results */}
                          {!locLoading &&
                            locResults.length === 0 &&
                            locQuery.length > 2 && (
                              <p className="p-3 text-gray-500 text-sm">
                                No results found
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  ) : field.type === "select" ? (
                    /* ==============================  
               SELECT FIELDS  
             ============================== */
                    <select
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-md"
                      required={field.required}
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    /* ==============================  
               TEXTAREA FIELDS  
             ============================== */
                    <textarea
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2 border rounded-md"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : (
                    /* ==============================  
               NORMAL INPUT FIELDS  
             ============================== */
                    <input
                      type={field.type || "text"}
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-md"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* ==============================
       SUBMIT BUTTON + ERRORS
     ============================== */}
            <div className="flex flex-col">
              <Button
                disabled={!isFormComplete() || loading}
                className="bg-black text-white text-base w-full"
              >
                {loading ? "Processing..." : "Complete Profile"}
              </Button>

              {errors.length > 0 && (
                <div className="mt-2 w-full">
                  <ul className="text-red-500 text-sm space-y-1 max-w-md mx-auto">
                    {errors.map((error, index) => (
                      <li key={index} className="flex items-center">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
