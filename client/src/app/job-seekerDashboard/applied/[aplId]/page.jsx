"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import API from "@/utils/interceptor";
import { Loader2 } from "lucide-react";

const ApplicationDetails = () => {
  const { aplId } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await API.get(`/applications/${aplId}`);
        if (res.data.success) {
          setApplication(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching application:", err);
      } finally {
        setLoading(false);
      }
    };

    if (aplId) fetchApplication();
  }, [aplId]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
      </div>
    );

  if (!application)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        No application found.
      </div>
    );

  const {
    applicationType,
    status,
    coverLetter,
    reviewedBy,
    user,
    job,
    internship,
  } = application;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-4">
        Application Details ({applicationType})
      </h1>

      <div className="bg-white shadow-lg rounded-xl p-6 space-y-4 border">
        <h2 className="text-xl font-semibold text-gray-800">
          {job?.title || internship?.title}
        </h2>
        <p className="text-gray-600">
          {job?.company || internship?.company} •{" "}
          {job?.location || internship?.location}
        </p>

        <div className="mt-3">
          <span className="font-medium text-gray-700">Status:</span>{" "}
          <span className="text-blue-600 font-semibold capitalize">
            {status}
          </span>
        </div>

        {coverLetter && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Cover Letter:</h3>
            <p className="text-gray-700 whitespace-pre-line">{coverLetter}</p>
          </div>
        )}

        <div className="mt-4">
          <h3 className="font-semibold mb-2">Candidate Info:</h3>
          <p>
            <strong>Name:</strong> {user?.name}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>LinkedIn:</strong> {user?.linkedin || "Not provided"}
          </p>
          <p>
            <strong>GitHub:</strong> {user?.github || "Not provided"}
          </p>
          <p>
            <strong>LeetCode:</strong> {user?.leetcode || "Not provided"}
          </p>
        </div>

        {reviewedBy && (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-semibold">Reviewed By:</h3>
            <p>{reviewedBy.name}</p>
            <p className="text-sm text-gray-600">{reviewedBy.companyName}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetails;
