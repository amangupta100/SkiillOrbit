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

const adminNavigationItems = [
  {
    title: "Manage Skills & Domains",
    url: "/adminDashboard/manageDomains&Skills",
    icon: Briefcase,
  },
  {
    title: "Manage Queries",
    url: "/adminDashboard/allQueries",
    icon: MessageSquare,
  },
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
    : pathname.includes("/job-seekerDashboard")
    ? "job-seeker"
    : "admin";

  const navigationItems =
    role === "recruiter"
      ? recruiterNavigationItems
      : role === "job-seeker"
      ? jobSeekerNavigationItems
      : adminNavigationItems;

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
                    : role === "job-seeker"
                    ? "/job-seekerDashboard"
                    : "adminDashboard";

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
  const unreadCount = useChatStore((state) => state.getUnreadCount());
  const [loading, setLoading] = useState(false);

  const role = pathname.includes("/recruiterDashboard")
    ? "recruiter"
    : "job-seeker";

  const navigationItems =
    role === "recruiter"
      ? [
          {
            id: "postings",
            title: "Manage Postings",
            url: "/recruiterDashboard/managePosting&applicants",
            icon: Briefcase,
          },
          {
            id: "messages",
            title: "Messages",
            url: "/recruiterDashboard/conversations",
            icon: MessageSquare,
          },
          {
            id: "home",
            title: "Home",
            url: "/recruiterDashboard",
            icon: Home,
            isCenter: true,
          },
          {
            id: "interviews",
            title: "Manage Interviews",
            url: "/interviews",
            icon: Calendar,
          },
          {
            id: "profile",
            title: "Profile",
            url: "/recruiterDashboard/profile",
            icon: User,
          },
        ]
      : [
          {
            id: "opportunities",
            title: "Opportunities",
            url: "/job-seekerDashboard/opportunities",
            icon: Briefcase,
          },
          {
            id: "applied",
            title: "Applied",
            url: "/job-seekerDashboard/applied",
            icon: MousePointer2Icon,
          },
          {
            id: "home",
            title: "Home",
            url: "/job-seekerDashboard",
            icon: Home,
            isCenter: true,
          },
          {
            id: "messages",
            title: "Messages",
            url: "/job-seekerDashboard/conversations",
            icon: MessageSquare,
          },
          {
            id: "profile",
            title: "Profile",
            url: "/job-seekerDashboard/profile",
            icon: User,
          },
          {
            title: "Manage Interviews",
            url: "/interviews",
            icon: Calendar,
          },
          {
            id: "tests",
            title: "Skill Tests",
            url: "/job-seekerDashboard/test",
            icon: FileTextIcon,
          },
          {
            id: "interview_prep",
            title: "Interview Prep",
            url: "/job-seekerDashboard/interviewPreparation",
            icon: IoIosVideocam,
          },
        ];

  // ✅ Visible items — Home stays in center, 2 on left, 2 on right
  const visibleTitles =
    role === "recruiter"
      ? ["Manage Postings", "Messages", "Home", "Profile"]
      : ["Opportunities", "Profile", "Home", "Applied"];

  const visibleItems = navigationItems.filter((item) =>
    visibleTitles.includes(item.title)
  );

  const dropdownItems = navigationItems.filter(
    (item) => !visibleTitles.includes(item.title)
  );

  const hidePaths = [
    "/job-seekerDashboard/test/verifyIdentity",
    "/job-seekerDashboard/test/instructions",
    "/job-seekerDashboard/test/testEnvironment",
    "/job-seekerDashboard/test/submit",
    "/job-seekerDashboard/interviewPreparation/interview",
    "/recruiterDashboard/conversations",
    "/job-seekerDashboard/conversations",
  ];
  if (hidePaths.includes(pathname) || pathname.startsWith("/interviews/"))
    return null;

  const homePath =
    role === "recruiter" ? "/recruiterDashboard" : "/job-seekerDashboard";
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="relative bg-[hsl(var(--nav-background))] border-t border-[hsl(var(--nav-background))]/50 shadow-2xl">
        <div className="flex items-center justify-around px-4 pb-safe">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const { isActive, isHomeActive } = getIsActive(item.url);

            if (item.isCenter) {
              return (
                <Link
                  key={item.id}
                  href={item.url}
                  className="flex flex-col items-center justify-center -mt-14 transition-all duration-300 group"
                >
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center border-[1.6px] border-zinc-200 mb-1 transition-all duration-300 shadow-lg",
                      isHomeActive
                        ? "bg-[hsl(var(--nav-center-active))] shadow-[hsl(var(--nav-center-active))]/50"
                        : "bg-[hsl(var(--nav-center-bg))] group-hover:bg-[hsl(var(--nav-center-bg))]/80"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-7 h-7 transition-all duration-300",
                        isHomeActive
                          ? "text-white scale-110"
                          : "text-[hsl(var(--nav-foreground))] group-hover:text-white"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium transition-all duration-300",
                      isHomeActive
                        ? "text-[hsl(var(--nav-active))]"
                        : "text-[hsl(var(--nav-foreground))] group-hover:text-white"
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.url}
                className="flex flex-col items-center justify-center py-3 px-3 transition-all duration-300 group min-w-[64px]"
              >
                <Icon
                  className={cn(
                    "w-6 h-6 mb-1 transition-all duration-300",
                    isActive
                      ? "text-[hsl(var(--nav-active))] scale-110"
                      : "text-[hsl(var(--nav-foreground))] group-hover:text-white"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium transition-all duration-300",
                    isActive
                      ? "text-[hsl(var(--nav-active))]"
                      : "text-[hsl(var(--nav-foreground))] group-hover:text-white"
                  )}
                >
                  {item.title}
                </span>
              </Link>
            );
          })}

          {/* ✅ 3-Dots Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center justify-center py-3 px-3 transition-all duration-300 group min-w-[64px]">
                <MoreHorizontal className="w-6 h-6 mb-1 text-[hsl(var(--nav-foreground))] group-hover:text-white" />
                <span className="text-xs font-medium text-[hsl(var(--nav-foreground))]">
                  More
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align="end"
              sideOffset={8}
              className="w-52"
            >
              {dropdownItems.map((item, idx) => (
                <React.Fragment key={item.id}>
                  {idx > 0 && <DropdownMenuSeparator />}
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

              {dropdownItems.length > 0 && <DropdownMenuSeparator />}

              {/* ✅ Logout */}
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
