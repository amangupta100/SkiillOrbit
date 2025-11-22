"use client";

import React, { useEffect, useState } from "react";
import API from "@/utils/interceptor";
import { useRouter } from "next/navigation";

const Page = ({ params }) => {
  // ⬅ unwrap the params Promise
  const { domain } = React.use(params);
  const decodedDomain = decodeURIComponent(domain);

  const [domainData, setDomainData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDomainData = async () => {
      try {
        const res = await API.get(
          `/admin/manageDomain&Skills/getRoles?domain=${decodedDomain}`
        );
        setDomainData(res.data.data);
      } catch (err) {
        console.log("Error:", err);
      }
    };

    fetchDomainData();
  }, [decodedDomain]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">
        {decodedDomain} — Roles & Skills
      </h1>

      {!domainData ? (
        <p>Loading...</p>
      ) : (
        <div
          className="space-y-4 flex flex-wrap gap-2
        "
        >
          {domainData &&
            domainData.roles.map((role, index) => (
              <div
                key={index}
                onClick={() =>
                  router.push(
                    `/adminDashboard/manageDomains&Skills/${encodeURIComponent(
                      decodedDomain
                    )}/${encodeURIComponent(role.title)}`
                  )
                }
                className="border cursor-pointer rounded-lg p-4 max-h-fit bg-gray-50 shadow-sm"
              >
                <h2 className="font-semibold text-lg">{role.title}</h2>
                <h1 className="text-sm text-gray-500">
                  Total {role.skills.length} skills found
                </h1>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Page;
