"use client";

import API from "@/utils/interceptor";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/button";
import { OpportunityFooter } from "@/components/userDashboard/OpportunitesFooter";
import { toast } from "sonner";

const Page = () => {
  const { id } = useParams();
  const [reqSkill, setReqSkill] = useState([]);
  const [optSkill, setOptSkill] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [allSkillOpp, setallSkillOpp] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get(`/job-seeker/opportunity/matchSkills/${id}`);
        setReqSkill(res.data.requiredSkills || []);
        setOptSkill(res.data.optionalSkills || []);

        setTests(res.data.tests || []);
        console.log("API Response:", res.data);
      } catch (err) {
        console.error("Error fetching skill data:", err);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleCheckboxChange = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const resp = await API.post(`/job-seeker/opportunity/apply/${id}`);
      const { success: succ, message } = resp.data;
      if (succ) {
        toast.success(message);
        router.back();
      } else toast.error(message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!id)
    return (
      <div className="p-6 text-center">
        Please apply to an opportunity to get skill matched.
      </div>
    );

  // 🧠 Create a map for attempted skills and their timestamps
  const attemptedMap = {};
  tests.forEach((t) => {
    if (t.skills && Array.isArray(t.skills)) {
      t.skills.forEach((skill) => {
        if (t.submittedAt) {
          attemptedMap[skill] = t.submittedAt;
        }
      });
    }
  });

  // 🔥 Extract all unique test skills
  const allTestSkills = [...new Set(tests.flatMap((t) => t.skills || []))];

  const formatDateTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-semibold">Skill Selection</h2>

      {/* Required Skills */}
      <div className="border border-zinc-200 p-3 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Required Skills</h3>
        {reqSkill.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {reqSkill.map((skill, idx) => (
              <Badge key={idx} variant="default">
                {skill}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500">No required skills found</p>
        )}
      </div>

      {/* Optional Skills */}
      <div className="border border-zinc-200 p-3 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Optional Skills</h3>
        {optSkill.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {optSkill.map((skill, idx) => (
              <Badge key={idx} variant="outline">
                {skill}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500">No optional skills found</p>
        )}
      </div>

      {/* Test Skills */}
      <div className="border border-zinc-200 p-3 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Select Skills to Apply</h3>

        {allTestSkills.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-5">
            {allTestSkills.map((skill, idx) => {
              const attemptedAt = attemptedMap[skill];
              return (
                <label
                  key={idx}
                  className="flex items-center relative gap-2 border p-2 rounded-lg hover:bg-zinc-50 cursor-pointer"
                >
                  <div className="absolute -top-[13px] right-1 flex space-x-3">
                    <span className="text-xs bg-gray-100 px-3 py-1 font-medium rounded-full border-[1.5px] border-zinc-300">
                      {reqSkill.includes(skill) ? "Required" : "Optional"}
                    </span>
                  </div>
                  <Checkbox
                    checked={selectedSkills.includes(skill)}
                    onCheckedChange={() => handleCheckboxChange(skill)}
                    disabled={!!attemptedAt} // disable checkbox if already attempted
                  />
                  <div className="flex flex-col flex-1 ml-2">
                    <span className="font-medium">{skill}</span>
                    {attemptedAt && (
                      <div className="text-[11px] bg-zinc-300/60 flex justify-center w-fit p-1 items-center rounded-xl text-zinc-500">
                        Attempted on: {formatDateTime(attemptedAt)}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-zinc-500">No test skills found</p>
        )}
      </div>

      {/* Submit Button */}
      <OpportunityFooter
        nextBtn="Apply"
        loading={loading}
        onApply={handleSubmit}
        loadingTxt="Applying..."
        disabled={loading || process.env.NODE_ENV === "production"}
      />
    </div>
  );
};

export default Page;
