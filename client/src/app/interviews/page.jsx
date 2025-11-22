"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Video, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CreateRoomModal from "@/components/recruiterDashboard/Interview/InterviewCreationModal";
import useRecruiterAuthStore from "@/store/recruiter/recruiterauthStore";
import { useRouter } from "next/navigation";
import API from "@/utils/interceptor";
import useNotificationStore from "@/store/common/notificationStore";

const Page = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState("");
  const { recruiter } = useRecruiterAuthStore();
  const router = useRouter();
  const [det, setDet] = useState(null);

  const [interviews, setInterviews] = useState([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

  const notifStore = useNotificationStore();

  // Fetch notifications
  useEffect(() => {
    notifStore.fetchNotifications();
  }, []);

  // Fetch User Details
  useEffect(() => {
    const fetchUserDet = async () => {
      const req = await API.get("/common/getPersonDet/");
      setDet(req.data.user);
    };
    fetchUserDet();
  }, []);

  // Fetch All Interviews
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoadingInterviews(true);
        const res = await API.get("/common/notification/getAllInt");
        setInterviews(res.data.interviews || []);
      } catch (err) {
        console.error("Failed to fetch interviews", err);
      } finally {
        setLoadingInterviews(false);
      }
    };
    fetchInterviews();
  }, []);

  const handleJoin = () => {
    if (!roomIdInput.trim()) return;
    sessionStorage.setItem("data", JSON.stringify(det));
    router.replace(`/interviews/${roomIdInput.trim()}?kiosk=true`);
  };

  // Better AM/PM Formatter
  function formatAMPM(dateString) {
    if (!dateString) return "";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateString));
  }

  return (
    <div className="p-5">
      {showCreateModal && (
        <CreateRoomModal data={det} onClose={() => setShowCreateModal(false)} />
      )}

      <div className="border-[1.6px] rounded-lg border-zinc-300 p-3">
        <Button
          onClick={() =>
            (window.location.href = `/${
              det?.role === "recruiter"
                ? "recruiterDashboard"
                : "job-seekerDashboard"
            }`)
          }
        >
          Go Back
        </Button>

        <h1 className="text-lg font-semibold text-center">Manage Sessions</h1>

        {/* ACTION CARDS */}
        <div className="max-w-2xl mx-auto grid md:grid-cols-2 mt-9 mb-2 gap-6">
          {/* Create Session */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold">Create New Session</h3>
                <p className="text-muted-foreground">
                  Start an instant meeting and invite others with a unique room
                  ID
                </p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="w-full"
              >
                Create Session
              </Button>
            </CardContent>
          </Card>

          {/* Join Session */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="text-primary w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold">Join Session</h3>
                <p className="text-muted-foreground">
                  Enter a room ID to join an existing video conference
                </p>
              </div>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                />
                <Button
                  onClick={handleJoin}
                  className="w-full bg-primary text-primary-foreground"
                >
                  Join Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* UPCOMING INTERVIEWS */}
      <div className="my-6">
        <h1 className="text-lg font-semibold mb-4">Upcoming Sessions</h1>

        {loadingInterviews ? (
          // --- Skeleton Loader ---
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 animate-pulse rounded-md"
              ></div>
            ))}
          </div>
        ) : interviews.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming interviews</p>
        ) : (
          <div className="flex flex-col gap-3">
            {interviews.map((inter, i) => (
              <div
                key={i}
                className="p-3 border rounded-lg bg-blue-50 border-blue-200"
              >
                <h4 className="font-semibold text-sm">
                  {inter.status === "SCHEDULED" && "Interview Scheduled"}
                </h4>

                <p className="text-xs text-gray-600">
                  {formatAMPM(inter.interviewDate)}
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm">Room Code:</span>
                  <span className="font-semibold text-sm">
                    {inter.uniqueCode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
