"use client";
import { AppSidebar } from "@/components/common/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import useAuthStore from "@/store/authStore";
import { useEffect, useState, useRef } from "react";
import { DashboardNavbar } from "@/components/userDashboard/navbar";
import { useRouter } from "next/navigation";
import { useAuthNetworkStatus } from "@/store/UseAuthNetwork";
import OfflinePage from "@/components/common/Offline";
import { DashboardSkeleton } from "@/components/common/Skeleton/UserDashbNetRec";
import { io } from "socket.io-client";
import API from "@/utils/interceptor";
import { toast } from "sonner";

export default function DashboardLayout({ children }) {
  const { isAuthenticated } = useAuthStore();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const router = useRouter();
  const {
    isOffline,
    checkNetwork,
    isReconnecting,
    initialCheckComplete,
    setInitialCheckComplete,
  } = useAuthNetworkStatus();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;
    API.post("/job-seeker/activity/ping").catch((err) => {
      toast.error(err.message);
    });
  }, [user]);

  const backendSocketURL = process.env.NEXT_PUBLIC_SOCKET_URL + "/UserStatus";

  useEffect(() => {
    if (!user) return;

    const socket = io(backendSocketURL, {
      query: {
        userId: user.id,
        role_type: "job-seeker",
      },
      withCredentials: true,
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const verifyAuth = async () => {
      const isCurrentlyOffline = checkNetwork();
      if (!isCurrentlyOffline) {
        try {
          const resp = await checkAuth();
          setInitialCheckComplete(true);
          return;
        } catch (error) {
          console.error("Authentication check failed:", error);
        }
      }
      setInitialCheckComplete(true);
    };
    verifyAuth();
  }, [checkAuth, router]);

  // Show loading skelton until initial checks complete
  if (!initialCheckComplete || isReconnecting) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <DashboardSkeleton />
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <OfflinePage />
      </div>
    );
  }

  // if (!isAuthenticated) {
  //   // Handle unauthenticated state (redirect or show auth page)
  //   window.location.href = "/login/job-seeker";
  // }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <div className="flex-1 overflow-x-hidden flex flex-col">
          <DashboardNavbar />
          <main className="flex-1 overflow-x-hidden pb-24">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
