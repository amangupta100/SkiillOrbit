"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "next/navigation";
import { IoIosNotificationsOutline } from "react-icons/io";
import useNotificationStore from "@/store/common/notificationStore";
import useAuthStore from "@/store/authStore";
import useRecruiterAuthStore from "@/store/recruiter/recruiterauthStore";
import Image from "next/image";
import logo from "@/assests/logo.png";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Power, User } from "lucide-react";
import { FaPowerOff } from "react-icons/fa";
import { toast } from "sonner";
import API from "@/utils/interceptor";

export function DashboardNavbar() {
  // Call all hooks unconditionally at the top to ensure consistent order
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { recruiter } = useRecruiterAuthStore();
  const notifStore = useNotificationStore();

  const [loading, setLoading] = useState(false); // Note: This state is unused; consider removing if not needed
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const role = pathname.includes("/recruiterDashboard")
    ? "recruiter"
    : pathname.includes("/job-seekerDashboard")
    ? "job-seeker"
    : "admin";

  const notifRef = useRef(null);

  // Compute rendering condition after hooks
  const paths = [
    "/job-seekerDashboard/test/testEnvironment",
    "/job-seekerDashboard/interviewPreparation/interview",
    "/register/job-seeker/profileSetup",
    "/register/recruiter/profileSetup",
    "/job-seekerDashboard/test/verifyIdentity",
    "/job-seekerDashboard/conversations",
    "/recruiterDashboard/conversations",
  ];
  const shouldRender = !(
    paths.includes(pathname) || pathname.startsWith("/interviews/")
  );

  const activeUser = user || recruiter;
  const profilePath = user
    ? "/job-seekerDashboard/profile"
    : recruiter
    ? "/recruiterDashboard/profile"
    : "/";

  function formatAMPM(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    return new Intl.DateTimeFormat("en-US", {
      month: "short", // Jan
      day: "numeric", // 12
      year: "numeric", // 2025
      hour: "numeric", // 1
      minute: "2-digit", // 09
      hour12: true, // AM/PM mode
    }).format(date);
  }

  // ============= Close dropdown when clicking outside =============
  useEffect(() => {
    // Only add listener if rendering and dropdown is open
    if (!shouldRender || !isNotifOpen) return;

    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotifOpen, shouldRender]);

  // ============= Handle Notification Open =============
  const openNotifications = async () => {
    if (!shouldRender) return;

    const nextState = !isNotifOpen;
    setIsNotifOpen(nextState);

    if (nextState) {
      await notifStore.fetchNotifications(); // 🔥 Fetch latest notifications
      await notifStore.markAsRead(); // 🔵 Make them read automatically
    }
  };

  const handleLogout = async () => {
    console.log("triggered");
    setLoading(true);
    try {
      const resp =
        role === "recruiter"
          ? await API.post("/recruiter/auth/logout")
          : await API.post("/auth/logout");
      toast.success(resp.data.message);
      window.location.reload();
    } catch (err) {
      toast.error("Failed to logout");
    } finally {
      setLoading(false);
    }
  };

  // Conditional render after all hooks and logic
  if (!shouldRender) return null;

  return (
    <nav className="sticky top-0 z-[50] w-full bg-gray-200/40 backdrop-blur-md border-b border-gray-300 px-3 py-2">
      <div className="flex items-center gap-3 justify-between">
        {/* Logo */}
        <div className="md:invisible flex gap-3 flex-1">
          <Image
            onClick={() => router.push("/")}
            src={logo}
            alt="Logo"
            width={120}
            height={120}
            priority
            className="cursor-pointer object-contain max-h-12 max-w-32"
          />
        </div>

        {/* 🔔 Notification Button */}
        <div className="relative" ref={notifRef}>
          <div className="relative">
            <IoIosNotificationsOutline
              className="w-7 h-7 cursor-pointer"
              onClick={openNotifications}
            />

            {/* 🔴 Unread Badge */}
            {notifStore.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {notifStore.unreadCount}
              </span>
            )}
          </div>

          {/* 🔽 Notification Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white shadow-lg rounded-xl border py-3 px-5 z-[60] overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">Notifications</h3>

                {/* 🗑 Clear Button */}
                {notifStore.notifications.length > 0 && (
                  <button
                    onClick={() => notifStore.clearNotifications()}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* 📌 Notification List */}
              {notifStore.notifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  No notifications yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {notifStore.notifications.map((n, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border ${
                        !n.read ? "bg-blue-50 border-blue-200" : "bg-gray-50"
                      }`}
                    >
                      <h4 className="font-medium text-sm">{n.title}</h4>
                      <p className="text-xs text-gray-600">{n.message}</p>

                      <div className="flex flex-col">
                        {" "}
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatAMPM(n.createdAt)}
                        </p>
                        <p
                          onClick={() => router.push(`/interviews`)}
                          className="text-sm cursor-pointer underline text-blue-400 "
                        >
                          {n.meta.uniqueCode}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="w-10 h-10 overflow-hidden rounded-full border relative cursor-pointer border-zinc-400 flex justify-center items-center">
              {activeUser?.image ? (
                <Image
                  alt="Profile Image"
                  fill
                  sizes="64px"
                  priority
                  className="object-cover"
                  src={activeUser.image.data || activeUser.image}
                />
              ) : (
                <h1 className="text-lg font-semibold">
                  {activeUser?.name?.[0]?.toUpperCase()}
                </h1>
              )}
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="bottom" align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={profilePath}>
                <User className="" />
                My Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleLogout()}
              className="text-red-600"
            >
              <Power />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
