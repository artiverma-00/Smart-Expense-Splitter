"use client";

import { create } from "zustand";
import axios from "axios";

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user, loading: false }),

  fetchMe: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/api/auth/me");
      set({ user: res.data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await axios.post("/api/auth/logout", null, { timeout: 5000 });
    } catch {
      // Continue local logout even if network request fails.
    } finally {
      set({ user: null, loading: false });
      window.location.assign("/login");
    }
  },
}));

export default useAuthStore;
