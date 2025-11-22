import { X, Calendar, Clock, Save } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import API from "@/utils/interceptor";
import { toast } from "sonner";
import useRecruiterAuthStore from "@/store/recruiter/recruiterauthStore";

const InterviewScheduling = ({
  closeModal,
  applicantId,
  applicantName,
  applicant,
}) => {
  const [date, setDate] = useState(null);
  const [hours, setHours] = useState(10);
  const [minutes, setMinutes] = useState(0);
  const [period, setPeriod] = useState("AM");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);
  const [openTimePicker, setOpenTimePicker] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState("");
  const [selectedPostingType, setSelectedPostingType] = useState(""); // 🚨 NEW: Track type
  const [postings, setPostings] = useState(null);
  const [loadingPostings, setLoadingPostings] = useState(true);
  const { recruiter } = useRecruiterAuthStore();

  console.log(postings);

  console.log(applicant, selectedPosting);
  useEffect(() => {
    const fetchPostings = async () => {
      try {
        setLoadingPostings(true);
        const { data } = await API.get(
          "/recruiter/managePosting/getallPosting"
        );
        const allPostings = data.jobs || [];
        const activePostings = allPostings.filter((p) => p.status === "Active");
        setPostings(activePostings);
      } catch (err) {
        toast.error("Error fetching postings");
      } finally {
        setLoadingPostings(false);
      }
    };
    fetchPostings();
  }, []);

  // 🚨 NEW: Handle posting selection with type detection
  const handlePostingChange = (value) => {
    setSelectedPosting(value);
    const posting = postings?.find((p) => p._id === value);
    if (posting) {
      setSelectedPostingType(
        posting.type === "Internship" ? "internship" : "job"
      );
    }
  };

  // Custom minutes options
  const customMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // Calculate 24-hour time for fullDate
  const get24HourTime = () => {
    let hour24 = hours;
    if (period === "PM" && hours !== 12) {
      hour24 += 12;
    } else if (period === "AM" && hours === 12) {
      hour24 = 0;
    }
    return `${hour24.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  // Combine date and time into full interview date (clone date to avoid mutation)
  const fullDate = date
    ? new Date(date).setHours(...get24HourTime().split(":").map(Number), 0, 0)
    : null;
  const fullDateObj = date ? new Date(fullDate) : null;

  const handleSchedule = async () => {
    if (!date || !selectedPosting || !selectedPostingType) {
      toast.error(
        "Please select date, time, posting, and ensure posting type is valid."
      );
      return;
    }

    console.log(applicantId, applicantName);
    setSubmitting(true);
    try {
      // 🚨 Use prop applicantId if available, fallback to applicant.userId
      const finalApplicantId = applicantId || applicant?.userId;

      if (!finalApplicantId) {
        toast.error("Applicant ID not found.");
        return;
      }

      const { data } = await API.post(
        "/common/conversation/scheduleInterview",
        {
          applicantId: finalApplicantId,
          postingId: selectedPosting,
          postingType: selectedPostingType, // 🚨 NEW: Send postingType
          interviewDate: new Date(fullDate).toISOString(),
          notes,
        }
      );

      if (data.success) {
        toast.success(
          `Interview scheduled for ${format(new Date(fullDate), "PPP p")}`
        );
        closeModal();
        // Optionally refresh interviews list
      } else {
        toast.error(data.message || "Failed to schedule interview.");
      }
    } catch (err) {
      toast.error("Error scheduling interview: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateHour = (newHour) => {
    setHours(newHour);
  };

  const updateMinute = (newMin) => {
    setMinutes(newMin);
  };

  const togglePeriod = () => {
    setPeriod(period === "AM" ? "PM" : "AM");
  };

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center items-center h-screen overflow-y-auto py-8 backdrop-blur-md bg-black/60">
      <div className="w-[90%] sm:w-[75%] md:w-[60%] lg:w-[35%] rounded-lg relative max-h-fit py-6 px-5 bg-white  overflow-y-auto">
        <X
          onClick={closeModal}
          className="absolute top-2 right-2 cursor-pointer hover:text-red-500"
        />
        <h1 className="text-center text-lg my-5 font-semibold">
          Schedule Interview
        </h1>

        {/* Date Picker */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="date">Select Date</Label>
          <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[1001]" align="start">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                disabled={(d) =>
                  d < new Date(new Date().setHours(0, 0, 0, 0)) ||
                  d > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
                classNames={{
                  day_disabled: "bg-gray-500 text-gray-200",
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Posting Selector */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="posting">Select Posting</Label>
          {loadingPostings ? (
            <div className="h-10 w-full bg-muted rounded-md animate-pulse" />
          ) : (
            <Select value={selectedPosting} onValueChange={handlePostingChange}>
              {" "}
              {/* 🚨 Use new handler */}
              <SelectTrigger>
                <SelectValue placeholder="Select a posting" />
              </SelectTrigger>
              <SelectContent>
                {postings &&
                  postings.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.role} ({p.type || "Job"}){" "}
                      {/* 🚨 Show type for clarity */}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Custom Time Picker */}
        <div className="space-y-2 mb-4">
          <Label>Select Time</Label>
          <Popover open={openTimePicker} onOpenChange={setOpenTimePicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                disabled={!date}
                className="w-full justify-start text-left"
              >
                <Clock className="mr-2 h-4 w-4" />
                {date
                  ? `${hours === 12 ? 12 : hours % 12 || 12}:${minutes
                      .toString()
                      .padStart(2, "0")} ${period}`
                  : "Pick a time"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 z-[1001]">
              <div className="grid grid-cols-3 gap-4 text-center">
                {/* Hours Column */}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Hour
                  </div>
                  <div className="border rounded-lg p-2 max-h-48 overflow-y-auto overflow-x-hidden">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <Button
                        key={h}
                        variant={hours === h ? "default" : "ghost"}
                        className="w-full justify-center h-8 m-0.5 rounded"
                        onClick={() => updateHour(h)}
                      >
                        {h}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Minutes Column */}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Minute
                  </div>
                  <div className="border overflow-x-hidden rounded-lg p-2 max-h-48 overflow-y-auto">
                    {customMinutes.map((m) => (
                      <Button
                        key={m}
                        variant={minutes === m ? "default" : "ghost"}
                        className="w-full justify-center h-8 m-0.5 rounded"
                        onClick={() => updateMinute(m)}
                      >
                        {m.toString().padStart(2, "0")}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* AM/PM Column */}
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Period
                  </div>
                  <div className="border overflow-x-hidden rounded-lg p-2 max-h-48 overflow-y-auto">
                    {["AM", "PM"].map((p) => (
                      <Button
                        key={p}
                        variant={period === p ? "default" : "ghost"}
                        className="w-full justify-center h-8 m-0.5 rounded"
                        onClick={togglePeriod}
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Notes */}
        <div className="space-y-2 mb-6">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes for the interview..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={closeModal} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={
              submitting || !date || !selectedPosting || !selectedPostingType
            }
            className="flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Save className="h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Schedule Interview
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduling;
