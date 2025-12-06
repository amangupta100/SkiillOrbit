"use client";

import React, { useEffect, useState } from "react";
import API from "@/utils/interceptor";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react"; // delete icon
import { Plus } from "lucide-react"; // add icon

const Page = ({ params }) => {
  const { domain } = React.use(params);
  const decodedDomain = decodeURIComponent(domain);

  const [domainData, setDomainData] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRole, setNewRole] = useState("");

  const router = useRouter();

  // ---------- FETCH ROLES ----------
  useEffect(() => {
    const fetchDomainData = async () => {
      try {
        const res = await API.get(
          `/admin/manageDomain&Skills/getRoles?domain=${decodedDomain}`
        );
        setDomainData(res.data.data);
      } catch (err) {
        console.log("Error:", err);
      }
    };

    fetchDomainData();
  }, [decodedDomain]);

  // ---------- ADD ROLE ----------
  const handleAddRole = async () => {
    if (!newRole.trim()) return toast.error("Role name cannot be empty");

    try {
      const res = await API.post(`/admin/manageDomain&Skills/addRole`, {
        domain: decodedDomain,
        role: newRole,
      });

      toast.success("Role added successfully!");

      setDomainData(res.data.data);
      setNewRole("");
      setIsAddModalOpen(false);
    } catch (err) {
      toast.error("Failed to add role");
      console.log(err);
    }
  };

  // ---------- DELETE ROLE ----------
  const handleDeleteRole = async (roleName) => {
    const confirmed = confirm(`Delete role "${roleName}"?`);
    if (!confirmed) return;

    try {
      const res = await API.delete(`/admin/manageDomain&Skills/deleteRole`, {
        params: {
          domain: decodedDomain,
          role: roleName,
        },
      });

      toast.success("Role deleted");

      setDomainData(res.data.data);
    } catch (err) {
      toast.error("Failed to delete role");
      console.log(err);
    }
  };

  return (
    <div className="p-6">
      {/* ----- Header ----- */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">{decodedDomain} — Roles & Skills</h1>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
        >
          <Plus size={18} />
          Add Role
        </button>
      </div>

      {!domainData ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4 flex flex-wrap gap-4">
          {domainData.roles.map((role, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 bg-gray-50 shadow-sm flex justify-between items-start w-[260px]"
            >
              {/* Role Info */}
              <div
                onClick={() =>
                  router.push(
                    `/adminDashboard/manageDomains&Skills/${encodeURIComponent(
                      decodedDomain
                    )}/${encodeURIComponent(role.title)}`
                  )
                }
                className="cursor-pointer"
              >
                <h2 className="font-semibold text-lg">{role.title}</h2>
                <h1 className="text-sm text-gray-500">
                  {role.skills.length} skills
                </h1>
              </div>

              {/* Delete Icon */}
              <Trash2
                size={20}
                className="text-red-500 cursor-pointer hover:text-red-700"
                onClick={() => handleDeleteRole(role.title)}
              />
            </div>
          ))}
        </div>
      )}

      {/* ---------- ADD ROLE MODAL ---------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1001] ">
          <div className="bg-white rounded-lg p-6 w-[350px] shadow-xl relative">
            <h2 className="text-lg font-semibold mb-3">Add New Role</h2>

            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Enter role name"
              className="w-full border px-3 py-2 rounded-md mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={handleAddRole}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Add Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
