"use client";
import { useEffect, useState } from "react";
import useAuthStore from "@/store/authStore";

export function useAuthNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const { checkAuth } = useAuthStore();
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  const checkNetwork = () => {
    const status = !navigator.onLine;
    setIsOffline(status);
    return status;
  };

  useEffect(() => {
    const handleOnline = async () => {
      setIsReconnecting(true);
      try {
        await checkAuth(); // Re-authenticate when back online
      } finally {
        setIsOffline(false);
        setIsReconnecting(false);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setIsReconnecting(false);
    };

    const timeoutId = setTimeout(() => {
      checkNetwork();
    }, 100);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkAuth]);

  return {
    isOffline,
    isReconnecting,
    checkNetwork,
    initialCheckComplete,
    setInitialCheckComplete,
  };
}
