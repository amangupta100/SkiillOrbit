"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function Pagination({ currentQuestion = 0, totalQuestions = 1, onQuestionChange }) {
  const pageNeighbours = 1;
  const currentPage = currentQuestion + 1;
  const totalPages = totalQuestions;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onQuestionChange(page - 1); // convert page to index
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(2, currentPage - pageNeighbours);
    const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);

    pages.push(1);

    if (startPage > 2) {
      pages.push("...");
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      pages.push("...");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return [...new Set(pages)];
  };

  const pages = getPageNumbers();

  return (
    <nav aria-label="Question navigation" className="flex items-center justify-center w-full gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onQuestionChange(currentQuestion - 1)}
              disabled={currentQuestion === 0}
              aria-label="Previous Question"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Previous Question</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex items-center gap-1">
        {pages.map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="flex items-center justify-center h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <TooltipProvider key={page}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={currentPage === page ? "default" : "ghost"}
                    size="icon"
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "h-8 w-8 transition-all duration-300",
                      currentPage === page ? "bg-primary text-primary-foreground" : ""
                    )}
                  >
                    {page}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Go to question {page}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        )}
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onQuestionChange(currentQuestion + 1)}
              disabled={currentQuestion === totalQuestions - 1}
              aria-label="Next Question"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Next Question</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </nav>
  );
}
