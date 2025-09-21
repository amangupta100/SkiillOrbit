"use client";
import React, { useState } from "react";
import { recruiterSignupFields } from "../../InputFields";
import see from "../../../../assests/eye.svg";
import hide from "../../../../assests/eye-off.svg";
import Image from "next/image";
import ReactPasswordChecklist from "react-password-checklist";
import API from "@/utils/interceptor";
import { Button } from "@/components/ui/button";
import { useEmailVerifyStore } from "@/store/emailVerfStore";
import EmailVerifyBox from "@/components/common/EmailVerifyBox";
import { toast } from "sonner";
import ButtonLoader from "@/utils/Loader";

const page = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    conPass: "",
    company: "",
    designation: "",
    phone: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isEmailVerified, showEmailVerifyBox, setShowEmailVerifyBox } =
    useEmailVerifyStore();

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

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const allFieldsFilled =
    formData.name.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.password.trim() !== "" &&
    formData.company.trim() !== "" &&
    formData.designation.trim() !== "" &&
    formData.conPass.trim() !== "";

  const passwordsMatch =
    formData.password === formData.conPass && formData.password.length > 0;
  const canSubmit =
    allFieldsFilled && passwordsMatch && isPasswordValid && isEmailVerified;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post("/recruiter/profilePendingCookie");

      // 2. Then set the form data in store
      localStorage.setItem("RecruiterData", JSON.stringify(formData));

      // 3. Finally redirect (with full reload)
      window.location.href = "/register/recruiter/profileSetup";
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStatus = () => {
    if (isEmailVerified) {
      return <p className="text-green-600 text-sm mt-2">Email verified!</p>;
    } else {
      return (
        <div className="flex items-center">
          <p className="text-red-600 text-sm">Email not verified.</p>
          <p
            onClick={() => {
              formData.email.length > 5 && formData.email.includes("@")
                ? setShowEmailVerifyBox(true)
                : toast.warning("Please enter a valid email to verify");
            }}
            className="text-blue-500 cursor-pointer font-semibold underline"
          >
            Verify
          </p>
        </div>
      );
    }
  };

  return (
    <div className="flex items-center justify-center">
      {showEmailVerifyBox && (
        <EmailVerifyBox email={formData.email} name={formData.name} />
      )}

      <div className="border-[1.6px] border-zinc-200 rounded-lg w-[98%] lg:w-[40%] md:w-[85%] lg px-5 min-h-fit py-6">
        <h1 className="text-xl font-semibold text-center">
          Register Recruiter
        </h1>

        <form onSubmit={handleSubmit} className="mt-10">
          {recruiterSignupFields.map((field) => (
            <div key={field.name} className="mb-4">
              <label className="block text-base font-medium mb-1">
                {field.label}
              </label>

              {/* Password field with toggle */}
              {field.name === "password" ? (
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={field.placeholder}
                    required={field.required}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute top-3 right-3 flex items-center"
                  >
                    <Image
                      src={showPassword ? see : hide}
                      alt={showPassword ? "Hide password" : "Show password"}
                      width={20}
                      height={20}
                      className="cursor-pointer"
                    />
                  </button>
                  {formData.password.length > 0 && (
                    <ReactPasswordChecklist
                      rules={[
                        "capital",
                        "lowercase",
                        "specialChar",
                        "minLength",
                      ]}
                      minLength={5}
                      value={formData.password}
                      valueAgain={formData.conPass}
                      onChange={setIsPasswordValid}
                      messages={{
                        minLength: "Password has minimum 5 characters",
                        specialChar:
                          "Password must contain special characters such as $&*#",
                        capital:
                          "Password must contain at least one capital letter",
                        lowercase:
                          "Password must contain at least one lowercase letter",
                      }}
                    />
                  )}
                </div>
              ) : /* Confirm Password field with toggle */
              field.name === "confirmPassword" ? (
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="conPass"
                    placeholder={field.placeholder}
                    required={field.required}
                    value={formData.conPass}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute top-3 right-3 flex items-center"
                  >
                    <Image
                      src={showConfirmPassword ? see : hide}
                      alt={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      width={20}
                      height={20}
                      className="cursor-pointer"
                    />
                  </button>
                  {formData.conPass.length > 0 && !passwordsMatch && (
                    <p className="text-red-500 text-sm mt-1">
                      Password do not match.
                    </p>
                  )}
                </div>
              ) : /* Regular input fields */
              field.name === "email" ? (
                <>
                  <input
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  {formData.email.length > 0 && renderEmailStatus()}
                </>
              ) : (
                <>
                  <input
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-md"
                  />
                </>
              )}
            </div>
          ))}

          <Button
            className="bg-black text-white text-base w-full"
            disabled={loading || !canSubmit}
          >
            {loading && <ButtonLoader />} Register Recruiter
          </Button>
        </form>

        <div className="mt-4">
          <h1>
            Already have an account?{" "}
            <a
              className="text-blue-500 cursor-pointer cunderline font-semibold"
              onClick={() => (window.location.href = "/login/recruiter")}
            >
              Login
            </a>
          </h1>
        </div>
      </div>
    </div>
  );
};

export default page;
