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

export default function NavigationGuard({
  message = "Your interview progress will be lost if you leave this page.",
  url = "/userDashboard/interviewPreparation",
}) {
  const [showNavDialog, setShowNavDialog] = useState(false);
  const pendingNavigation = useRef(null);

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
            }}
          >
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
