"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/AppSidebar";
import { DashboardNavbar } from "@/components/userDashboard/navbar";
import useRecruiterAuthStore from "@/store/recruiter/recruiterauthStore";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { io } from "socket.io-client";

const layout = ({ children }) => {
  const { setAuth, isAuthenticated, recruiter, company } =
    useRecruiterAuthStore();
  const checkAuth = useRecruiterAuthStore((state) => state.checkAuth);
  const router = useRouter();

  const backendSocketURL = process.env.NEXT_PUBLIC_SOCKET_URL + "/UserStatus";

  useEffect(() => {
    if (!recruiter) return;
    const socket = io(backendSocketURL, {
      query: { userId: recruiter.id, role_type: "recruiter" },
      withCredentials: true,
    });
    return () => {
      socket.disconnect();
    };
  }, [recruiter]);

  useEffect(() => {
    checkAuth();
  }, [router, isAuthenticated, setAuth]);
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default layout;
