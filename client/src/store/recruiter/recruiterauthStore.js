import API from "@/utils/interceptor";
import { create } from "zustand";

const useRecruiterAuthStore = create((set) => ({
  isAuthenticated: false,
  recruiter: null,
  company: null, // Add company field

  setAuth: (responseData) => set({
    isAuthenticated: true,
    recruiter: {
      id: responseData.recruiter.id,
      name: responseData.recruiter.name,
      email: responseData.recruiter.email,
      // Add other recruiter fields as needed
    },
    company: responseData.company ? {
      id: responseData.company.id,
      name: responseData.company.name,
      // Add other company fields as needed
    } : null
  }),

  logout: () => set({
    isAuthenticated: false,
    recruiter: null,
    company: null // Clear company data on logout
  }),

  checkAuth: async () => {
    try {
      const response = await API.get('/recruiter/check-auth');
      set({ 
        isAuthenticated: true, 
        recruiter: response.data.recruiter,
        company: response.data.recruiter.companyId // Set company data from response
      });

    } catch (error) {
      set({ 
        isAuthenticated: false, 
        recruiter: null,
        company: null // Clear company data on auth failure
      });
    }
  }
}));

export default useRecruiterAuthStore;