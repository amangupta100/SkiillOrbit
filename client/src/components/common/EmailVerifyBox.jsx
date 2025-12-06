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
  const {
    setShowEmailVerifyBox,
    resetEmailVerification,
    showOtpBox,
    setshowOtpBox,
    verifyEmail,
  } = useEmailVerifyStore();

  const [emailVer, setEmail] = useState(email);
  const [loading, setLoading] = useState(false);

  const [uOTP, setuOTP] = useState("");

  const [timer, setTimer] = useState(0); // seconds

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!showOtpBox || timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, showOtpBox]);

  // SEND OTP
  const handleSendOTP = async () => {
    try {
      setLoading(true);
      setuOTP("");

      const { data } = await API.post("/sendOTP", {
        email,
        name,
        forgotPassword: false,
      });

      if (data.success) {
        toast.success("OTP sent");
        setshowOtpBox(true);
        setTimer(300); // 5 min exact
      } else toast.error(data.message);
    } catch (err) {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // RESEND OTP
  const handleResendOTP = async () => {
    if (timer > 0) return; // don’t allow early resend

    try {
      setLoading(true);
      setuOTP("");

      const { data } = await API.post("/sendOTP", {
        email,
        name,
        forgotPassword: false,
      });

      if (data.success) {
        toast.success("OTP resent");
        setTimer(300);
      } else toast.error(data.message);
    } catch {
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // IndexedDB Save
  const saveEmailToIndexedDB = async (emailToSave) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("AuthDB", 2); // bump version if required

      request.onupgradeneeded = () => {
        const db = request.result;

        // CREATE object store if missing
        if (!db.objectStoreNames.contains("verifiedUsers")) {
          db.createObjectStore("verifiedUsers", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };

      request.onsuccess = () => {
        const db = request.result;

        // If store STILL doesn't exist → recreate DB fully
        if (!db.objectStoreNames.contains("verifiedUsers")) {
          console.warn("Store missing. Recreating DB...");
          db.close();
          const req2 = indexedDB.open("AuthDB", request.result.version + 1);
          req2.onupgradeneeded = () => {
            const newDB = req2.result;
            newDB.createObjectStore("verifiedUsers", {
              keyPath: "id",
              autoIncrement: true,
            });
          };
          req2.onsuccess = () => resolve(saveEmailToIndexedDB(emailToSave));
          return;
        }

        // NORMAL WRITE
        const tx = db.transaction("verifiedUsers", "readwrite");
        const store = tx.objectStore("verifiedUsers");

        store.add({
          type: "email",
          value: emailToSave,
          verifiedAt: new Date().toISOString(),
        });

        tx.oncomplete = () => resolve(true);
        tx.onerror = (err) => reject(err);
      };

      request.onerror = () => reject("Failed to open IndexedDB");
    });
  };

  // VERIFY OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (timer <= 0) return toast.error("OTP expired");

    try {
      setLoading(true);
      const { data } = await API.post("/verifyOTP", {
        email,
        otp: uOTP,
      });

      if (data.success) {
        toast.success("OTP Verified");
        await saveEmailToIndexedDB(emailVer);
        resetEmailVerification();
      } else toast.error(data.message);
    } catch (err) {
      toast.error("Verification failed");
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
            <>
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

              {timer > 0 && (
                <div className="text-gray-500 text-sm mt-2">
                  OTP expires in:
                  <span className="font-semibold">
                    {" "}
                    {String(Math.floor(timer / 60)).padStart(2, "0")}:
                    {String(timer % 60).padStart(2, "0")}
                  </span>
                </div>
              )}

              {timer <= 0 && (
                <p className="text-red-500 text-sm mt-1">
                  OTP expired — request a new one.
                </p>
              )}

              <form onSubmit={handleVerifyOTP} className="flex flex-col mt-6">
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

                {/* RESEND BUTTON */}
                <button
                  type="button"
                  disabled={loading || timer > 0}
                  onClick={handleResendOTP}
                  className="text-blue-500 underline text-start text-sm mt-2 disabled:opacity-40"
                >
                  {loading ? <ButtonLoader /> : "Resend OTP"}
                </button>

                <button
                  disabled={loading || uOTP.length < 6 || timer <= 0}
                  className="mt-4 py-3 mb-3 flex items-center justify-center text-white bg-black rounded-lg disabled:bg-gray-400"
                >
                  {loading ? <ButtonLoader /> : "Verify"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-center">
                Verify Email Address
              </h1>

              <h1 className="mt-10">Enter email to verify via OTP</h1>
              <input
                value={emailVer}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="bg-zinc-300 mt-1 focus:outline-none text-lg py-3 px-5 rounded-lg w-full"
              />

              <button
                disabled={loading}
                onClick={handleSendOTP}
                className="w-full py-3 mt-3 bg-black text-white rounded-lg flex justify-center items-center disabled:cursor-not-allowed"
              >
                {loading ? <ButtonLoader /> : "Send OTP"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerifyBox;
