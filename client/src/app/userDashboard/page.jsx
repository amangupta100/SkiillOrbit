"use client";
import ActivityHeatmap from "@/components/userDashboard/HeatMap";
import useAuthStore from "@/store/authStore";
import { useEffect } from "react";

const Page = () => {
  const { user } = useAuthStore();

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 p-6">
      <div className="mb-6 text-xl font-semibold">
        <h1> Welcome , {user.name}</h1>
      </div>
      {/* Render heatmap here */}
      <ActivityHeatmap />
    </main>
  );
};

export default Page;
