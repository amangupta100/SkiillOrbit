"use client";
import { DesktopAppSidebar } from "@/components/common/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

const layout = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DesktopAppSidebar />

        <div className="flex-1 overflow-x-hidden">
          <main className="flex-1 overflow-x-hidden pb-12"> {children} </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default layout;
