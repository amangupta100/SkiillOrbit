"use client";
import React, { useEffect } from "react";
import useChatSocket from "@/lib/common/ChatSocket"; // 👈 import new hook
import useRecruiterAuthStore from "@/store/recruiter/recruiterauthStore";
import useAuthStore from "@/store/authStore";
import { usePathname } from "next/navigation";

const ChatLayout = ({ children }) => {
  const { recruiter } = useRecruiterAuthStore();
  const { user } = useAuthStore();
  const pathname = usePathname();

  // Replace these with actual authenticated user data (from auth context or global store)
  const userId = recruiter?.id || user?.id || null;
  const role_type = pathname.startsWith("/recruiterDashboard")
    ? "recruiter"
    : "job-seeker";

  // ✅ Initialize chat socket connection
  useChatSocket({ userId, role_type });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-50 overflow-hidden relative">
      {/* ✅ Chat content area */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
};

export default ChatLayout;
