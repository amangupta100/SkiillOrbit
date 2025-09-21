"use client";
import {
  Briefcase,
  Calendar,
  FileText,
  Home,
  MessageSquare,
  User,
  Brain,
  FileTextIcon,
  MousePointer2Icon,
  TestTubes,
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
import Image from "next/image";
import logo from "@/assests/logo.png";
import { usePathname, useRouter } from "next/navigation";
import Button from "../ui/button2";
import API from "@/utils/interceptor";
import { toast } from "sonner";
import { IoIosVideocam } from "react-icons/io";
import ButtonLoader from "@/utils/Loader";
import { useState } from "react";

const recruiterNavigationItems = [
  { title: "Home", url: "/recruiterDashboard", icon: Home },
  {
    title: "Manage Posting",
    url: "/recruiterDashboard/managePosting",
    icon: Briefcase,
  },
  {
    title: "All Applicants",
    url: "/recruiterDashboard/applicants",
    icon: User,
  },
  {
    title: "Messages",
    url: "/recruiterDashboard/messages",
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
  { title: "Home", url: "/userDashboard", icon: Home },
  {
    title: "Opportunities",
    url: "/userDashboard/opportunities",
    icon: Briefcase,
  },
  { title: "Skill Tests", url: "/userDashboard/test", icon: FileTextIcon },
  {
    title: "Applied",
    url: "/userDashboard/appliedOpportunities",
    icon: MousePointer2Icon,
  },
  {
    title: "Manage Interviews",
    url: "/interviews",
    icon: Calendar,
  },
  {
    title: "Interview Prep",
    url: "/userDashboard/interviewPreparation",
    icon: IoIosVideocam,
  },
  { title: "Messages", url: "/userDashboard/messages", icon: MessageSquare },
  { title: "Profile", url: "/userDashboard/profile", icon: User },
];

const hidePaths = [
  "/userDashboard/test/verifyIdentity",
  "/userDashboard/test/instructions",
  "/userDashboard/test/testEnvironment",
  "/userDashboard/test/submit",
  "/userDashboard/interviewPreparation/interview",
  "/interviews",
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const role = pathname.includes("/recruiterDashboard")
    ? "recruiter"
    : "job-seeker";

  const navigationItems =
    role === "recruiter" ? recruiterNavigationItems : jobSeekerNavigationItems;

  const handleLogout = async () => {
    setLoading(true);
    if (role === "recruiter") {
      const resp = await API.post("/recruiter/logout");
      const { message, success: succ } = resp.data;
      if (succ) {
        toast.success(message);
      }
      setLoading(false);
    } else {
      const resp = await API.post("/auth/logout");
      toast.success(resp.data.message);
      setLoading(false);
    }
    if (pathname === "/userDashboard/test/verifyIdentity") {
      return null;
    }
    window.location.reload();
  };

  const shouldHide =
    hidePaths.includes(pathname) || pathname.startsWith("/interviews/");

  // ⛔ Don’t render if path is in hide list
  if (shouldHide) {
    return null;
  }

  return (
    <Sidebar className="border-r bg-white z-[500]">
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

      <SidebarContent className="px-4 z-[500]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                // Determine the "home" path based on role
                const homePath =
                  role === "recruiter"
                    ? "/recruiterDashboard"
                    : "/userDashboard";

                // For "Home", only highlight if the pathname matches the home path
                const isHomeActive =
                  item.url === homePath &&
                  (pathname === homePath || pathname === homePath + "/");

                // For other items, highlight if the pathname exactly matches the item's URL
                // or if it starts with the item's URL followed by a slash, but not for deeper sub-routes
                const isActive =
                  isHomeActive ||
                  (item.url !== homePath &&
                    (pathname === item.url ||
                      (pathname.startsWith(item.url + "/") &&
                        pathname.split("/").length <=
                          item.url.split("/").length + 1)));

                return (
                  <SidebarMenuItem key={item.title} className="z-50">
                    <SidebarMenuButton
                      asChild
                      className={`w-full justify-start gap-3 px-4 py-5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-gray-400/80 hover:bg-gray-400/40 text-white font-bold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <a href={item.url} className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium text-base">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="ml-auto bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          onClick={handleLogout}
          className="hover:bg-red-600/90 flex items-center justify-center gap-1 bg-red-500 cursor-pointer"
        >
          {loading ? <ButtonLoader /> : "Logout"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
