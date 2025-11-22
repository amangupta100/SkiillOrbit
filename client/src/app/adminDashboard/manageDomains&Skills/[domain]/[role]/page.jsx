"use client";

import React, { useEffect, useState } from "react";
import API from "@/utils/interceptor";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function Page({ params }) {
  const { domain, role } = React.use(params);
  const decodedDomain = decodeURIComponent(domain);
  const decodedRole = decodeURIComponent(role);

  const [roleData, setRoleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const router = useRouter();

  // Fetch Skills
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await API.get(
          `/admin/manageDomain&Skills/getRoleSkills?domain=${decodedDomain}&role=${decodedRole}`
        );
        setRoleData(res.data.data);
      } catch (err) {
        console.log("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [decodedDomain, decodedRole, showAddModal]);

  // Add Skill Function
  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;

    try {
      await API.post(`/admin/manageDomain&Skills/addSkill`, {
        domain: decodedDomain,
        role: decodedRole,
        skill: newSkill,
      });

      setShowAddModal(false);
      setNewSkill("");
      router.refresh();
    } catch (err) {
      console.log(err);
    }
  };

  // Delete Skill Function
  const handleDeleteSkill = async (skill) => {
    try {
      await API.delete(
        `/admin/manageDomain&Skills/deleteSkill?domain=${decodedDomain}&role=${decodedRole}&skill=${skill}`
      );
      router.refresh();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="p-6">
      {/* MODAL FOR ADD SKILL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1001] bg-black/70 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <X
              className="absolute right-2 top-2 cursor-pointer"
              onClick={() => setShowAddModal(false)}
            />

            <h1 className="text-lg font-semibold mb-4">Add New Skill</h1>

            <input
              type="text"
              placeholder="Enter new skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            />

            <button
              onClick={handleAddSkill}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Add Skill
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex justify-between flex-wrap items-center">
        <div>
          <h1 className="text-2xl font-bold">{decodedRole}</h1>
          <p className="text-sm text-gray-500">
            Showing all {roleData?.skills.length} skills for{" "}
            <span className="font-medium">{decodedRole}</span> in{" "}
            <span className="font-medium">{decodedDomain}</span>
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
        >
          + Add Skill
        </button>
      </div>

      {/* Loading */}
      {loading && <p>Loading skills...</p>}

      {/* Skills List */}
      {!loading && roleData && (
        <div className="flex flex-wrap gap-5">
          {roleData.skills.map((skill, index) => (
            <div
              key={index}
              className="px-6 py-2 border flex items-center gap-3 border-gray-300 rounded-lg bg-white text-gray-800 shadow-sm hover:shadow-md transition relative"
            >
              <span
                className="cursor-pointer"
                onClick={() =>
                  router.push(
                    `/adminDashboard/manageDomains&Skills/${encodeURIComponent(
                      decodedDomain
                    )}/${encodeURIComponent(decodedRole)}/${encodeURIComponent(
                      skill
                    )}`
                  )
                }
              >
                {skill}
              </span>

              {/* DELETE BUTTON */}
              <X
                className="text-red-500 absolute p-1 bg-gray-100 border-[1.6px] border-zinc-300 rounded-full -top-3 hover:bg-gray-100 right-0 cursor-pointer"
                onClick={() => handleDeleteSkill(skill)}
              />
            </div>
          ))}
        </div>
      )}

      {!loading && !roleData && (
        <p className="text-red-500">No skills found.</p>
      )}
    </div>
  );
}
