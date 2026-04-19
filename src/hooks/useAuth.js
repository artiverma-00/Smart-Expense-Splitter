"use client";

import { useEffect } from "react";
import useAuthStore from "@/store/authStore";

export function useAuth() {
  const { user, loading, fetchMe, logout } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) fetchMe();
    }, 0);

    return () => clearTimeout(timer);
  }, [user, fetchMe]);

  return { user, loading, logout };
}
