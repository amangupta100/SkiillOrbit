import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useEvaluationStore = create(
  persist(
    (set) => ({
      // Loading states
      loading: false,
      loaderStatus: "",
      submissionState: "idle", // 'idle', 'pending', 'success', 'error'
      submissionError: null,

      // Actions
      setLoading: (value) => set({ loading: value }),
      setLoaderStatus: (status) => set({ loaderStatus: status }),

      startSubmission: () =>
        set({
          loading: true,
          submissionState: "pending",
          submissionError: null,
          loaderStatus:
            "Submitting your session & checking for any suspicious activity...",
        }),

      completeSubmission: () =>
        set({
          loading: false,
          submissionState: "success",
          loaderStatus: "",
        }),

      failSubmission: (error) =>
        set({
          loading: false,
          submissionState: "error",
          submissionError: error,
          loaderStatus: error.message || "Submission failed",
        }),

      resetSubmission: () =>
        set({
          loading: false,
          loaderStatus: "",
          submissionState: "idle",
          submissionError: null,
        }),
    }),
    {
      name: "evaluation-store",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist these states
      partialize: (state) => ({
        loading: state.loading,
        loaderStatus: state.loaderStatus,
        submissionState: state.submissionState,
      }),
    }
  )
);

export default useEvaluationStore;
