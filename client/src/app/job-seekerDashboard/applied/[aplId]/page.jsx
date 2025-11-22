"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import API from "@/utils/interceptor";
import Loader from "@/components/common/SkillsOrbitLoader";
import Image from "next/image";
import { FileText, FileDown } from "lucide-react";
import { IconFileTypeDocx, IconPdf } from "@tabler/icons-react";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${day}-${month}-${year}`;
};

const ApplicationDetails = () => {
  const { aplId } = useParams();
  const [application, setApplication] = useState(null);
  const [resumeURL, setResumeURL] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!aplId) return;

    const fetchApplication = async () => {
      try {
        const res = await API.get(
          `/job-seeker/opportunity/getStAplDtl/${aplId}`
        );

        if (res.data.success) {
          const app = res.data.data?.applicationDet;
          setApplication(res.data.data);

          // ✅ Convert resume snapshot to Blob URL
          if (app?.resumeSnapshot?.data) {
            const byteArray = new Uint8Array(app.resumeSnapshot.data.data);
            const blob = new Blob([byteArray], {
              type: app.resumeSnapshot.contentType,
            });

            const url = URL.createObjectURL(blob);
            setResumeURL(url);
          }
        }
      } catch (err) {
        console.error("Error fetching application:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [aplId]);

  if (loading)
    return (
      <div className="inset-0 absolute">
        <Loader />
      </div>
    );

  if (!application)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        No application found.
      </div>
    );

  console.log(application);

  const app = application.applicationDet || {};
  const isInternship = !!app.internship;
  const role = isInternship ? app.internship?.role : app.job?.role;
  const company = isInternship ? app.internship?.company : app.job?.company;
  const logo = company?.logo?.data;
  const appliedDate = formatDate(app.appliedAt);
  const filename = app?.resumeSnapshot?.filename || "Submitted Resume";
  const messages = {
    PENDING: "Recruiter has not seen your application.",
    SEEN: "Recruiter has viewed your application.",
  };

  return (
    <div className=" py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Application Details</h1>

      <div className="w-full p-4 relative rounded-xl border border-zinc-200 shadow-sm bg-white">
        {/* Tag */}
        <div className="absolute flex items-center gap-3 -top-4 right-4">
          <span className="bg-gray-100 text-sm rounded-md border border-zinc-200 py-1 px-3">
            {isInternship ? "Internship".toUpperCase() : "Job".toUpperCase()}
          </span>

          <span className="bg-gray-100 text-sm rounded-md border border-zinc-200 py-1 px-3">
            {application.applicationDet.status.toUpperCase()}
          </span>
        </div>

        {/* Company & Role */}
        <div className="flex items-center gap-3 my-4">
          <div className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-full border border-zinc-200">
            {logo ? (
              <Image
                src={logo}
                alt="Company Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            ) : (
              <span className="text-xs text-gray-400">No Logo</span>
            )}
          </div>

          <div>
            <h1 className="text-lg font-semibold">{role || "Unknown Role"}</h1>
            <p className="text-gray-500">
              {company?.name || "Unknown Company"}
            </p>
          </div>
        </div>

        {/* Applied Date */}
        <div className="mt-2">
          <p className="text-sm font-semibold text-gray-600">Applied On:</p>
          <p className="text-sm text-gray-900">{appliedDate}</p>
        </div>

        {/* ✅ Submitted Resume */}
        {app.resumeSnapshot && resumeURL && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-600">
              Submitted Resume:
            </p>
            <div className="flex w-fit mt-2 items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-200">
              {app.resumeSnapshot.contentType.includes("pdf") ? (
                <IconPdf />
              ) : (
                <IconFileTypeDocx />
              )}

              <button
                onClick={() => window.open(resumeURL, "_blank")}
                className="text-blue-600 underline text-sm hover:text-blue-800"
              >
                {filename}
              </button>
            </div>
          </div>
        )}

        {/* Cover Letter */}
        {app.coverLetter && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-600">Cover Letter:</p>
            <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md border border-gray-200 whitespace-pre-wrap">
              {app.coverLetter}
            </p>
          </div>
        )}
      </div>

      {/* Note/Recruiter Details Section */}
      <div className="mt-6">
        {app.status === "shortlisted" ? (
          <div className="w-full p-4 rounded-xl border border-zinc-200 shadow-sm bg-white">
            {/* Recruiter details would be rendered here based on data */}
            <p className="text-sm font-semibold text-gray-600">
              Recruiter Details:
            </p>
            {/* Example placeholder - replace with actual data from application */}
            <div className="mt-2 text-sm text-gray-800">
              {/* Assuming recruiter data exists in application, e.g., application.recruiter */}
              {application.recruiter ? (
                <>
                  <p>
                    <strong>Name:</strong> {application.recruiter.name || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {application.recruiter.email || "N/A"}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {application.recruiter.phone || "N/A"}
                  </p>
                </>
              ) : (
                <p>Recruiter information is being prepared.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full p-4 rounded-xl border border-zinc-200 shadow-sm bg-blue-50">
            <p className="text-sm font-light text-gray-500">
              {messages[application.applicationDet.status.toUpperCase()]}
            </p>
            <p className="text-sm text-blue-600 italic">
              Note: If application status is shortlisted, recruiter details will
              be shown here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetails;
