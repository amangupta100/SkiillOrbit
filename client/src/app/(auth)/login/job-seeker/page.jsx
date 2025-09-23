"use client";
import React, { useState } from "react";
import { userLoginFields } from "../../InputFields";
import Link from "next/link";
import see from "../../../../assests/eye.svg";
import hide from "../../../../assests/eye-off.svg";
import Image from "next/image";
import { toast } from "sonner";
import API from "@/utils/interceptor";
import useAuthStore from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ButtonLoader from "@/utils/Loader";

const page = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth, user } = useAuthStore();
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

  // Compute if all required fields are filled
  const canSubmit = userLoginFields.every(
    (field) =>
      !field.required ||
      (formData[field.name] && formData[field.name].trim() !== "")
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await API.post("/auth/login", formData);
      const { success: succ, message } = response.data;
      console.log(response.data);

      if (succ) {
        toast.success(message);
        setAuth({
          email: response.data.user.email,
          role: response.data.user.role,
          id: response.data.user.id,
          name: response.data.user.name,
        });
        router.push("/userDashboard");
        router.refresh();
      } else {
        toast.error(message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="border-[1.6px] border-zinc-200 rounded-lg w-[98%] lg:w-[35%] md:w-[70%] px-5 min-h-fit py-6">
        <h1 className="text-xl font-semibold text-center">Login</h1>

        <form onSubmit={handleSubmit} className="mt-10">
          {userLoginFields.map((field) => {
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
            className="bg-black text-white text-base w-full"
            disabled={loading || !canSubmit}
          >
            {loading && <ButtonLoader />} Login As Job-Seeker
          </Button>
        </form>

        <div className="mt-4">
          <h1>
            Don't have an account yet?{" "}
            <a
              className="text-blue-500 cursor-pointer underline font-semibold"
              onClick={() => (window.location.href = "/register/job-seeker")}
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
