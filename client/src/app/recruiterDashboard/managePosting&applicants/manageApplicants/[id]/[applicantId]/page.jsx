"use client";
import API from "@/utils/interceptor";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { FaFile, FaFilePdf, FaFileWord } from "react-icons/fa";

const Page = () => {
  const { applicantId, id: opporId } = useParams();
  const [aplDet, setAplDet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullSummary, setShowFullSummary] = useState(false);
  const hasFetched = useRef(false);

  const PdfIcon = FaFilePdf;
  const WordIcon = FaFileWord;
  const FileIcon = FaFile;

  // Decode URL-encoded string
  const decoded = decodeURIComponent(applicantId);
  const id = decoded.split("=")[1] || decoded;

  useEffect(() => {
    if (hasFetched.current) return;

    const fetchDet = async () => {
      try {
        hasFetched.current = true;
        const req = await API.post(
          `/recruiter/managePosting/sendAplDet&updateStatus/${opporId}/${id}`
        );
        setAplDet(req.data.applicant);

        console.log(req);
      } catch (err) {
        console.error("Failed to fetch applicant details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDet();
  }, [opporId, id]); // Include deps to refetch if params change

  console.log(aplDet);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading applicant details...
      </div>
    );
  }

  if (!aplDet) {
    return (
      <div className="p-4 text-center text-gray-500">
        No applicant details found.
      </div>
    );
  }

  // Handle truncated summary
  const summary = aplDet.summary || "";
  const MAX_CHARS = 200; // Adjust how much to show initially
  const isLongSummary = summary.length > MAX_CHARS;
  const displayedSummary = showFullSummary
    ? summary
    : summary.slice(0, MAX_CHARS) + (isLongSummary ? "..." : "");

  function formatFileSize(bytes) {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  const handleResumeClick = () => {
    if (aplDet?.resume?.data) {
      const blob = new Blob([new Uint8Array(aplDet.resume.data.data)], {
        type: aplDet.resume.contentType,
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

  return (
    <div className="p-4">
      <div className="mt-5 border-[1.6px] relative border-gray-300 rounded-lg p-3">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 overflow-hidden rounded-full border-[1.6px] relative cursor-pointer border-zinc-400 flex justify-center items-center">
            {aplDet?.image?.data ? (
              <Image
                src={aplDet.image.data}
                fill
                alt="User image"
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <h1 className="text-xl font-semibold">
                {aplDet?.name?.[0]?.toUpperCase()}
              </h1>
            )}
          </div>

          <div className="flex flex-col">
            <h1 className="font-semibold text-lg">{aplDet?.name}</h1>
            <h1 className="text-gray-500">{aplDet?.desiredRole}</h1>
          </div>
        </div>

        {aplDet?.summary && (
          <div className="mt-4 mb-4">
            <h1 className="text-lg font-semibold">Profile Summary</h1>
            <p className="text-gray-600 leading-relaxed">{displayedSummary}</p>

            {isLongSummary && (
              <button
                onClick={() => setShowFullSummary((prev) => !prev)}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-all"
              >
                {showFullSummary ? "Show less ▲" : "Show more ▼"}
              </button>
            )}
          </div>
        )}

        {aplDet?.resume?.filename && (
          <div
            className="flex max-w-fit relative cursor-pointer mt-4 items-center p-3 border rounded-lg border-zinc-300 gap-3 hover:bg-zinc-50 transition-colors"
            onClick={handleResumeClick}
            role="button"
            tabIndex={0}
            aria-label="Open resume in new tab"
          >
            {/* File Icon */}
            <div className="p-2 bg-zinc-100 rounded-lg">
              {aplDet.resume.contentType === "application/pdf" ? (
                <PdfIcon className="w-6 h-6 text-red-500" />
              ) : aplDet.resume.contentType?.includes("word") ||
                aplDet.resume.contentType?.includes("docx") ? (
                <WordIcon className="w-6 h-6 text-blue-500" />
              ) : (
                <FileIcon className="w-6 h-6 text-zinc-500" />
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {aplDet.resume.filename}
              </p>
              <div className="flex gap-2 text-xs text-zinc-500">
                <span>
                  {aplDet.resume.contentType?.split("/")[1]?.toUpperCase()}
                </span>
                <span>•</span>
                <span>
                  {formatFileSize(aplDet.resume.data?.data?.length || 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
