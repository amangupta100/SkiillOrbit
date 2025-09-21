"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Tabs() {
  const pathname = usePathname();

  // Hide Tabs on /register/job-seeker/profileSetup
  if (
    pathname.startsWith("/register/job-seeker/profileSetup") ||
    pathname.startsWith("/register/recruiter/profileSetup") ||
    pathname.startsWith("/register/recruiter/profileSetup/uploadCompanyLogo")
  ) {
    return null;
  }

  const tabs = [
    {
      name: "Job Seeker",
      registerHref: "/register/job-seeker",
      loginHref: "/login/job-seeker",
    },
    {
      name: "Recruiter",
      registerHref: "/register/recruiter",
      loginHref: "/login/recruiter",
    },
  ];

  // Determine if we're on a login or register route
  const isLoginRoute = pathname.startsWith("/login");

  return (
    <div className="w-full flex justify-center">
      <div className="mt-16 border-[1.6px] rounded-lg border-b-0 border-gray-300 mb-6 w-fit shadow-sm">
        <div className="mx-auto px-4">
          <div className="flex w-fit justify-center">
            <div className="flex space-x-4">
              {tabs.map((tab) => {
                // Use the appropriate href based on current route
                const href = isLoginRoute ? tab.loginHref : tab.registerHref;
                // Check if current path matches either login or register version
                const isActive =
                  pathname.startsWith(tab.registerHref) ||
                  pathname.startsWith(tab.loginHref);

                return (
                  <Link
                    key={href} onClick={()=>window.location.href=href}
                    href={href}
                    className={cn(
                      "px-6 py-3 text-sm font-medium transition-colors hover:text-primary",
                      isActive
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:border-b-2 hover:border-muted"
                    )}
                  >
                    <h1 className="text-base">{tab.name}</h1>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
