"use client";

import React, { useEffect, useState } from "react";
import API from "@/utils/interceptor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

// --------------------------------------------
// SKELETON
// --------------------------------------------
const ExperienceSkeleton = () => {
  return (
    <div className="animate-pulse space-y-3 border rounded-lg p-4 bg-white shadow">
      <div className="h-5 bg-gray-300 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-100 rounded w-full"></div>
    </div>
  );
};

// --------------------------------------------
// MODAL WITH ACHIEVEMENTS + ATTACHMENTS
// --------------------------------------------
const ExperienceModal = ({ open, onClose, onSubmit, initialData }) => {
  if (!open) return null;

  const [form, setForm] = useState({
    company: initialData?.company || "",
    role: initialData?.role || "",
    from: initialData?.from?.slice(0, 10) || "",
    to: initialData?.to?.slice(0, 10) || "",
    description: initialData?.description || "",
    achievements: initialData?.achievements || [],
    attachments: initialData?.attachments || [],
  });

  const [newAchievement, setNewAchievement] = useState("");
  const [newAttachment, setNewAttachment] = useState("");

  // 🟦 handle normal field inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🟦 add achievement
  const addAchievement = () => {
    if (!newAchievement.trim()) return;
    setForm({
      ...form,
      achievements: [...form.achievements, newAchievement.trim()],
    });
    setNewAchievement("");
  };

  const removeAchievement = (index) => {
    setForm({
      ...form,
      achievements: form.achievements.filter((_, i) => i !== index),
    });
  };

  // 🟦 add attachment
  const addAttachment = () => {
    if (!newAttachment.trim()) return;

    setForm({
      ...form,
      attachments: [
        ...form.attachments,
        { type: "link", url: newAttachment.trim() },
      ],
    });

    setNewAttachment("");
  };

  const removeAttachment = (index) => {
    setForm({
      ...form,
      attachments: form.attachments.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    onSubmit(form, initialData?._id);
  };

  return (
    <div className="fixed inset-0 bg-black/60 overflow-x-hidden overflow-y-auto py-5 backdrop-blur-md flex items-center justify-center z-[1001] ">
      <div className="bg-white rounded-xl max-h-fit p-6 w-full max-w-lg space-y-5 shadow-xl">
        <h2 className="text-xl font-bold">
          {initialData ? "Edit Experience" : "Add Experience"}
        </h2>

        {/* Company */}
        <Input
          type="text"
          name="company"
          placeholder="Company"
          value={form.company}
          onChange={handleChange}
        />

        {/* Role */}
        <Input
          type="text"
          name="role"
          placeholder="Role"
          value={form.role}
          onChange={handleChange}
        />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">From</label>
            <Input
              type="date"
              name="from"
              value={form.from}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">To</label>
            <Input
              type="date"
              name="to"
              value={form.to}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Description */}
        <textarea
          name="description"
          placeholder="Work Description"
          className="w-full border px-3 py-2 rounded h-24"
          value={form.description}
          onChange={handleChange}
        ></textarea>

        {/* Achievements */}
        <div>
          <label className="font-medium">Achievements</label>

          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add an achievement"
              value={newAchievement}
              onChange={(e) => setNewAchievement(e.target.value)}
            />
            <Button onClick={addAchievement}>Add</Button>
          </div>

          {/* badges list */}
          <div className="flex flex-wrap gap-2 mt-3">
            {form.achievements.map((ach, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2 text-sm"
              >
                {ach}
                <X
                  size={14}
                  className="cursor-pointer"
                  onClick={() => removeAchievement(index)}
                />
              </span>
            ))}
          </div>
        </div>

        {/* Attachments */}
        <div>
          <label className="font-medium">Attachments (Links)</label>

          <div className="flex gap-2 mt-2">
            <Input
              placeholder="https://example.com"
              value={newAttachment}
              onChange={(e) => setNewAttachment(e.target.value)}
            />
            <Button onClick={addAttachment}>Add</Button>
          </div>

          <div className="mt-3 space-y-2">
            {form.attachments.map((file, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-gray-50 border px-3 py-2 rounded"
              >
                <a href={file.url} target="_blank" className="text-blue-600">
                  {file.url}
                </a>

                <X
                  className="cursor-pointer"
                  size={16}
                  onClick={() => removeAttachment(i)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={handleSubmit}>
            {initialData ? "Update" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------
// MAIN PAGE
// --------------------------------------------
const page = () => {
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState(null);

  // Fetch experiences
  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const res = await API.get("/job-seeker/profile/getUserExperiences");

        if (res.data.success) {
          setExperiences(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, []);

  const handleSave = async (form, id) => {
    try {
      let res;

      if (id) {
        res = await API.put(`/job-seeker/profile/updateExperience/${id}`, form);
      } else {
        res = await API.post(`/job-seeker/profile/addExperience`, form);
      }

      if (res.data.success) {
        const updated = await API.get("/job-seeker/profile/getUserExperiences");
        setExperiences(updated.data.data);
      }

      setModalOpen(false);
      setEditingExperience(null);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="py-6 px-3 space-y-6">
      {/* Title + Add Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your Experiences</h1>
        <Button
          onClick={() => {
            setEditingExperience(null);
            setModalOpen(true);
          }}
        >
          + Add Experience
        </Button>
      </div>

      {loading ? (
        <>
          <ExperienceSkeleton />
          <ExperienceSkeleton />
        </>
      ) : experiences.length === 0 ? (
        <p className="text-gray-500">No experience added yet.</p>
      ) : (
        experiences.map((exp) => (
          <div
            key={exp._id}
            className="border rounded-lg p-4 bg-white shadow-sm space-y-2 relative"
          >
            {/* Edit */}
            <button
              onClick={() => {
                setEditingExperience(exp);
                setModalOpen(true);
              }}
              className="absolute top-4 right-4 text-blue-600 underline text-sm"
            >
              Edit
            </button>

            <h2 className="text-lg font-semibold">{exp.role}</h2>
            <p className="text-gray-600">{exp.company}</p>

            <p className="text-sm text-gray-500">
              {new Date(exp.from).toLocaleDateString()} –{" "}
              {exp.to ? new Date(exp.to).toLocaleDateString() : "Present"}
            </p>

            {/* Achievements */}
            {exp.achievements?.length > 0 && (
              <ul className="list-disc pl-5 text-sm">
                {exp.achievements.map((ach, i) => (
                  <li key={i}>{ach}</li>
                ))}
              </ul>
            )}

            {/* Description */}
            {exp.description && (
              <p className="text-gray-700 whitespace-pre-line">
                {exp.description}
              </p>
            )}

            {/* Attachments */}
            {exp.attachments?.length > 0 && (
              <div className="mt-2">
                <p className="font-medium mb-1">Attachments:</p>
                <ul className="list-disc pl-5 text-sm">
                  {exp.attachments.map((file, i) => (
                    <li key={i}>
                      <a
                        href={file.url}
                        target="_blank"
                        className="text-blue-600 underline"
                      >
                        {file.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))
      )}

      {/* Modal */}
      <ExperienceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        initialData={editingExperience}
      />
    </div>
  );
};

export default page;
