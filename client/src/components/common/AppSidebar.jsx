"use client";
import {
  Briefcase,
  Calendar,
  FileTextIcon,
  Home,
  MessageSquare,
  User,
  MousePointer2Icon,
  MoreHorizontal,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import logo from "@/assests/logo.png";
import { usePathname, useRouter } from "next/navigation";
import API from "@/utils/interceptor";
import { toast } from "sonner";
import { IoIosVideocam } from "react-icons/io";
import React, { useState } from "react";
import useChatStore from "@/store/recruiter/ChatStore";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FaPowerOff } from "react-icons/fa6";

const recruiterNavigationItems = [
  { title: "Home", url: "/recruiterDashboard", icon: Home },
  {
    title: "Manage Postings",
    url: "/recruiterDashboard/managePosting&applicants",
    icon: Briefcase,
  },
  {
    title: "Messages",
    url: "/recruiterDashboard/conversations",
    icon: MessageSquare,
  },
  {
    title: "Manage Interviews",
    url: "/interviews",
    icon: Calendar,
  },
  { title: "Profile", url: "/recruiterDashboard/profile", icon: User },
];

const jobSeekerNavigationItems = [
  { title: "Home", url: "/job-seekerDashboard", icon: Home },
  {
    title: "Opportunities",
    url: "/job-seekerDashboard/opportunities",
    icon: Briefcase,
  },
  {
    title: "Skill Tests",
    url: "/job-seekerDashboard/test",
    icon: FileTextIcon,
  },
  {
    title: "Applied",
    url: "/job-seekerDashboard/applied",
    icon: MousePointer2Icon,
  },
  {
    title: "Manage Interviews",
    url: "/interviews",
    icon: Calendar,
  },
  {
    title: "Interview Prep",
    url: "/job-seekerDashboard/interviewPreparation",
    icon: IoIosVideocam,
  },
  {
    title: "Messages",
    url: "/job-seekerDashboard/conversations",
    icon: MessageSquare,
  },
  { title: "Profile", url: "/job-seekerDashboard/profile", icon: User },
];

const hidePaths = [
  "/job-seekerDashboard/test/verifyIdentity",
  "/job-seekerDashboard/test/instructions",
  "/job-seekerDashboard/test/testEnvironment",
  "/job-seekerDashboard/test/submit",
  "/job-seekerDashboard/interviewPreparation/interview",
  "/interviews",
  "/recruiterDashboard/conversations",
  "/job-seekerDashboard/conversations",
];

// Desktop-only Sidebar Component (self-contained)
export function DesktopAppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const unreadCount = useChatStore((state) => state.getUnreadCount());
  const role = pathname.includes("/recruiterDashboard")
    ? "recruiter"
    : "job-seeker";

  const navigationItems =
    role === "recruiter" ? recruiterNavigationItems : jobSeekerNavigationItems;

  const shouldHide =
    hidePaths.includes(pathname) || pathname.startsWith("/interviews/");

  const handleLogout = async () => {
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

  if (shouldHide) return null;

  return (
    <Sidebar className="border-r bg-white z-[500] flex flex-col justify-between">
      {/* Header */}
      <SidebarHeader className="p-6">
        <Image
          onClick={() => router.push("/")}
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          priority
          className="cursor-pointer"
          src={logo}
          alt="Logo"
          width={136}
          height={136}
        />
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="px-4 flex-1 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const homePath =
                  role === "recruiter"
                    ? "/recruiterDashboard"
                    : "/job-seekerDashboard";

                const showBadge = item.title === "Messages" && unreadCount > 0;

                const isHomeActive =
                  item.url === homePath &&
                  (pathname === homePath || pathname === homePath + "/");

                const isActive =
                  isHomeActive ||
                  (item.url !== homePath &&
                    (pathname === item.url ||
                      (pathname.startsWith(item.url + "/") &&
                        pathname.split("/").length <=
                          item.url.split("/").length + 1)));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`relative w-full justify-start gap-3 px-4 py-5 rounded-lg transition-all duration-200 overflow-visible ${
                        isActive
                          ? "bg-gray-400/80 hover:bg-gray-400/40 text-white font-bold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <a
                        href={item.url}
                        className="flex items-center gap-3 min-w-0 w-full overflow-visible relative"
                      >
                        <div className="relative">
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          {showBadge && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </div>
                        <span className="flex-1 min-w-0 font-medium text-base whitespace-normal break-words">
                          {item.title}
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ✅ Logout Button at Bottom */}
      <SidebarFooter className="border-t px-4 py-3 bg-white">
        <button
          onClick={handleLogout}
          disabled={loading}
          className={`w-full flex text-white bg-red-500 hover:bg-red-600/90 cursor-pointer items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
            loading
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          <FaPowerOff size={18} />
          {loading ? "Logging out..." : "Logout"}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

export function MobileAppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const unreadCount = useChatStore((state) => state.getUnreadCount()); // ✅ Reactive subscription

  const [loading, setLoading] = useState(false);

  // 🎭 Determine user role
  const role = pathname.includes("/recruiterDashboard")
    ? "recruiter"
    : "job-seeker";

  // 🧭 Role-based navigation
  const navigationItems =
    role === "recruiter"
      ? [
          { title: "Home", url: "/recruiterDashboard", icon: Home },
          {
            title: "Manage Postings",
            url: "/recruiterDashboard/managePosting&applicants",
            icon: Briefcase,
          },
          {
            title: "Messages",
            url: "/recruiterDashboard/conversations",
            icon: MessageSquare,
          },
          {
            title: "Manage Interviews",
            url: "/interviews",
            icon: Calendar,
          },
          { title: "Profile", url: "/recruiterDashboard/profile", icon: User },
        ]
      : [
          { title: "Home", url: "/job-seekerDashboard", icon: Home },
          {
            title: "Opportunities",
            url: "/job-seekerDashboard/opportunities",
            icon: Briefcase,
          },
          {
            title: "Skill Tests",
            url: "/job-seekerDashboard/test",
            icon: FileTextIcon,
          },
          {
            title: "Applied",
            url: "/job-seekerDashboard/applied",
            icon: MousePointer2Icon,
          },
          {
            title: "Manage Interviews",
            url: "/interviews",
            icon: Calendar,
          },
          {
            title: "Interview Prep",
            url: "/job-seekerDashboard/interviewPreparation",
            icon: IoIosVideocam,
          },
          {
            title: "Messages",
            url: "/job-seekerDashboard/conversations",
            icon: MessageSquare,
          },
          { title: "Profile", url: "/job-seekerDashboard/profile", icon: User },
        ];

  const homePath =
    role === "recruiter" ? "/recruiterDashboard" : "/job-seekerDashboard";

  // ✅ Unified active logic
  const getIsActive = (itemUrl) => {
    const isHomeActive =
      itemUrl === homePath &&
      (pathname === homePath || pathname === homePath + "/");

    const isActive =
      isHomeActive ||
      (itemUrl !== homePath &&
        (pathname === itemUrl ||
          (pathname.startsWith(itemUrl + "/") &&
            pathname.split("/").length <= itemUrl.split("/").length + 1)));

    return { isActive, isHomeActive };
  };

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

  // 🧮 Define main visible items
  const visibleTitles =
    role === "recruiter"
      ? ["Home", "Manage Postings", "Messages", "Profile"]
      : ["Home", "Opportunities", "Applied", "Messages", "Profile"];
  const visibleItems = navigationItems.filter((item) =>
    visibleTitles.includes(item.title)
  );
  const moreItems = navigationItems.filter(
    (item) => !visibleTitles.includes(item.title)
  );

  const hidePaths = [
    "/job-seekerDashboard/test/verifyIdentity",
    "/job-seekerDashboard/test/instructions",
    "/job-seekerDashboard/test/testEnvironment",
    "/job-seekerDashboard/test/submit",
    "/job-seekerDashboard/interviewPreparation/interview",
    "/interviews",
    "/recruiterDashboard/conversations",
    "/job-seekerDashboard/conversations",
  ];
  const shouldHide =
    hidePaths.includes(pathname) || pathname.startsWith("/interviews/");
  if (shouldHide) return null;

  // Left items based on role
  const leftItems =
    role === "recruiter"
      ? visibleItems.filter(
          (item) =>
            item.title === "Manage Postings" || item.title === "Messages"
        )
      : visibleItems.filter(
          (item) => item.title === "Opportunities" || item.title === "Applied"
        );

  // Right items based on role
  const rightItems =
    role === "recruiter"
      ? visibleItems.filter((item) => item.title === "Profile")
      : visibleItems.filter(
          (item) => item.title === "Messages" || item.title === "Profile"
        );

  const renderNavItem = (item, isLeft = false) => {
    const Icon = item.icon;
    const { isActive } = getIsActive(item.url);
    const showBadge = item.title === "Messages" && unreadCount > 0;

    return (
      <Link
        key={item.title}
        href={item.url}
        className="relative flex flex-col items-center justify-center px-3 transition-all duration-300 group min-w-[64px]"
      >
        <div className="relative">
          <Icon
            className={cn(
              "w-6 h-6 mb-1 transition-all duration-300",
              isActive
                ? "text-blue-600 scale-110"
                : "text-gray-500 group-hover:text-gray-800"
            )}
          />
          {showBadge && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <span
          className={cn(
            "text-xs font-medium transition-all duration-300",
            isActive ? "text-blue-600" : "text-gray-600"
          )}
        >
          {item.title}
        </span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 md:hidden">
      <div className="relative flex items-center justify-between px-4 pb-safe">
        {/* 🔹 Left items */}
        <div className="flex flex-1 justify-evenly mr-6">
          {leftItems.map((item) => renderNavItem(item, true))}
        </div>

        {/* 🔹 Center floating home button */}
        {visibleItems
          .filter((item) => item.title === "Home")
          .map((item) => {
            const Icon = item.icon;
            const { isActive, isHomeActive } = getIsActive(item.url);
            return (
              <Link
                key={item.title}
                href={item.url}
                className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center transition-all duration-300 group"
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                    isHomeActive ? "bg-blue-500" : "bg-blue-400/70"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-7 h-7 z-[100] transition-all duration-300",
                      isActive
                        ? "text-white scale-110"
                        : "text-white/90 group-hover:text-white"
                    )}
                  />
                </div>
              </Link>
            );
          })}

        {/* 🔹 Right items + More */}
        <div className="flex flex-1 justify-evenly ml-6">
          {rightItems.map((item) => renderNavItem(item))}

          {/* 🔹 More dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center justify-center py-3 px-3 transition-all duration-300 group min-w-[64px]">
                <MoreHorizontal className="w-6 h-6 mb-1 text-gray-500 group-hover:text-gray-800" />
                <span className="text-xs font-medium text-gray-600">More</span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align="end"
              sideOffset={8}
              className="w-52"
            >
              {/* Extra items not visible in main bar */}
              {moreItems.map((item, index) => (
                <React.Fragment key={item.title}>
                  {index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem asChild>
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 w-full"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0 text-gray-600" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
              {moreItems.length > 0 && <DropdownMenuSeparator />}

              {/* Logout always last */}
              <DropdownMenuItem onClick={handleLogout} disabled={loading}>
                <FaPowerOff className="w-4 h-4 mr-2 text-red-600" />
                {loading ? (
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <span className="text-red-600 text-sm font-medium">
                    Logout
                  </span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

// Main AppSidebar (for backward compatibility, renders both conditionally)
export function AppSidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DesktopAppSidebar />
      </div>

      {/* Mobile Bottom Bar */}
      <MobileAppSidebar />
    </>
  );
}
