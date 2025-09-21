"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { IoChevronBackOutline } from "react-icons/io5";
import { toast } from "sonner";

const AddLink = ({ setaddLink, onAddLink, edit }) => {
  const [title, setTitle] = useState(edit?.title || "");
  const [description, setDescription] = useState(edit?.description || "");
  const [link, setLink] = useState(edit?.link || "");
  const [thumbnail, setThumbnail] = useState(edit?.thumbnail || null);
  const [fileMeta, setFileMeta] = useState(edit?.fileMeta || null);
  const [error, setError] = useState("");

  // URL validation
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // File handling
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed!");
      setThumbnail(null);
      setFileMeta(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size should not exceed 5MB!");
      setThumbnail(null);
      setFileMeta(null);
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnail(reader.result);
      setFileMeta({
        name: file.name,
        type: file.type,
        size: formatFileSize(file.size),
      });
    };
    reader.readAsDataURL(file);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleContinue = () => {
    if (!title.trim()) {
      toast.warning("Title is required!");
      return;
    }
    if (!isValidUrl(link)) {
      toast.warning("Please enter a valid link!");
      return;
    }

    const payload = {
      title,
      description,
      link,
      thumbnail,
      fileMeta,
    };

    onAddLink(payload);
    toast.success(
      edit ? "Link updated successfully!" : "Link added successfully!"
    );
    setaddLink(false);
  };

  return (
    <div className="w-[680px] overflow-y-scroll max-h-[680px] rounded-lg bg-white shadow-lg relative">
      {/* Header */}
      <div className="sticky top-0 bg-white z-[1000] justify-between items-center p-3 border-b-2 border-zinc-300">
        <div className="flex items-center gap-2">
          <IoChevronBackOutline
            className="text-xl cursor-pointer"
            onClick={() => setaddLink(false)}
          />
          <h1 className="font-semibold mx-1 text-xl">
            {edit ? "Edit Link" : "Add Link"}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 px-5 py-3">
        {/* Link */}
        <div className="my-3 flex flex-col gap-2">
          <Label>Link*</Label>
          <Input
            placeholder="https://example.com"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>

        {/* Title */}
        <div className="my-3 flex flex-col gap-2">
          <Label>Title*</Label>
          <Input
            placeholder="Enter link title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="my-3 flex flex-col gap-2">
          <Label>Description</Label>
          <Input
            placeholder="Enter link description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Thumbnail Upload */}
        <div className="my-3 flex flex-col gap-2">
          <Label>Thumbnail</Label>
          <div className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-md p-6">
            {thumbnail ? (
              <div className="flex flex-col items-center space-y-2">
                <img
                  src={thumbnail}
                  alt="Thumbnail"
                  className="w-40 h-28 object-cover rounded-md shadow-sm"
                />
                {fileMeta && (
                  <div className="text-xs text-gray-600 text-center">
                    <p>Type: {fileMeta.type}</p>
                    <p>Size: {fileMeta.size}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No image selected</p>
            )}

            <Input
              type="file"
              accept="image/*"
              className="hidden"
              id="thumbnailUpload"
              onChange={handleFileChange}
            />
            <label
              htmlFor="thumbnailUpload"
              className="cursor-pointer bg-blue-500 text-white px-4 py-1.5 rounded-md text-sm mt-3"
            >
              {thumbnail ? "Upload Another" : "Upload Image"}
            </label>
          </div>
        </div>
        {/* Error message */}
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t-2 border-zinc-300 flex justify-between p-3">
        {edit && (
          <Button
            variant="destructive"
            onClick={() => {
              if (
                window.confirm("Are you sure you want to delete this link?")
              ) {
                onAddLink(null);
                setaddLink(false);
              }
            }}
          >
            Delete
          </Button>
        )}
        <Button onClick={handleContinue} disabled={!title || !link}>
          {edit ? "Update" : "Continue"}
        </Button>
      </div>
    </div>
  );
};

export default AddLink;
