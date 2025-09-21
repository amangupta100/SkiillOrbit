"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { IconUpload, IconFileText, IconFileTypePdf } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

const mainVariant = {
  initial: { x: 0, y: 0 },
  animate: { x: 20, y: -20, opacity: 0.9 },
};

const secondaryVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  "image/jpg",
  "application/msword",
];

export const FileUpload = ({ onChange, initialFiles = [] }) => {
  const [files, setFiles] = useState(initialFiles);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFiles = (newFiles) => {
    return newFiles.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.warning(`File type not allowed: ${file.name}`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.warning(`File too large: ${file.name} (max 5MB)`);
        return false;
      }
      return true;
    });
  };

  const generatePreview = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      if (file.type.startsWith("image/")) {
        reader.onload = (e) => resolve(e.target?.result);
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        reader.onload = (e) => resolve(e.target?.result); // base64 PDF
        reader.readAsDataURL(file);
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        reader.onload = () => resolve(null); // can't render inline DOCX
        reader.readAsArrayBuffer(file);
      } else {
        resolve(null);
      }
    });
  };

  const handleFileChange = async (newFiles) => {
    const validFiles = validateFiles(newFiles);
    if (validFiles.length > 0) {
      const withPreviews = await Promise.all(
        validFiles.map(async (file) => ({
          file,
          preview: await generatePreview(file),
        }))
      );
      // ✅ replace instead of append
      setFiles(withPreviews);
      onChange && onChange(withPreviews);
    }
  };

  useEffect(() => {
    onChange && onChange(files);
  }, [files]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: () => {
      toast.warning("Invalid file format");
    },
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          accept=".png,.jpg,.jpeg,.pdf,.docx"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />

        {/* Background grid */}
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>

        <div className="flex flex-col items-center justify-center">
          <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
            Upload file
          </p>
          <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
            Drag or drop your files here or{" "}
            {files.length > 0 ? "Click any where to upload" : "click to upload"}
          </p>

          <div className="relative w-full mt-10 max-w-xl mx-auto">
            {files.length > 0 &&
              files.map(({ file, preview }, idx) => (
                <motion.div
                  key={"file" + idx}
                  layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                  className={cn(
                    "relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col gap-3 p-4 mt-4 w-full mx-auto rounded-md",
                    "shadow-sm"
                  )}
                >
                  {/* Preview */}
                  {preview && file.type.startsWith("image/") && (
                    <img
                      src={preview}
                      alt={file.name}
                      className="w-full h-40 object-cover rounded-md border"
                    />
                  )}

                  {preview && file.type === "application/pdf" && (
                    <iframe
                      src={preview}
                      className="w-full h-40 rounded-md border"
                      title={file.name}
                    />
                  )}

                  {file.type ===
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && (
                    <div className="flex items-center gap-3 p-4 border rounded-md bg-gray-50 dark:bg-neutral-800">
                      <IconFileText className="w-8 h-8 text-blue-500" />
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        DOCX Preview not supported in browser
                      </p>
                    </div>
                  )}

                  {/* File Details */}
                  <div className="flex justify-between items-center">
                    <p className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs">
                      {file.name}
                    </p>
                    <span className="text-sm text-neutral-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500">{file.type}</p>
                  <p className="text-xs text-neutral-400">
                    Modified {new Date(file.lastModified).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}

            {!files.length && (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
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
