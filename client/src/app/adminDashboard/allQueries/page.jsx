"use client";

import React, { useEffect, useState } from "react";
import API from "@/utils/interceptor";
import { toast } from "sonner";

export default function Page() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueries = async () => {
    try {
      setLoading(true);

      const res = await API.get("/common/support/allQueries");
      setQueries(res.data.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load queries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Support Queries</h1>

      {loading ? (
        <p className="text-gray-500">Loading queries...</p>
      ) : queries.length === 0 ? (
        <p className="text-gray-500">No support queries found.</p>
      ) : (
        <div className="space-y-4">
          <h1 className="text-sm text-gray-400">
            {" "}
            Showing All {queries.length} Queries
          </h1>
          {queries.map((q) => (
            <div
              key={q._id}
              className="border p-4 rounded-lg bg-white shadow-sm"
            >
              <h2 className="text-lg font-semibold">{q.subject}</h2>

              <p className="text-gray-600 mt-1">
                <strong>Name:</strong> {q.name}
              </p>

              <p className="text-gray-600">
                <strong>Email:</strong> {q.email}
              </p>

              <p className="mt-2 text-gray-800">{q.message}</p>

              <p className="mt-2 text-xs text-gray-400">
                Submitted on: {new Date(q.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
