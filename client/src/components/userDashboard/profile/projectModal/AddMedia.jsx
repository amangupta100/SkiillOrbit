import { FileUpload } from "@/components/ui/file-upload2";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useEffect, useState } from "react";
import { IoChevronBackOutline } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AddMedia = ({ setaddMedia, onAddMedia, edit }) => {
  const [file, setFile] = useState(edit?.file || null);
  const [title, setTitle] = useState(edit?.title || "");
  const [description, setDescription] = useState(edit?.description || "");
  const [previewFiles, setPreviewFiles] = useState(
    edit ? [{ file: edit.file.file, preview: edit.file.preview || null }] : []
  );

  // Whenever the user selects a new file
  const handleFileChange = (files) => {
    setFile(files[0]);
    setPreviewFiles(files); // pass to FileUpload preview
  };

  const handleContinue = () => {
    if (!file) {
      toast.warning("Please upload a file first");
      return;
    }

    const payload = {
      file,
      title,
      description,
      preview: file.preview || previewFiles[0]?.preview,
    };

    onAddMedia(payload);
    toast.success(
      edit ? "Media updated successfully!" : "Media added successfully!"
    );
    setaddMedia(false);
  };

  return (
    <div className="w-[680px] overflow-y-scroll max-h-[680px] rounded-lg bg-white shadow-lg relative">
      {/* Header */}
      <div className="sticky top-0 bg-white z-[1000] justify-between items-center p-3 border-b-2 border-zinc-300">
        <div className="flex items-center gap-2">
          <IoChevronBackOutline
            className="text-xl cursor-pointer"
            onClick={() => setaddMedia(false)}
          />
          <h1 className="font-semibold mx-1 text-xl">
            {edit ? "Edit Media" : "Add Media"}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 px-5 py-3">
        <FileUpload onChange={handleFileChange} initialFiles={previewFiles} />

        <div className="my-3 flex flex-col gap-2">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter media title"
          />
        </div>

        <div className="my-3 gap-2 flex-col flex">
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter media description"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t-2 border-zinc-300 flex justify-between p-3">
        {edit && (
          <Button
            variant="destructive"
            onClick={() => {
              if (
                window.confirm("Are you sure you want to delete this media?")
              ) {
                onAddMedia(null);
                setaddMedia(false);
              }
            }}
          >
            Delete
          </Button>
        )}
        <Button
          onClick={handleContinue}
          disabled={!file || !title || !description}
        >
          {edit ? "Update" : "Continue"}
        </Button>
      </div>
    </div>
  );
};

export default AddMedia;
