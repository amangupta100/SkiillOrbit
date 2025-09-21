"use client";
import React, { useState } from "react";
import { recruiterLoginFields } from "../../InputFields";
import see from "../../../../assests/eye.svg";
import hide from "../../../../assests/eye-off.svg";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import API from "@/utils/interceptor";
import useRecruiterAuthStore from "@/store/recruiter/recruiterauthStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ButtonLoader from "@/utils/Loader";

const page = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useRecruiterAuthStore();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Check if all required fields are filled
  const canSubmit = recruiterLoginFields.every(
    (field) =>
      !field.required ||
      (formData[field.name] && formData[field.name].trim() !== "")
  );

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const resp = await API.post("/recruiter/login", formData);
      const { success: succ, message } = resp.data;
      console.log(resp.data.data);
      if (succ) {
        toast.success(message);
        window.location.href = "/recruiterDashboard";
      } else toast.warning(message);
    } catch (err) {
      toast.warning(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="border-[1.6px] border-zinc-200 rounded-lg w-[98%] lg:w-[35%] md:w-[60%] px-5 min-h-fit py-6">
        <h1 className="text-xl font-semibold text-center">Recruiter Login</h1>

        <form className="mt-10" onSubmit={handleFormSubmit}>
          {recruiterLoginFields.map((field) => {
            return (
              <div key={field.name} className="mb-4">
                <label className="block text-base font-medium mb-1">
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    type={
                      field.name === "password"
                        ? showPassword
                          ? "text"
                          : "password"
                        : field.type
                    }
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  {field.name === "password" && (
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <Image
                        className="cursor-pointer"
                        src={showPassword ? see : hide}
                        alt={showPassword ? "Hide password" : "Show password"}
                        width={20}
                        height={20}
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <Button
            className="w-full"
            onClick={handleFormSubmit}
            disabled={!canSubmit || loading}
          >
            {loading && <ButtonLoader />} Login Recruiter
          </Button>
        </form>

        <div className="mt-4">
          <h1>
            Don't have an account yet?{" "}
            <a
              className="text-blue-500 cursor-pointer underline font-semibold"
              onClick={() => (window.location.href = "/register/recruiter")}
            >
              Register
            </a>{" "}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default page;
