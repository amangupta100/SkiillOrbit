"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import useAuthStore from "@/store/authStore";
import useRecruiterAuthStore from "@/store/recruiter/recruiterauthStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import logo from "@/assests/logo.png";
import API from "@/utils/interceptor";
import { toast } from "sonner";
import { useState } from "react";
import { FaPeopleGroup } from "react-icons/fa6";
import { FaPeopleCarry } from "react-icons/fa";
import { User } from "lucide-react";

export function DashboardNavbar() {
  const { user, logout: jobSeekerLogout } = useAuthStore();
  const { recruiter, logout: recruiterLogout } = useRecruiterAuthStore();
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const paths = [
    "/job-seekerDashboard/test/testEnvironment",
    "/job-seekerDashboard/interviewPreparation/interview",
    "/register/job-seeker/profileSetup",
    "/register/recruiter/profileSetup",
    "/job-seekerDashboard/test/verifyIdentity",
    "/job-seekerDashboard/conversations",
    "/recruiterDashboard/conversations",
  ];

  const shouldHide =
    paths.includes(pathname) || pathname.startsWith("/interviews/");

  if (shouldHide) {
    return null;
  }

  // Determine active user for profile
  const activeUser = user || recruiter;
  const profilePath = user
    ? "/job-seekerDashboard/profile"
    : recruiter
    ? "/recruiterDashboard/profile"
    : "/";
  const isRecruiter = !!recruiter;

  // 🎭 Determine user role
  const role = pathname.includes("/recruiterDashboard")
    ? "recruiter"
    : "job-seeker";

  const handleLogout = async () => {
    setLoading(true);
    try {
      const resp =
        role === "recruiter"
          ? await API.post("/recruiter/auth/logout")
          : await API.post("/auth/logout");
      toast.success(resp.data.message);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="sticky top-0 z-[50] w-full bg-gray-200/40 backdrop-blur-md border-b border-gray-300 px-3 py-2">
      <div className="flex items-center justify-between">
        {/* Mobile: Centered Logo (visible only on <768px) */}
        <div className="md:invisible flex flex-1">
          <Image
            onClick={() => router.push("/")}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            priority
            className="cursor-pointer object-contain max-h-12 max-w-32"
            src={logo}
            alt="Logo"
            width={120}
            height={120}
          />
        </div>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="w-10 h-10 overflow-hidden rounded-full border-[1.6px] relative cursor-pointer border-zinc-400 flex justify-center items-center">
              {activeUser?.image ? (
                <Image
                  alt="Profile Image"
                  sizes="64px"
                  priority
                  fill
                  className="object-cover"
                  src={activeUser.image.data || activeUser.image}
                />
              ) : (
                <h1 className="text-lg font-semibold">
                  {activeUser?.name?.[0]?.toUpperCase() || "U"}
                </h1>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link
                href={profilePath}
                className="w-full flex items-center gap-2"
              >
                <User />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={loading}
              className="focus:bg-red-50 text-red-600"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <span>Logout</span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
