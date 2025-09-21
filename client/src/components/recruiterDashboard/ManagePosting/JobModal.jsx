"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import JobForm from "./JobForm"; // import your actual Job form component
import InternshipForm from "./InternshipForm"; // import your actual Internship form component
import useJobFormStore from "@/store/recruiter/JobModal";

export default function JobModal() {
  const tabs = [
    { name: "New Job", key: "job" },
    { name: "New Internship", key: "internship" },
  ];
  const {closeModal,resetForm} = useJobFormStore()

  const [activeTab, setActiveTab] = useState("job");

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center h-screen overflow-y-auto py-8 backdrop-blur-md bg-black/60">
      <div className="w-[90%] sm:w-[75%] md:w-[70%] lg:w-[50%] rounded-lg relative min-h-fit py-6 px-5 bg-white max-h-[95vh] overflow-y-auto">
        <X
          onClick={() => {
            closeModal()
            resetForm()
          }}
          className="absolute top-2 right-2 cursor-pointer"
        />

        <div className="w-full flex justify-center">
          <div className="mt-5 border-[1.6px] rounded-lg border-b-0 mb-6 w-fit shadow-sm">
            <div className="mx-auto border-gray-200 px-4">
              <div className="flex w-fit justify-center">
                <div className="flex space-x-4 border-b">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "px-6 py-3 text-sm cursor-pointer font-medium transition-colors",
                        activeTab === tab.key ? "text-primary border-b-[3px] border-primary" : "hover:text-primary"
                      )}
                    >
                      <h1 className="text-base">{tab.name}</h1>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Render the form based on active tab */}
        {activeTab === "job" && <JobForm />}
        {activeTab === "internship" && <InternshipForm />}
      </div>
    </div>
  );
}
