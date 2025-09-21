import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  IconUpload,
  IconFileTypePdf,
  IconFileTypeDocx,
  IconX,
} from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import API from "@/utils/interceptor";
import useAuthStore from "@/store/authStore";
import ButtonLoader from "@/utils/Loader";
import API2 from "@/utils/interceptor2";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FaFilePdf, FaFileWord } from "react-icons/fa";
import { ImageUpload } from "../common/ImageUpload";

const genAI = new GoogleGenerativeAI("AIzaSyD9zE89oUuo-UBw4CPu4rLtZSQTx7bpDbE");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

const PdfIcon = FaFilePdf;
const WordIcon = FaFileWord;

export const FileUpload = ({
  onChange,
  onSkip,
  onUpload,
  setImageUpload,
  profileChange,
  close,
  data,
}) => {
  const [files, setFiles] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const [loaderStatus, setLoaderStatus] = useState(null);
  const [imageUploadState, setImageUploadState] = useState(false);

  const handleFileChange = (newFiles) => {
    // Filter based on whether we're handling images or documents
    const allowedTypes =
      data === "Resume"
        ? [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ]
        : ["image/*"];

    const filteredFiles = newFiles.filter((file) => {
      if (data === "Resume") {
        return (
          file.type === "application/pdf" ||
          file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
      }
      return file.type.startsWith("image/");
    });

    if (filteredFiles.length === 0) {
      toast.warning(
        data === "Resume"
          ? "Please upload a PDF or DOCX file."
          : "Please upload an image file."
      );
      return;
    }

    setFiles(filteredFiles);

    // Generate preview for images only
    if (data !== "Resume" && filteredFiles[0].type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(filteredFiles[0]);
    }

    onChange && onChange(filteredFiles);
  };

  const generateResumePrompt = (extractedText) => `
**Objective**: Analyze the following resume text and extract structured information in JSON format.

**Input Resume Text**:
"""
${extractedText}
"""

**Required Output Structure**:
{
  "candidate": {
    "domain:"string Example: "Software Engineer","DevOps / Cloud / Infrastructure","Data / AI / ML","Testing / QA","Product / Project / Management","Cybersecurity",
    "role": "string (job title)",
    "summary": "string (2-3 sentence professional summary)"
  },
  "skills": ['string'],
  "experience": [
    {
      "company": "string",
      "position": "string",
      "duration": "string (YYYY-YYYY)",
      "achievements": ["string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "year": "string (YYYY)"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"]
    }
  ],
  "achievements": ["string"],
  "certifications":["string"]
}

**Extraction Rules**:
1. Normalize all dates to YYYY format (e.g., "2019-2021")
2. Categorize skills properly:
   - Programming languages → "languages"
   - Frameworks/libs → "technical"
   - DevOps tools → "tools"
3. For experience:
   - Include only professional positions (no internships unless specified)
   - Extract 3-5 key achievements per role
4. For education:
   - Include only degree-level education
5. Formatting:
   - Remove special characters (•, -, *) from lists
   - Capitalize proper nouns consistently

**Special Cases Handling**:
- If duration says "Present", use "2023" as end year
- Convert common abbreviations:
  - "JS" → "JavaScript"
  - "ReactJS" → "React"
  - "AWS" → "Amazon Web Services"
- Ignore personal contact information

**Example Output**:
{
  "candidate": {
    "domain:"Software Engineer",
    "role": "Senior Software Engineer",
    "summary": "Full-stack developer with 5+ years experience..."
  },
  "skills": ["string"],
  "experience": [
    {
      "company": "Google",
      "position": "Software Engineer",
      "duration": "2019-2023",
      "achievements": [
        "Optimized API response time by 40%",
        "Led migration to microservices architecture"
      ]
    }
  ],
  "education": [
    {
      "degree": "B.S. Computer Science",
      "institution": "MIT",
      "year": "2019"
    }
  ],
  "projects": [
    {
      "name": "E-commerce Platform",
      "description": "Built a full-stack solution with React and Node.js",
      "technologies": ["React", "Node.js", "MongoDB"]
    }
  ],
  "achievements": [
    "Employee of the Month - June 2022",
    "Published paper on Machine Learning"
  ],
  "certification":[
  "Got certified in Django by Google"
  ]
}`;

  useEffect(() => {
    if (profileChange) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    accept:
      data === "Resume"
        ? {
            "application/pdf": [".pdf"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
              [".docx"],
          }
        : { "image/*": [] },
    onDrop: handleFileChange,
    onDropRejected: () => {
      toast.warning(
        data === "Resume"
          ? "Only PDF and DOCX files are allowed."
          : "Only image files are allowed."
      );
    },
  });

  const handleResumeUpload = async () => {
    if (files.length === 0) {
      toast.warning("Please select a resume to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", files[0]);

    setLoading(true);
    try {
      setLoaderStatus("Parsing Resume...");
      const parseText = await API2.post("/getResumeData", formData);
      const { success, data, message } = parseText.data;

      if (success) {
        setLoaderStatus("Getting Data...");
        const data2 = await model.generateContent(
          generateResumePrompt(parseText.data.data)
        );

        const responseText = data2.response.text();
        const cleanedText = responseText.replace(/```(?:json)?\n?/g, "").trim();
        formData.append("ResumeData", cleanedText);
        formData.append("Filename", files[0].name);

        setLoaderStatus("Uploading Resume");
        const req = await API.post(
          "/job-seeker/profile/uploadResume",
          formData
        );
        const { success: succ, message } = req.data;
        if (succ) {
          toast.success(message);
          setImageUploadState(true);
          if (profileChange) {
            close();
          }
        } else toast.error(message);
      }
    } catch (error) {
      toast.error("Upload failed:", error.response?.data || error.message);
    } finally {
      setLoading(false);
      setLoaderStatus(null);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async () => {
    // Existing image upload logic remains the same
    if (files.length === 0) {
      toast.warning("Please select an image to upload.");
      return;
    }
    if (!files[0]) return;

    const formData = new FormData();
    const convertedFile = fileToBase64(files[0]);
    formData.append("image", convertedFile);
    formData.append("userId", localStorage.getItem("userId"));
    try {
      setLoading(true);
      const resp = await API.post(
        "/job-seeker/profile/uploadProfileImage",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const { success, message, user } = resp.data;

      if (success) {
        toast.success(message);
        setAuth({
          role: user.role,
          id: user.id,
          name: user.name,
          profileImg: user.profileImg,
        });
        localStorage.setItem("image-upload", false);
        setImageUpload(true);
      } else {
        toast.error(message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file) => {
    if (file.type === "application/pdf") {
      return <PdfIcon className="text-lg" />;
    }
    if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return <WordIcon className="text-lg" />;
    }
    return null;
  };

  return (
    <div
      className={`${
        profileChange
          ? "absolute overflow-y-hidden inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center"
          : null
      }`}
    >
      {imageUploadState && <ImageUpload data="Register" />}

      <div
        className={`${profileChange ? "relative w-full max-w-2xl mx-4" : null}`}
      >
        <button
          onClick={() => close()}
          className={`${
            profileChange
              ? "absolute -top-10 -right-0 p-2 rounded-full text-white cursor-pointer"
              : null
          }`}
        >
          <IconX className={`${profileChange ? "w-6 h-6" : "hidden"}`} />
        </button>

        <div className="w-full" {...getRootProps()}>
          <motion.div
            onClick={handleClick}
            whileHover="animate"
            className="p-10 group/filpe block rounded-lg cursor-pointer w-full relative overflow-hidden"
          >
            <input
              ref={fileInputRef}
              id="file-upload-handle"
              type="file"
              accept={data === "Resume" ? ".pdf,.docx" : "image/*"}
              onChange={(e) =>
                handleFileChange(Array.from(e.target.files || []))
              }
              className="hidden"
            />
            <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
              <GridPattern />
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-lg">
                Upload {data}
              </p>
              <div
                className={`${
                  profileChange
                    ? "text-white"
                    : "relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2"
                }`}
              >
                {data === "Resume"
                  ? "Drag or drop Resume (PDF or DOCX)"
                  : "Drag or drop your image here or click to upload"}
                {files.length > 0 && <p>Or Click anywhere to upload another</p>}
              </div>
              <div className="relative flex flex-col-reverse sm:flex-row items-center w-full my-5 max-w-2xl mx-auto">
                {files.length > 0 &&
                  files.map((file, idx) => (
                    <motion.div
                      key={"file" + idx}
                      layoutId={
                        idx === 0 ? "file-upload" : "file-upload-" + idx
                      }
                      className={cn(
                        "relative overflow-hidden bg-gray-300/60 dark:bg-neutral-900 flex flex-col justify-around p-4 mt-4 w-fit h-fit mx-auto rounded-md",
                        "shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {data === "Resume" ? getFileIcon(file) : null}
                        <div className="flex flex-col justify-between w-full">
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                            className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs"
                          >
                            {file.name}
                          </motion.p>
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                            className="rounded-lg md:px-2 py-1 w-fit shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input"
                          >
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                {!files.length && (
                  <motion.div
                    layoutId="file-upload"
                    variants={mainVariant}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                    className={cn(
                      "relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md",
                      "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                    )}
                  >
                    {isDragActive ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-neutral-600 flex flex-col items-center"
                      >
                        Drop it
                        <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                      </motion.p>
                    ) : (
                      <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                    )}
                  </motion.div>
                )}

                {!files.length && (
                  <motion.div
                    variants={secondaryVariant}
                    className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
                  ></motion.div>
                )}

                {previewUrl && data !== "Resume" && (
                  <div className="mt-6 flex flex-col items-center">
                    <div className="w-40 h-40 rounded-lg overflow-hidden border border-gray-300 dark:border-neutral-700 shadow">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="object-cover z-50 w-full h-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex z-50 gap-4 mt-5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    data === "Resume"
                      ? handleResumeUpload()
                      : handleImageUpload();
                  }}
                  disabled={files.length === 0 || loading}
                  className={cn(
                    "px-6 py-2 rounded-md z-[100] relative font-semibold transition",
                    files.length === 0
                      ? "bg-[#2A956B] text-white cursor-not-allowed opacity-60"
                      : "bg-gray-200 hover:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
                  )}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <ButtonLoader color="black" /> {loaderStatus}{" "}
                    </div>
                  ) : (
                    <h1 className="text-[16px] ">Upload</h1>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// GridPattern component remains the same
export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-300 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}
