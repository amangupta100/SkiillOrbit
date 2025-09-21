"use client";
import React, { useEffect, useState } from "react";
import close from "@/assests/x.svg";
import Image from "next/image";
import { Edit } from "lucide-react";
import { useEmailVerifyStore } from "@/store/emailVerfStore";
import Button from "../ui/button2";
import { OTPInput } from "input-otp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import API from "@/utils/interceptor";
import ButtonLoader from "@/utils/Loader";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/lightswind/input-otp";

const EmailVerifyBox = ({ email, name }) => {
  const { setShowEmailVerifyBox, showOtpBox, setshowOtpBox, verifyEmail } =
    useEmailVerifyStore();
  const [emailVer, setEmail] = useState(email);
  const [loading, setLoading] = useState(false);
  const [uOTP, setuOTP] = useState("");
  const [aOTP, setaOTP] = useState("");

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSendOTP = async () => {
    try {
      setLoading(true);
      const resp = await API.post("/sendOTP", { email, name });
      const { success: succ, message, otp } = resp.data;
      if (succ) {
        toast.success(message);
        setshowOtpBox(true);
        setaOTP(otp);
      } else toast.error(message);
    } catch (err) {
      toast.warning(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const resp = await API.post("/verifyOTP", { otp: uOTP, token: aOTP });
      const { success: succ, message } = resp.data;
      if (succ) {
        toast.success(message);
        setShowEmailVerifyBox(false);
        verifyEmail();
      } else toast.error(message);
    } catch (err) {
      toast.warning(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center backdrop-blur-md items-center bg-black/60">
      <div className="lg:w-[35%] md:w-[65%] sm:w-[78%] w-[85%] py-7 px-5 h-fit rounded-lg bg-white relative">
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
            <div className="">
              <button
                onClick={() => setshowOtpBox(false)}
                className="bg-[#2A956B] hover:bg-[#2A956B]/60 cursor-pointer rounded-lg py-2 absolute duration-200 transition-all ease-in-out top-2 left-2 text-white flex items-center justify-center px-3"
              >
                <Edit className="text-xl mr-1" />
                Edit
              </button>
              <h1 className="text-center py-7 text-xl font-bold">Verify OTP</h1>
              <div className="">
                <h1>Enter 6digit the OTP sent to {email}</h1>
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
                  <button
                    disabled={loading && uOTP.length == 0}
                    className={`mt-3 ${
                      loading ? "cursor-not-allowed" : null
                    } disabled:cursor-not-allowed py-3 mb-3 flex items-center justify-center text-white hover:text-black bg-black hover:bg-black/60  duration-200 transition-all ease-in-out cursor-pointer rounded-lg`}
                  >
                    {loading ? <ButtonLoader /> : <h1>Verify</h1>}
                  </button>
                </form>
              </div>
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
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="bg-zinc-300 mt-1 focus:outline-none text-lg py-3 px-5 rounded-lg"
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    handleSendOTP();
                  }}
                  className="w-full py-3 flex justify-center items-center rounded-lg disabled:cursor-not-allowed mt-3 bg-black cursor-pointer text-white hover:bg-black/60"
                >
                  {loading ? <ButtonLoader /> : <h1>Send OTP</h1>}
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

function Slot(props) {
  return (
    <div
      className={cn(
        "relative w-10 h-14 text-[2rem]",
        "flex items-center justify-center",
        "transition-all duration-300",
        "border-border border-y border-r first:border-l first:rounded-l-md last:rounded-r-md",
        "group-hover:border-accent-foreground/20 group-focus-within:border-accent-foreground/20",
        "outline-0 outline-accent-foreground/20",
        { "outline-4 outline-accent-foreground": props.isActive }
      )}
    >
      <div className="group-has-[input[data-input-otp-placeholder-shown]]:opacity-20">
        {props.char ?? props.placeholderChar}
      </div>
      {props.hasFakeCaret && <FakeCaret />}
    </div>
  );
}

// You can emulate a fake textbox caret!
function FakeCaret() {
  return (
    <div className="absolute pointer-events-none inset-0 flex items-center justify-center animate-caret-blink">
      <div className="w-px h-8 bg-white" />
    </div>
  );
}

// Inspired by Stripe's MFA input.
function FakeDash() {
  return (
    <div className="flex w-10 justify-center items-center">
      <div className="w-3 h-1 rounded-full bg-border" />
    </div>
  );
}
