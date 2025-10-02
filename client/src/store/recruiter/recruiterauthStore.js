import API from "@/utils/interceptor";
import { create } from "zustand";

const useRecruiterAuthStore = create((set) => ({
  isAuthenticated: false,
  recruiter: null,
  company: null,

  setAuth: (responseData) =>
    set({
      isAuthenticated: true,
      recruiter: {
        id: responseData.recruiter.id,
        name: responseData.recruiter.name,
        email: responseData.recruiter.email,
      },
      company: responseData.company
        ? {
            id: responseData.company.id,
            name: responseData.company.name,
          }
        : null,
    }),

  logout: () =>
    set({
      isAuthenticated: false,
      recruiter: null,
      company: null,
    }),

  checkAuth: async () => {
    try {
      const response = await API.get("/recruiter/auth/check-auth");

      set({
        isAuthenticated: true,
        recruiter: response.data.recruiter,
        company: response.data.recruiter?.companyId || null,
      });
    } catch (error) {
      set({
        isAuthenticated: false,
        recruiter: null,
        company: null,
      });
    }
  },
}));

export default useRecruiterAuthStore;
