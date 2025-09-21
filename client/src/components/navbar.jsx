"use client";
import Image from "next/image";
import logo from "@/assests/logo.png";
import Link from "next/link";
import icon from "@/assests/menu-veggie-burger.svg";
import useSidebarStore from "@/store/sidebarStore";
import Sidebar from "./hero/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { useEffect } from "react";

const Header = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebarStore();
  const pathname = usePathname();

  if (pathname.startsWith("/interviews")) {
    return null;
  }
  return (
    <div>
      <div className="w-full z-[100] flex items-center justify-between border-b-[1.6px] border-zinc-300 md:px-7 px-4 py-2 bg-zinc-200/20 backdrop-blur-lg">
        <>
          <Image
            className="cursor-pointer"
            onClick={() => (window.location.href = "/")}
            priority
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            alt="logo"
            src={logo}
            width={136}
            height={68}
          />
        </>

        {!pathname.includes("/register/job-seeker/profileSetup") && (
          <>
            <div className={`hidden sm:gap-5 sm:flex sm:items-center`}>
              <Link href="/about">About</Link>
              <Button
                className="text-base font-light"
                onClick={() => (window.location.href = "/login/job-seeker")}
              >
                Get Started
              </Button>
            </div>
            <Image
              onClick={toggleSidebar}
              alt="Veggie_Icon"
              src={icon}
              className="sm:hidden inline-block mr-5"
              width={35}
              height={35}
            />
          </>
        )}
      </div>
      {isSidebarOpen && <Sidebar />}
    </div>
  );
};

export default Header;
