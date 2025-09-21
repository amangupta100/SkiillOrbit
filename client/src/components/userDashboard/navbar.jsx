"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import useAuthStore from "@/store/authStore";
import useRecruiterAuthStore from "@/store/recruiter/recruiterauthStore";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function DashboardNavbar() {
  const { user } = useAuthStore();
  const { recruiter } = useRecruiterAuthStore();
  const pathname = usePathname();

  const paths = [
    "/userDashboard/test/testEnvironment",
    "/userDashboard/interviewPreparation/interview",
    "/register/job-seeker/profileSetup",
    "/register/recruiter/profileSetup",
  ];

  const shouldHide =
    paths.includes(pathname) || pathname.startsWith("/interviews/");

  if (shouldHide) {
    return null;
  }
  return (
    <nav className="sticky top-0 z-[50] w-full bg-gray-200/40 backdrop-blur-md border-b border-gray-300 px-3 py-2">
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger className="lg:hidden flex-shrink-0" />
        </div>

        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <div className="">
              <div className="w-10 h-10 overflow-hidden rounded-full border-[1.6px] relative cursor-pointer border-zinc-400 flex justify-center items-center">
                {user?.image ? (
                  <Image
                    alt="profileImg"
                    sizes="64px"
                    priority
                    fill
                    src={user.image.data}
                  />
                ) : (
                  <h1 className="text-lg">
                    {" "}
                    {user?.name[0] || recruiter?.name[0]}
                  </h1>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
