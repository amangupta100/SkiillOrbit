"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import API from "@/utils/interceptor";
import { Check, ChevronsUpDown } from "lucide-react";
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import search from "@/assests/undraw_web-search_9qqc.svg";
import useAuthStore from "@/store/authStore";
import ButtonLoader from "@/utils/Loader";

const page = () => {
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]); // Changed to array for multiple selection
  const [questionCount, setQuestionCount] = useState("10");
  const [testScores, setTestScores] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();
  const [resLoading, setrespLoading] = useState(false);

  console.log(user);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await API.get(`/job-seeker/tests/getallTest-Scores`);

        const { tests } = res.data;
        if (tests && tests.length > 0) {
          setTestScores(tests);
        }
      } catch (err) {
        toast.error(err.message);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchSkills = async () => {
      if (input.length < 2) return;
      setLoading(true);
      try {
        const res = await API.get(`/job-seeker/profile/getSkills?q=${input}`);
        setSkills(res.data);
        console.log(res);
      } catch (err) {
        console.error("Skill search error", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSkills();
    }, 300); // Add debounce

    return () => clearTimeout(timer);
  }, [input]);

  const toggleSkill = (skill) => {
    setSelectedSkills(
      (prev) =>
        prev.includes(skill)
          ? prev.filter((s) => s !== skill) // Remove if already selected
          : [...prev, skill] // Add if not selected
    );
  };

  const startTest = async () => {
    if (selectedSkills.length === 0)
      return toast.warning(
        "Please select at least one skill to start the test."
      );
    if (questionCount < 10 && selectedSkills.length == 1)
      return toast.warning(
        "Enter Proper Number of Questions (Must be greater than equal to 10"
      );
    if (questionCount < 20 && selectedSkills.length == 2)
      return toast.warning(
        "Enter Proper Number of Questions (Must be greater than equal to 20)"
      );
    if (selectedSkills.length > 2)
      return toast.warning(
        "Can't start test with more than 2 skills at a time, Attempt with 1 or 2 skills"
      );

    try {
      setrespLoading(true);
      const res = await API.get("/job-seeker/tests/genTestDetToken", {
        params: {
          userId: user.id,
          skills: JSON.stringify(selectedSkills),
          questionCount,
        },
      });
      const {
        data: { success: succ },
      } = res;
      if (!succ)
        return toast.error("Something went wrong, Please try again later!");
      else {
        window.location.href = "/userDashboard/test/verifyIdentity";
      }
    } catch (err) {
      toast.warning(err.message);
    } finally {
      setrespLoading(false);
    }
  };

  const canProceed = selectedSkills.length > 0 && !resLoading;

  return (
    <div className="p-3">
      <div className="max-w-full">
        {/* Top Section */}
        <div className="bg-white p-5 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold">Start a Test</h2>

          <div className="w-full">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                  variant="outline"
                >
                  {selectedSkills.length > 0
                    ? `${selectedSkills.length} skill(s) selected`
                    : "Search & select skills"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Type skill name..."
                    value={input}
                    onValueChange={setInput}
                  />
                  {loading ? (
                    <div className="p-4">
                      <Skeleton className="h-5 w-full mb-2" />
                      <Skeleton className="h-5 w-2/3" />
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>No skills found.</CommandEmpty>
                      <CommandGroup>
                        {skills.length > 0 &&
                          skills.map((skill, idx) => (
                            <CommandItem
                              key={idx}
                              onSelect={() => toggleSkill(skill)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedSkills.includes(skill)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {skill}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </>
                  )}
                </Command>
              </PopoverContent>
            </Popover>
            {selectedSkills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                    <button
                      type="button"
                      className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none"
                      onClick={() => toggleSkill(skill)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-semibold">No. of Questions</label>
              <Input
                type="number"
                min="1"
                max="30"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={startTest}
            disabled={!canProceed || resLoading}
            className={
              !canProceed || resLoading
                ? "bg-gray-500  hover:bg-gray-300/50 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            }
            aria-disabled={!canProceed || resLoading}
          >
            {resLoading ? <ButtonLoader /> : "Start Test"}
          </Button>
        </div>

        {/* Bottom Section: Previous Scores */}
        <div>
          <h3 className="text-lg font-medium mt-12 mb-5">
            Previous Test Scores
          </h3>
          <div>
            {testScores && testScores.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-8">
                <Image src={search} alt="Search" width={300} height={300} />
                <p className="text-gray-500 mt-8">No tests taken yet.</p>
              </div>
            ) : (
              testScores.map((score, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <p>
                      <strong>Skills:</strong> {score.skills}
                    </p>
                    <p>
                      <strong>Average Marks (out of 10):</strong> {score.score}%
                    </p>
                    <p>
                      <strong>Duration:</strong> {score.duration}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(score.date).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {score.score >= 60 ? "✅ Passed" : "❌ Failed"}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
