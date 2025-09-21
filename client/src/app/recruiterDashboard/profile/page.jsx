"use client";
import API from "@/utils/interceptor";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Briefcase, Linkedin, Globe } from "lucide-react";

const Page = () => {
  const [recDet, setrecDet] = useState(null);

  useEffect(() => {
    const fetchDet = async () => {
      const req = await API.get("/recruiter/profile/getProfileDet");
      setrecDet(req.data.data);
    };
    fetchDet();
  }, []);

  console.log(recDet);

  return (
    <div className="p-5 w-full">
      <h1 className="text-2xl font-semibold">Recruiter Profile</h1>

      {/* Recruiter Card */}
      <Card className="rounded-2xl shadow-md p-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-700">
            {recDet?.name?.charAt(0) || "R"}
          </div>

          {/* Basic Info */}
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">{recDet?.name}</h2>
            <p className="text-gray-500">
              {recDet?.designation || "Recruiter"}
            </p>
          </div>
        </div>

        <CardContent className="mt-2 space-y-4">
          {/* Email */}
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-600" />
            <a
              href={`mailto:${recDet?.email}`}
              className="text-blue-600 hover:underline"
            >
              {recDet?.email}
            </a>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-600" />
            <span>{recDet?.phoneNumber || "Not Provided"}</span>
          </div>

          {/* Company */}
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-gray-600" />
            <span>Company: {recDet?.companyId?.name}</span>
          </div>

          {/* LinkedIn */}
          {recDet?.linkedInProfile && (
            <div className="flex items-center gap-3">
              <Linkedin className="h-5 w-5 text-gray-600" />
              <a
                href={recDet?.linkedInProfile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                LinkedIn Profile
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Details */}
      {recDet?.companyId && (
        <Card className="mt-6 rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Company Details</h3>
          <div className="flex items-center gap-4">
            {/* Logo */}
            {recDet.companyId.logo?.data ? (
              <img
                src={recDet.companyId.logo.data}
                alt="Company Logo"
                className="h-16 w-16 rounded-xl object-cover border"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-gray-200 flex items-center justify-center">
                <Briefcase className="h-7 w-7 text-gray-500" />
              </div>
            )}

            {/* Info */}
            <div>
              <h4 className="text-xl font-semibold">{recDet.companyId.name}</h4>
              <p className="text-gray-600 text-sm">{recDet.companyId.about}</p>
              {recDet.companyId.websiteURL && (
                <div className="flex items-center gap-2 mt-2">
                  <Globe className="h-5 w-5 text-gray-600" />
                  <a
                    href={recDet.companyId.websiteURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {recDet.companyId.websiteURL}
                  </a>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Page;
