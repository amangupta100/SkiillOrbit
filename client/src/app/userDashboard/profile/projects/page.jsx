"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import search from "@/assests/undraw_web-search_9qqc.svg";
import { Button } from "@/components/ui/button";
import { IoMdArrowBack, IoMdClose } from "react-icons/io";
import { IoAddOutline } from "react-icons/io5";
import { toast } from "sonner";
import API from "@/utils/interceptor";
import { MdOutlineEdit } from "react-icons/md";
import GenProjectModal from "@/components/userDashboard/profile/projectModal/GenProjectModal";

const Page = () => {
  const [projects, setProjects] = useState(null);
  const [userDet, setUserDet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const req = await API.get("/job-seeker/profile/getUserDet");
        const req2 = await API.get("/job-seeker/profile/getProjects");
        setProjects(req2.data.projects);
        setUserDet(req.data.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  console.log(userDet, projects);

  return (
    <div className="p-5">
      {modal && <GenProjectModal onClose={() => setModal(false)} />}

      {loading ? (
        <h1>Loading ...</h1>
      ) : (
        <div className="w-full border border-zinc-300 rounded-lg relative">
          {/* Top header */}
          <div className="sticky top-0 flex items-center justify-between rounded-t-lg bg-white border-b-2 border-zinc-300 p-2">
            {/* Back button */}
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-zinc-100 rounded-full">
                <IoMdArrowBack
                  onClick={() =>
                    (window.location.href = "/userDashboard/profile")
                  }
                  className="text-2xl"
                />
              </button>
              <h1 className="text-xl font-semibold">Projects</h1>
            </div>

            {/* Add button */}
            <div className="flex gap-1">
              <button
                className="p-2 hover:bg-zinc-100 rounded-full"
                onClick={() => setModal(true)}
              >
                <IoAddOutline className="text-2xl" />
              </button>

              <button
                className="p-2 hover:bg-zinc-100 rounded-full"
                onClick={() => setModal(true)}
              >
                <MdOutlineEdit className="text-2xl" />
              </button>
            </div>
          </div>

          {projects?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
              {projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="border border-zinc-200 rounded-md p-4 hover:shadow-sm transition"
                >
                  <h2 className="font-semibold">{proj.title}</h2>
                  <p className="text-sm text-zinc-600">{proj.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <Image src={search} alt="Search" width={250} height={250} />
              <h1 className="mt-4 text-lg font-medium text-zinc-600">
                No projects found.
              </h1>
              <Button className="mt-5" onClick={() => setModal(true)}>
                Add Projects
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Page;
