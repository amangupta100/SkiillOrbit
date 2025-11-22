"use client";

import React, { useEffect, useState } from "react";
import { Briefcase, MapPin, Clock } from "lucide-react";
import API from "@/utils/interceptor";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const JobSeekerAppliedOpportunities = () => {
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🧠 Fetch all applied opportunities
  const fetchAppliedOpportunities = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(
        "/job-seeker/opportunity/AllappliedOpportunity"
      );
      if (data?.success) {
        setAppliedJobs(data.data || []);
      } else {
        setAppliedJobs([]);
      }
    } catch (err) {
      console.error("Error fetching applied opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppliedOpportunities();
  }, []);

  if (loading) {
    return (
      <div className="p-6 grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="w-full h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-7">Applied Opportunities</h1>

      {appliedJobs.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          You haven’t applied to any opportunities yet.
        </div>
      ) : (
        <div className="grid gap-8">
          {appliedJobs.map((app) => {
            const job = app.job || app.internship;
            return (
              <div
                key={app._id}
                className="hover:shadow-md p-4 rounded-lg transition-all duration-200 border border-zinc-300 relative"
              >
                {/* 🟢 Floating Status Badge - always centered */}
                <div className="absolute -top-4 right-2 border border-zinc-200 rounded-lg bg-white shadow-sm px-3 py-1">
                  <span
                    className={`text-sm font-medium ${
                      app.status === "selected"
                        ? "text-green-600"
                        : app.status === "rejected"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {app.status?.toUpperCase() || "PENDING"}
                  </span>
                </div>

                <div className=" flex flex-col sm:flex-row">
                  <div>
                    <h2 className="font-semibold text-lg">
                      {job?.role || "Untitled Role"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {job?.company?.name}
                    </p>
                    <div className="flex mt-2 flex-wrap items-center  gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {job?.location || "Not specified"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase size={14} /> {app?.applicationType || "Job"}
                      </span>
                      {/* 🕒 Applied At */}
                      <div className="flex text-sm text-gray-500">
                        <span className="font-medium text-gray-700 mr-1">
                          Applied at:
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock size={14} />
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() =>
                        router.push(`/job-seekerDashboard/applied/${app._id}`)
                      }
                      className="bg-white hover:bg-gray-200 text-black border-[1.6px] border-zinc-300 mt-3"
                    >
                      Get Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobSeekerAppliedOpportunities;
