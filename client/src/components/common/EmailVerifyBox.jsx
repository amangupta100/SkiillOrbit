"use client";
import React, { useEffect, useState } from "react";
import close from "@/assests/x.svg";
import Image from "next/image";
import { Edit } from "lucide-react";
import { useEmailVerifyStore } from "@/store/emailVerfStore";
import { toast } from "sonner";
import API from "@/utils/interceptor";
import ButtonLoader from "@/utils/Loader";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/lightswind/input-otp";

const EmailVerifyBox = ({ email, name }) => {
  const { setShowEmailVerifyBox, showOtpBox, setshowOtpBox, verifyEmail } =
    useEmailVerifyStore();

  const [emailVer, setEmail] = useState(email);
  const [loading, setLoading] = useState(false);

  const [uOTP, setuOTP] = useState("");
  const [aOTP, setaOTP] = useState("");

  const [timer, setTimer] = useState(0); // 5 mins countdown

  // Prevent page scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = originalOverflow);
  }, []);

  // TIMER COUNTDOWN
  useEffect(() => {
    if (!showOtpBox || timer <= 0) return;

    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, showOtpBox]);

  const handleSendOTP = async () => {
    try {
      setLoading(true);
      setuOTP(""); // fresh input

      const resp = await API.post("/sendOTP", {
        email,
        name,
        forgotPassword: false,
      });
      const { success, message, otp } = resp.data;

      if (success) {
        toast.success(message);
        setaOTP(otp);
        setshowOtpBox(true);
        setTimer(300); // 5 minutes
      } else toast.error(message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      setuOTP(""); // clear OTP input

      const resp = await API.post("/sendOTP", {
        email,
        name,
        forgotPassword: false,
      });
      const { success, message, otp } = resp.data;

      if (success) {
        setaOTP(otp);
        setTimer(300); // restart timer
        toast.success("OTP resent");
      } else {
        toast.error(message);
      }
    } catch (err) {
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (timer <= 0) return toast.error("OTP expired");

    try {
      setLoading(true);
      const resp = await API.post("/verifyOTP", {
        otp: uOTP,
        token: aOTP,
        forgotPassword: false,
      });
      const { success, message } = resp.data;

      if (success) {
        toast.success(message);
        setShowEmailVerifyBox(false);
        verifyEmail();
      } else toast.error(message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center backdrop-blur-md items-center bg-black/60">
      <div className="lg:w-[35%] md:w-[65%] sm:w-[78%] w-[85%] py-7 px-5 h-fit rounded-lg bg-white relative">
        {/* CLOSE BUTTON */}
        <Image
          onClick={() => {
            setShowEmailVerifyBox(false);
            setshowOtpBox(false);
          }}
          className="absolute top-2 right-2 cursor-pointer"
          alt="Close"
          src={close}
          width={27}
          height={27}
        />

        <div className="px-3">
          {showOtpBox ? (
            <div>
              {/* EDIT EMAIL BUTTON */}
              <button
                onClick={() => {
                  setshowOtpBox(false);
                  setuOTP("");
                }}
                className="bg-[#2A956B] hover:bg-[#2A956B]/60 cursor-pointer rounded-lg py-2 absolute top-2 left-2 text-white flex items-center justify-center px-3"
              >
                <Edit className="text-xl mr-1" /> Edit
              </button>

              <h1 className="text-center py-7 text-xl font-bold">Verify OTP</h1>
              <p>Enter 6-digit OTP sent to {email}</p>

              {/* TIMER */}
              <div className="text-gray-500 text-sm mt-2">
                OTP expires in:
                <span className="font-semibold">
                  {" "}
                  {String(Math.floor(timer / 60)).padStart(2, "0")}:
                  {String(timer % 60).padStart(2, "0")}
                </span>
              </div>

              {/* EXPIRED MESSAGE */}
              {timer <= 0 && (
                <p className="text-red-500 text-sm mt-1">
                  OTP expired — request a new one.
                </p>
              )}

              <form onSubmit={handleVerifyOTP} className="flex flex-col">
                <div className="mt-6">
                  <InputOTP value={uOTP} onChange={setuOTP} maxLength={6}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {/* RESEND BUTTON */}
                {/* <button
                  type="button"
                  disabled={loading || timer > 0}
                  onClick={handleResendOTP}
                  className="text-blue-500 underline text-sm mt-2 disabled:opacity-60"
                >
                  {loading ? <ButtonLoader /> : "Resend OTP"}
                </button> */}

                {/* VERIFY BUTTON */}
                <button
                  disabled={loading || uOTP.length < 6 || timer <= 0}
                  className="mt-4 py-3 mb-3 flex items-center justify-center text-white bg-black rounded-lg disabled:bg-gray-400"
                >
                  {loading ? <ButtonLoader /> : "Verify"}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-semibold text-center">
                Verify Email Address
              </h1>

              <h1 className="mt-10">Enter email to verify via OTP</h1>
              <div className="flex flex-col">
                <input
                  value={emailVer}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="bg-zinc-300 mt-1 focus:outline-none text-lg py-3 px-5 rounded-lg"
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSendOTP}
                  className="w-full py-3 mt-3 bg-black text-white rounded-lg flex justify-center items-center disabled:cursor-not-allowed"
                >
                  {loading ? <ButtonLoader /> : "Send OTP"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerifyBox;
