import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

// Separate axios instance for refresh (no interceptors)
const RefreshAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await RefreshAPI.get("/common/auth/refreshToken"); // ✅ won't loop

        // normalize relative path
        if (
          originalRequest.url.startsWith(process.env.NEXT_PUBLIC_API_BASE_URL)
        ) {
          originalRequest.url = originalRequest.url.replace(
            process.env.NEXT_PUBLIC_API_URL,
            ""
          );
        }

        return API(originalRequest);
      } catch (refreshErr) {}
    }

    return Promise.reject(error);
  }
);

export default API;
