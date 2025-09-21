import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { IconUpload, IconX } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import API from "@/utils/interceptor";
import ButtonLoader from "@/utils/Loader";

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

export const ImageUpload = ({ onChange, onClose, data, imageUpload }) => {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const isValidImageType = (file) => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    return validTypes.includes(file.type);
  };

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleFileChange = (newFiles) => {
    // Check if any files were selected
    if (!newFiles || newFiles.length === 0) {
      toast.error("No file selected");
      return;
    }

    // Validate file types
    const invalidFiles = newFiles.filter((file) => !isValidImageType(file));
    if (invalidFiles.length > 0) {
      toast.error("Only JPG, PNG, JPEG, or WEBP images are allowed");
      return;
    }

    // Only keep the first file if multiple are selected
    const validFiles = newFiles
      .filter((file) => isValidImageType(file))
      .slice(0, 1);
    setFiles(validFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select an image first");
      return;
    }
    if (isValidImageType(files[0])) {
      setLoading(true);
      const base64String = await fileToBase64(files[0]);
      const resp = await API.post("/job-seeker/profile/uploadProfileImage", {
        image: base64String,
        filename: files[0].name,
        filetype: files[0].type,
      });
      const { success: succ, message, userDet } = resp.data;
      if (succ) {
        if (data && data == "Register") {
          const res = await API.post("/auth/profileSetEnd");
          const { success: succ, message } = res.data;
          if (!succ) return toast.error(message);
          let dataSended = {
            name: userDet.name,
            email: userDet.email,
          };
          await API.post("/sendMail/greetUser", dataSended);
          window.location.href = "/userDashboard";
        }

        if (data && data === "UploadAnother") {
          onClose();
        }
        return toast.success(message);
      } else return toast.error(message);
    } else return toast.error("Please select a valid image file first");
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUploadAnother = () => {
    setFiles([]);
    handleClick();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      toast.error("File type not supported. Only images are allowed.");
    },
  });

  return (
    <div className="absolute overflow-y-hidden inset-0 z-[999] bg-black/70 backdrop-blur-md flex items-center justify-center">
      <div className="relative w-full max-w-2xl mx-4">
        {imageUpload && (
          <button
            onClick={onClose}
            className="absolute -top-10 -right-0 p-2 rounded-full text-white cursor-pointer"
          >
            <IconX className={`${imageUpload ? "hidden" : "w-6 h-6"}`} />
          </button>
        )}

        <div className="w-full" {...getRootProps()}>
          <motion.div
            whileHover="animate"
            className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden bg-white dark:bg-neutral-900"
          >
            <input
              ref={fileInputRef}
              id="file-upload-handle"
              type="file"
              onChange={(e) =>
                handleFileChange(Array.from(e.target.files || []))
              }
              className="hidden"
              accept="image/jpeg,image/png,image/jpg,image/webp"
            />
            <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
              <GridPattern />
            </div>
            <div className="flex flex-col items-center justify-center">
              <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
                {files.length > 0 ? "Image Ready to Upload" : "Upload Image"}
              </p>
              <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
                {files.length > 0
                  ? "Review your selected image below"
                  : "Drag or drop your Image here & click to upload"}
              </p>
              <div className="relative w-full mt-10 max-w-xl mx-auto">
                {files.length > 0 ? (
                  <div className="space-y-4">
                    <motion.div
                      layoutId="file-upload"
                      className={cn(
                        "relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col md:flex-row items-start md:items-center gap-4 p-4 w-full mx-auto rounded-md",
                        "shadow-sm"
                      )}
                    >
                      <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-100 dark:bg-neutral-800 flex-shrink-0">
                        <img
                          src={URL.createObjectURL(files[0])}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-4">
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                            className="text-base text-neutral-700 dark:text-neutral-300 truncate"
                          >
                            {files[0].name}
                          </motion.p>
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                            className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input"
                          >
                            {(files[0].size / (1024 * 1024)).toFixed(2)} MB
                          </motion.p>
                        </div>

                        <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400">
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                            className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 "
                          >
                            {files[0].type.split("/")[1].toUpperCase()}
                          </motion.p>

                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            layout
                          >
                            modified{" "}
                            {new Date(
                              files[0].lastModified
                            ).toLocaleDateString()}
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUpload}
                        className="flex-1 py-3 px-4 flex justify-center items-center cursor-pointer bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                      >
                        {loading ? <ButtonLoader /> : "Upload Image"}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUploadAnother}
                        className="flex-1 cursor-pointer py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors"
                      >
                        Upload Another
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <>
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
                      onClick={handleClick}
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

                    <motion.div
                      variants={secondaryVariant}
                      className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
                    ></motion.div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
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
