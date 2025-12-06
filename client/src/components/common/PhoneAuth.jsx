import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase_config";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Phone,
  Lock,
  Loader2,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { toast } from "sonner";

export default function PhoneAuth() {
  // 🔥 Modal opens automatically
  const [isOpen, setIsOpen] = useState(true);

  const [step, setStep] = useState("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [expiryTime, setExpiryTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [attempts, setAttempts] = useState(0);

  const recaptchaContainerRef = useRef(null);

  const MAX_ATTEMPTS = 2;
  const OTP_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes

  // ===== TIMER FOR OTP =====
  useEffect(() => {
    if (!expiryTime || step !== "otp") {
      setTimeLeft("");
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        clearInterval(timer);
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime, step]);

  // ===== RECAPTCHA =====
  useEffect(() => {
    if (!window.recaptchaVerifier && recaptchaContainerRef.current) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          recaptchaContainerRef.current,
          {
            size: "invisible",
            callback: () => {},
            "expired-callback": () => {
              toast.error("Session expired, try again.");
            },
          }
        );

        window.recaptchaVerifier.render();
      } catch (err) {
        console.error("Captcha init error:", err);
      }
    }

    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {}
      }
    };
  }, []);

  /* ---------------------------------------
     ✔ FUNCTION: Save Verified Data to IndexedDB
  ---------------------------------------- */
  const saveToIndexedDB = async (data) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("AuthDB", 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("verifiedUsers")) {
          db.createObjectStore("verifiedUsers", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("verifiedUsers", "readwrite");
        const store = tx.objectStore("verifiedUsers");
        store.add(data);

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject("Failed to store data.");
      };

      request.onerror = () => reject("IndexedDB connection failed");
    });
  };

  // ===== SEND OTP =====
  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!phoneNumber || phoneNumber.length < 10) {
      return toast.error("Enter a valid phone number with country code.");
    }

    try {
      setLoading(true);

      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );

      setConfirmationResult(result);
      setStep("otp");
      setExpiryTime(Date.now() + OTP_VALIDITY_MS);
      setAttempts(0);

      toast.success("OTP sent successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ===== VERIFY OTP =====
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) return toast.error("Enter 6-digit OTP.");
    if (expiryTime && Date.now() > expiryTime)
      return toast.error("OTP expired.");
    if (attempts >= MAX_ATTEMPTS)
      return toast.error("Maximum attempts reached.");

    try {
      setLoading(true);
      await confirmationResult.confirm(otp);

      // 🔥 STORE VERIFIED DATA IN INDEXEDDB
      await saveToIndexedDB({
        type: "phone",
        value: phoneNumber,
        verifiedAt: new Date().toISOString(),
      });

      toast.success("Phone Verified & Saved!");
      setStep("success");
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS)
        toast.error("Max attempts reached — resend OTP.");
      else
        toast.error(
          `Incorrect OTP. Attempts left: ${MAX_ATTEMPTS - newAttempts}`
        );
    } finally {
      setLoading(false);
    }
  };

  // ===== CLOSE FLOW =====
  const resetFlow = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep("phone");
      setPhoneNumber("");
      setOtp("");
      setConfirmationResult(null);
      setAttempts(0);
      setExpiryTime(null);
      setTimeLeft("");
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative">
      <div ref={recaptchaContainerRef} id="recaptcha-container"></div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {/* 🔥 No Trigger — directly open */}

        <DialogContent className="sm:max-w-md p-0 overflow-hidden shadow-xl">
          <DialogHeader className="p-6 pb-2 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {step === "phone" && <Phone className="text-primary w-6 h-6" />}
              {step === "otp" && <Lock className="text-primary w-6 h-6" />}
              {step === "success" && (
                <CheckCircle2 className="text-green-600 w-6 h-6" />
              )}
            </div>

            <DialogTitle className="text-xl font-bold">
              {step === "phone" && "Enter Phone Number"}
              {step === "otp" && "Enter OTP"}
              {step === "success" && "Verified Successfully!"}
            </DialogTitle>

            <DialogDescription>
              {step === "phone" &&
                "We will send a secure OTP to verify your phone."}
              {step === "otp" && `OTP sent to ${phoneNumber}`}
              {step === "success" && "You are now logged in securely."}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-2">
            <AnimatePresence mode="wait">
              {/* PHONE STEP */}
              {step === "phone" && (
                <motion.form
                  key="phone-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleSendOtp}
                  className="space-y-4"
                >
                  <Input
                    type="tel"
                    placeholder="+1 555 000 0000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                  />

                  <Button className="w-full h-12" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />{" "}
                        Sending...
                      </>
                    ) : (
                      <>
                        Send OTP <ArrowRight className="ml-2" />
                      </>
                    )}
                  </Button>
                </motion.form>
              )}

              {/* OTP STEP */}
              {step === "otp" && (
                <motion.form
                  key="otp-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onSubmit={handleVerifyOtp}
                  className="space-y-6"
                >
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {timeLeft && (
                    <p className="text-center text-sm font-medium">
                      {timeLeft === "00:00"
                        ? "OTP Expired"
                        : `Expires in ${timeLeft}`}
                    </p>
                  )}

                  <Button className="w-full h-12" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />{" "}
                        Verifying...
                      </>
                    ) : (
                      "Confirm OTP"
                    )}
                  </Button>
                </motion.form>
              )}

              {/* SUCCESS STEP */}
              {step === "success" && (
                <motion.div
                  key="success-step"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4 py-4"
                >
                  <CheckCircle2 className="text-green-600 mx-auto" size={50} />

                  <Button className="w-full h-12" onClick={resetFlow}>
                    Close & Continue
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
