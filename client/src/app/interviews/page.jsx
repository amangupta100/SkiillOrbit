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

const Page = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState(""); // <-- input state
  const { recruiter } = useRecruiterAuthStore();
  const router = useRouter();
  const [det, setDet] = useState(null);

  useEffect(() => {
    const fetchUserDet = async () => {
      const req = await API.get("/common/getPersonDet/");
      setDet(req.data.user);
    };
    fetchUserDet();
  }, []);

  const handleJoin = () => {
    if (!roomIdInput.trim()) return;
    window.location.href = `/interviews/${roomIdInput.trim()}`;
    // save user info so [roomId].jsx can pick it up
    localStorage.setItem("data", JSON.stringify(det));
  };

  return (
    <div className="p-5">
      {showCreateModal && (
        <CreateRoomModal data={det} onClose={() => setShowCreateModal(false)} />
      )}
      <div className="border-[1.6px] rounded-lg border-zinc-300 p-3">
        <Button
          onClick={() =>
            (window.location.href = `/${
              det.role === "recruiter" ? "recruiterDashboard" : "userDashboard"
            }`)
          }
        >
          Go Back
        </Button>
        <h1 className="text-lg font-semibold text-center">Create Session</h1>

        <div className="max-w-2xl mx-auto grid md:grid-cols-2 mt-9 mb-2 gap-6">
          {/* Create Session Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Create New Session
                </h3>
                <p className="text-muted-foreground">
                  Start an instant meeting and invite others with a unique room
                  ID
                </p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Create Session
              </Button>
            </CardContent>
          </Card>

          {/* Join Session Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="text-primary w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Join Session</h3>
                <p className="text-muted-foreground">
                  Enter a room ID to join an existing video conference
                </p>
              </div>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)} // <-- capture value
                />
                <Button
                  onClick={handleJoin} // <-- redirect handler
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Join Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Page;
