"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import API from "@/utils/interceptor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import ButtonLoader from "@/utils/Loader";

export default function ChangeStatusModal({ open, setOpen, opportunityId }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Active");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!opportunityId) return;
    setLoading(true);
    const fetchStatus = async () => {
      try {
        const res = await API.get(
          `/recruiter/managePosting/status/${opportunityId}`
        );
        if (res.data.success) {
          setStatus(res.data.data.status);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [opportunityId]);

  const handleSubmit = async () => {
    if (status === "Active") {
      toast.warning("You can only close an active posting.");
      return;
    }
    if (!reason.trim()) {
      toast.warning("Please enter a reason for closing.");
      return;
    }

    setSaving(true);
    try {
      const res = await API.put(
        `/recruiter/managePosting/changeStatus/${opportunityId}`,
        {
          reason,
        }
      );
      if (res.data.success) {
        toast.success("Status updated successfully!");
        setOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md h-screen flex z-[1000]  items-center justify-center">
      <div className="bg-white rounded-xl w-[90%] max-w-md p-6 space-y-5">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="w-32 h-4 bg-zinc-200 rounded" />
            <div className="w-full h-10 bg-zinc-200 rounded" />
            <div className="w-40 h-4 bg-zinc-200 rounded" />
            <div className="w-full h-10 bg-zinc-200 rounded" />
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Change Opportunity Status</h2>

            <div>
              <label className="text-sm text-gray-600">Current Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {status === "Closed" && (
              <div>
                <label className="text-sm text-gray-600">
                  Reason for closing
                </label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="mt-1"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={saving}
                onClick={handleSubmit}
                className="bg-red-600 hover:bg-red-700"
              >
                {saving && <ButtonLoader color="white" />} Save
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
