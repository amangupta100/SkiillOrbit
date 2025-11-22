"use client";

import React, { useEffect, useState, Suspense } from "react"; // 👈 Added Suspense
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import GenerateNow from "@/components/admin/generateQtnNow";
import API from "@/utils/interceptor";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams, useParams } from "next/navigation"; // 👈 Added useParams
import GenerateScheduleModal from "@/components/admin/scheduleQtnGen";

// 👈 Extracted for Suspense wrapping
const PageContent = () => {
  const params = useParams(); // 👈 Standard way (no React.use)
  const { skills, domain, role } = params;
  const decodedDomain = decodeURIComponent(domain);
  const decodedRole = decodeURIComponent(role);
  const decodedSkill = decodeURIComponent(skills);

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPage = Number(searchParams.get("page") || 1);

  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [generateNow, setgenerateNow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [schedulemodal, setScheduleModal] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);

      const req = await API.get(
        `/admin/genQuestion/getallquestionbySkill?skill=${skills}&page=${page}&limit=20`
      );

      setQuestions(req.data.questions);
      setTotalPages(req.data.totalPages || 1); // 👈 Added guard
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [page, generateNow]); // 👈 If modal closes reset generateNow, this avoids loops

  const handlePageChange = (newPage) => {
    setPage(newPage);
    router.push(`?page=${newPage}`, { scroll: false });
  };

  // 👈 Fallback for Suspense (simple loading)
  if (loading) return <div className="p-5">Loading...</div>;

  return (
    <div className="p-5 w-full">
      {generateNow && (
        <GenerateNow
          skill={decodedSkill}
          role={decodedRole}
          domain={decodedDomain}
          closeModal={() => setgenerateNow(false)}
        />
      )}

      {schedulemodal && (
        <GenerateScheduleModal
          skill={decodedSkill}
          role={decodedRole}
          domain={decodedDomain}
          closeModal={() => setScheduleModal(false)}
        />
      )}

      <>
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-lg font-semibold">All Questions</h1>

            {/* Dropdown Create */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="font-medium bg-white hover:bg-zinc-300 text-black border border-zinc-200">
                  Generate
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setgenerateNow(true)}>
                  Generate Now
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setScheduleModal(true)}>
                  Schedule Later
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm text-gray-500">
            Showing all {questions?.length || 0} questions of{" "}
            <span className="font-medium">{decodedSkill}</span>
          </p>
        </div>

        {/* Question List */}
        <div className="mt-6 gap-6 flex flex-col items-center justify-center">
          {questions?.length > 0 ? (
            questions.map((q) => (
              <div
                key={q._id}
                onClick={() =>
                  router.push(
                    `/adminDashboard/manageDomains&Skills/${encodeURIComponent(
                      decodedDomain
                    )}/${encodeURIComponent(decodedRole)}/${encodeURIComponent(
                      decodedSkill
                    )}/${q._id}`
                  )
                }
                className="border-[1.6px] cursor-pointer relative p-3 rounded-lg w-full border-zinc-200"
              >
                <div className="flex flex-wrap">
                  <h1 className="font-semibold inline-block">
                    Q{q.serialNumber}.
                  </h1>
                  <h1 className="text-black font-semibold ml-2">{q.title}</h1>
                </div>

                <div className="absolute -top-4 right-3">
                  <Badge className="bg-gray-100 text-gray-500 border-zinc-300 border-[1.6px]">
                    {q.difficulty}
                  </Badge>
                </div>

                <div className="flex flex-wrap mt-1 gap-4">
                  {q.topicsCovered?.map((topic, idx) => (
                    <Badge
                      key={idx}
                      className="bg-gray-100 text-gray-500 border-zinc-300 border-[1.6px]"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p>No questions yet…</p>
          )}
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && ( // 👈 Added guard for no pages
          <div className="flex justify-center mt-6 space-x-2">
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  className="px-4"
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </Button>
              );
            })}
          </div>
        )}
      </>
    </div>
  );
};

// 👈 New: Fallback component for Suspense
const PageFallback = () => (
  <div className="p-5 flex items-center justify-center">
    Loading questions...
  </div>
);

export default function Page({ params }) {
  return (
    <Suspense fallback={<PageFallback />}>
      <PageContent />
    </Suspense>
  );
}
