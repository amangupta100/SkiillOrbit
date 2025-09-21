import API from "@/utils/interceptor";
import { create } from "zustand";

// In authStore.js
const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,

  setAuth: (userData) =>
    set({
      isAuthenticated: true,
      user: userData,
    }),

  logout: () =>
    set({
      isAuthenticated: false,
      user: null,
    }),

  // Add this function
  checkAuth: async () => {
    try {
      const response = await API.get("/auth/check-auth");
      set({ isAuthenticated: true, user: response.data.user });
    } catch (error) {
      set({ isAuthenticated: false, user: null });
    }
  },
}));

export default useAuthStore;
