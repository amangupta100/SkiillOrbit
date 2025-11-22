"use client";

import { X, Calendar, Clock, Save } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import API from "@/utils/interceptor";
import { toast } from "sonner";

const GenerateScheduleModal = ({ closeModal, skill, role, domain }) => {
  const [date, setDate] = useState(null);
  const [hours, setHours] = useState(10);
  const [minutes, setMinutes] = useState(0);
  const [period, setPeriod] = useState("AM");

  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");

  const [openCalendar, setOpenCalendar] = useState(false);
  const [openTimePicker, setOpenTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Allowed minutes
  const customMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const get24HourTime = () => {
    let hour24 = hours;
    if (period === "PM" && hours !== 12) hour24 += 12;
    if (period === "AM" && hours === 12) hour24 = 0;
    return `${hour24.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const fullDate = date
    ? new Date(date).setHours(...get24HourTime().split(":").map(Number), 0, 0)
    : null;

  const scheduleGeneration = async () => {
    if (!date) return toast.error("Please select a date");
    if (!difficulty) return toast.error("Select difficulty");

    try {
      setLoading(true);

      await API.post("/admin/genQuestion/scheduleGen", {
        skills: skill,
        difficulty,
        questionCount: count,
        scheduleAt: new Date(fullDate).toISOString(),
        domain,
      });

      toast.success("Question generation scheduled successfully!");
      closeModal();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex justify-center items-center h-screen backdrop-blur-md bg-black/60">
      <div className="w-[90%] sm:w-[75%] md:w-[60%] lg:w-[35%] rounded-lg relative py-6 px-5 bg-white shadow-xl">
        <X
          onClick={closeModal}
          className="absolute top-2 right-2 cursor-pointer hover:text-red-500"
        />

        <h1 className="text-center text-lg my-4 font-semibold">
          Schedule Question Generation
        </h1>

        {/* Skill */}
        <p className="text-center text-sm text-gray-500 mb-4">
          Skill:{" "}
          <span className="font-semibold">{decodeURIComponent(skill)}</span>
        </p>

        {/* Difficulty */}
        <div className="space-y-2 mb-4">
          <Label>Choose Difficulty</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Question Count */}
        <div className="space-y-2 mb-4">
          <Label>Number of Questions: {count}</Label>
          <input
            type="range"
            min={1}
            max={10}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        {/* Date Picker */}
        <div className="space-y-2 mb-4">
          <Label>Select Date</Label>
          <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[1001]">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={setDate}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Picker */}
        <div className="space-y-2 mb-4">
          <Label>Select Time</Label>
          <Popover open={openTimePicker} onOpenChange={setOpenTimePicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                {hours}:{minutes.toString().padStart(2, "0")} {period}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-80 p-4 z-[1001]">
              <div className="grid grid-cols-3 gap-4 text-center">
                {/* Hours */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Hour
                  </p>
                  <div className="border rounded-lg max-h-48 overflow-y-auto p-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <Button
                        key={h}
                        variant={hours === h ? "default" : "ghost"}
                        className="w-full h-8 mb-1"
                        onClick={() => setHours(h)}
                      >
                        {h}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Minutes */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Minute
                  </p>
                  <div className="border rounded-lg max-h-48 overflow-y-auto p-2">
                    {customMinutes.map((m) => (
                      <Button
                        key={m}
                        variant={minutes === m ? "default" : "ghost"}
                        className="w-full h-8 mb-1"
                        onClick={() => setMinutes(m)}
                      >
                        {m.toString().padStart(2, "0")}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* AM/PM */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Period
                  </p>
                  <div className="border rounded-lg p-2">
                    {["AM", "PM"].map((p) => (
                      <Button
                        key={p}
                        variant={period === p ? "default" : "ghost"}
                        className="w-full h-8 mb-1"
                        onClick={() => setPeriod(p)}
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

        {/* Submit */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={closeModal}>
            Cancel
          </Button>

          <Button onClick={scheduleGeneration} disabled={loading}>
            {loading ? (
              <>
                <Save className="h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Schedule
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GenerateScheduleModal;
