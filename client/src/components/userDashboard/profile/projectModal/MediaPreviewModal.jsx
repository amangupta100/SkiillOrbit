"use client";
import React, { useEffect, useState } from "react";
import { IoChevronBackOutline, IoChevronForwardOutline } from "react-icons/io5";
import { X } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import Image from "next/image";

const MediaPreviewModal = ({ open, onClose, project }) => {
  // Collect both media + links into a single array
  const allItems = [...(project.media || []), ...(project.links || [])];

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = allItems[currentIndex];

  const goPrev = () =>
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
  const goNext = () =>
    setCurrentIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));

  if (!currentItem) return null;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="inset-0 absolute z-[999] flex items-center justify-center w-screen h-screen bg-black/70 backdrop-blur-md">
      <div className="w-[95%] md:w-[80%] lg:w-[70%] h-[85%] flex flex-col bg-white rounded-lg shadow-lg relative">
        <div className="sticky top-0 bg-white z-[1000] justify-between items-center p-3 border-b-2 border-zinc-300">
          <div className="flex items-center gap-2">
            <IoChevronBackOutline
              onClick={() => onClose()}
              className="text-xl cursor-pointer"
            />
            <h1 className="font-semibold mx-1 text-xl">Preview</h1>
          </div>
        </div>

        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          {/* Left side media */}
          <div className="flex-1 flex items-center justify-center bg-black">
            {currentItem.thumbnail || currentItem.previewFiles ? (
              <Image
                src={currentItem.thumbnail || currentItem.previewFiles}
                alt={currentItem.title || "Media"}
                width={900}
                height={600}
                className="object-contain max-h-[680px]"
              />
            ) : (
              <div className="text-white">No Preview</div>
            )}
          </div>

          {/* Right side info */}
          <div className="w-full md:w-[320px] flex flex-col border-l">
            {/* Body */}
            <div className="flex-1 px-4 py-3 overflow-y-auto">
              <h2 className="font-semibold text-base mb-2">
                {currentItem.fileMeta?.name || currentItem.title}
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                {currentItem.description || "No description available."}
              </p>
              {currentItem.url && (
                <a
                  href={currentItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  Visit Link
                </a>
              )}
            </div>

            {/* Footer with pagination */}
            <div className="border-t p-3 flex">
              <Pagination className="w-full">
                <PaginationContent className="flex justify-between w-full">
                  <PaginationItem>
                    <PaginationPrevious
                      className={`cursor-pointer ${
                        currentIndex === 0
                          ? "opacity-50 pointer-events-none"
                          : ""
                      }`}
                      onClick={() => {
                        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
                      }}
                    />
                  </PaginationItem>

                  <span className="text-sm text-gray-600">
                    {currentIndex + 1} of {allItems.length}
                  </span>

                  <PaginationItem>
                    <PaginationNext
                      className={`cursor-pointer ${
                        currentIndex === allItems.length - 1
                          ? "opacity-50 pointer-events-none"
                          : ""
                      }`}
                      onClick={() => {
                        if (currentIndex < allItems.length - 1)
                          setCurrentIndex(currentIndex + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPreviewModal;
