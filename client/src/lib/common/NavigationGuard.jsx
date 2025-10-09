"use client";
import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ButtonLoader from "@/utils/Loader";

export default function NavigationGuard({
  message = "Your interview progress will be lost if you leave this page.",
  url = "/job-seekerDashboard/interviewPreparation",
  EndIntervSession,
}) {
  const [showNavDialog, setShowNavDialog] = useState(false);
  const pendingNavigation = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Warn on refresh / close tab
    const handleBeforeUnload = (e) => {
      e.returnValue = message; // ✅ no preventDefault
    };

    // Intercept back/forward navigation
    const handlePopState = (e) => {
      pendingNavigation.current = () => window.history.back();
      setShowNavDialog(true);
      // stay on current page until user confirms
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    // push initial state so back/forward can be caught
    window.history.pushState(null, "", window.location.href);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [message]);

  const handleLeave = async () => {
    try {
      setLoading(true);
      const resp = await EndIntervSession();
      if (resp?.success) {
        toast.success("Interview Ended Successfully");
      } else toast.error(resp?.message || "Error ending session");
    } catch (err) {
      toast.error("Error ending session. Please try again." + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={showNavDialog} onOpenChange={setShowNavDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave this page?</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowNavDialog(false)}>
            Stay
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setShowNavDialog(false);
              window.location.href = url;
              handleLeave();
            }}
            disabled={loading}
          >
            {loading && <ButtonLoader />} {loading ? "Leaving..." : "Leave"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
