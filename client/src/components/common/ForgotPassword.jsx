"use client";

import API from "@/utils/interceptor";
import ButtonLoader from "@/utils/Loader";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import Image from "next/image";
import { toast } from "sonner";

import see from "@/assests/eye.svg";
import hide from "@/assests/eye-off.svg";
import ReactPasswordChecklist from "react-password-checklist";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../lightswind/input-otp";

const ForgotPassword = ({ close }) => {
  const pathname = usePathname();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [accountExists, setAccountExists] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [uOTP, setuOTP] = useState("");
  const [otpValidated, setOtpValidated] = useState(false);
  const [actualOTP, setactualOTP] = useState(false);

  const [timer, setTimer] = useState(0); // seconds

  // Passwords
  const [newPassword, setNewPassword] = useState("");
  const [conPassword, setConPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConPass, setShowConPass] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const passwordsMatch =
    newPassword.trim().length > 0 &&
    conPassword.trim().length > 0 &&
    newPassword === conPassword;

  // Start countdown when OTP sent
  useEffect(() => {
    if (!otpSent || otpValidated) return;
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [otpSent, timer, otpValidated]);

  // STEP 1 — Verify account exists
  const handleProceed = async () => {
    if (!email.trim()) return toast.error("Enter your email");

    try {
      setLoading(true);
      const req = await API.post("/auth/checkAccount", {
        email,
        role: pathname.includes("job-seeker") ? "job-seeker" : "recruiter",
      });

      if (!req.data.exists) {
        close();
        return toast.error("Account not found");
      }

      setAccountExists(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 — Send OTP
  const handleSendOTP = async () => {
    try {
      setLoading(true);

      const resp = await API.post("/sendOTP", {
        email,
        forgotPassword: true,
      });

      if (resp.data.success) {
        setOtpSent(true);
        setactualOTP(resp.data.otp);
        setTimer(300); // 5 minutes
      } else {
        toast.error(resp.data.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ RESEND OTP FUNCTION
  const handleResendOTP = async () => {
    try {
      setLoading(true);

      // clear OTP input and UI state
      setuOTP("");
      setOtpValidated(false);
      setOtpSent(true);

      const resp = await API.post("/sendOTP", {
        email,
        forgotPassword: true,
      });

      if (resp.data.success) {
        setTimer(300); // restart timer
        toast.success("OTP resent successfully");
      } else {
        toast.error(resp.data.message);
      }
    } catch (err) {
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 — Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (timer <= 0) return toast.error("OTP expired!");

    try {
      setLoading(true);

      const resp = await API.post("/verifyOTP", {
        email,
        otp: uOTP,
        forgotPassword: true,
        token: actualOTP,
      });

      if (resp.data.success) {
        setOtpValidated(true);
      } else {
        toast.error(resp.data.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 4 — Reset Password
  const handleResetPassword = async () => {
    if (!isPasswordValid || !passwordsMatch)
      return toast.error("Invalid password");

    try {
      setLoading(true);

      const resp = await API.post("/auth/reset_password", {
        email,
        newPassword,
      });

      if (resp.data.success) {
        toast.success("Password updated successfully!");
        close();
      } else {
        toast.error(resp.data.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex justify-center items-center">
      <div className="bg-white rounded-lg w-[85%] sm:w-[78%] md:w-[65%] lg:w-[35%] py-7 px-5 relative">
        <IoClose
          onClick={close}
          className="absolute top-2 right-2 w-6 h-6 cursor-pointer"
        />

        <h1 className="text-center text-lg font-semibold">Forgot Password</h1>

        {/* STEP 1 — Enter Email */}
        {!accountExists && (
          <>
            <label className="mt-10 block text-base font-medium mb-1">
              Enter your email
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 border rounded-md"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              disabled={loading || !email.trim()}
              onClick={handleProceed}
              className="mt-6 w-full flex items-center justify-center gap-3 py-3 bg-black text-white rounded-md"
            >
              {loading ? <ButtonLoader color="white" /> : "Proceed"}
            </button>
          </>
        )}

        {/* STEP 2 — Send OTP */}
        {accountExists && !otpSent && (
          <>
            <h2 className="mt-9 text-sm text-gray-600">
              A 6-digit OTP will be sent to: <b>{email}</b>
            </h2>
            <button
              disabled={loading}
              onClick={handleSendOTP}
              className="mt-6 flex gap-3 items-center justify-center w-full py-3 bg-black text-white rounded-md"
            >
              {loading ? <ButtonLoader color="white" /> : "Send OTP"}
            </button>
          </>
        )}

        {/* STEP 3 — Verify OTP */}
        {otpSent && !otpValidated && (
          <>
            <form onSubmit={handleVerifyOTP}>
              <h1 className="mt-6">Enter OTP send to {email}</h1>

              {/* Countdown */}
              <div className="text-gray-500 text-sm my-2">
                OTP expires in:{" "}
                <span className="font-semibold">
                  {String(Math.floor(timer / 60)).padStart(2, "0")}:
                  {String(timer % 60).padStart(2, "0")}
                </span>
              </div>

              {/* Expired message + Resend Button */}
              {timer <= 0 && (
                <div className="mt-2">
                  <p className="text-red-500 mb-1 text-sm">
                    OTP expired — request a new one.
                  </p>
                </div>
              )}

              <InputOTP
                value={uOTP}
                onChange={setuOTP}
                maxLength={6}
                className="mt-6"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>

              <button
                disabled={loading || uOTP.length < 6 || timer <= 0}
                className="mt-6 w-full py-3 flex items-center justify-center gap-3 bg-black text-white rounded-md"
              >
                {loading ? <ButtonLoader color="white" /> : "Verify OTP"}
              </button>
            </form>
          </>
        )}

        {/* STEP 4 — Reset Password */}
        {otpValidated && (
          <>
            <h1 className="mt-6 font-semibold">Create New Password</h1>

            {/* New Password */}
            <div className="relative mt-4">
              <input
                type={showNewPass ? "text" : "password"}
                placeholder="New password"
                className="w-full border px-4 py-3 rounded-md"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-3"
              >
                <Image src={showNewPass ? see : hide} width={20} height={20} />
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative mt-4">
              <input
                type={showConPass ? "text" : "password"}
                placeholder="Confirm password"
                className="w-full border px-4 py-3 rounded-md"
                value={conPassword}
                onChange={(e) => setConPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConPass(!showConPass)}
                className="absolute right-3 top-3"
              >
                <Image src={showConPass ? see : hide} width={20} height={20} />
              </button>
            </div>

            <ReactPasswordChecklist
              rules={["capital", "lowercase", "specialChar", "minLength"]}
              minLength={5}
              value={newPassword}
              valueAgain={conPassword}
              onChange={setIsPasswordValid}
              messages={{
                minLength: "Minimum 5 characters",
                specialChar: "At least 1 special character",
                capital: "At least 1 uppercase letter",
                lowercase: "At least 1 lowercase letter",
              }}
            />

            <button
              disabled={!isPasswordValid || !passwordsMatch || loading}
              onClick={handleResetPassword}
              className="mt-6 w-full flex justify-center items-center gap-3 py-3 bg-black text-white rounded-md disabled:bg-gray-400"
            >
              {loading ? <ButtonLoader /> : "Update Password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
