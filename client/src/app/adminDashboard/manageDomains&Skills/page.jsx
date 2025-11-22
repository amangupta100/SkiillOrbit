"use client";
import React, { useEffect, useState } from "react";
import API from "@/utils/interceptor";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const Page = () => {
  const [domainData, setDomainData] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const res = await API.get("/admin/manageDomain&Skills/getDomain");
        setDomainData(res.data.data);
      } catch (err) {
        toast.error("Error fetching domains:", err.message);
      }
    };

    fetchDomains();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Domains</h1>

      <div className="flex flex-wrap gap-4">
        {domainData.map((item, index) => (
          <div
            key={index}
            onClick={() =>
              router.push(
                `/adminDashboard/manageDomains&Skills/${encodeURIComponent(
                  item.domain
                )}`
              )
            }
            className="border cursor-pointer flex flex-col rounded-lg w-full p-4 mb-4 bg-gray-50 shadow-sm"
          >
            <h2 className="font-semibold text-lg">
              {item.domain}
              <h2 className="text-sm text-gray-500">
                Total {item.roles.length} roles of {item.domain}
              </h2>
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
