import { create } from "zustand";
import { persist } from "zustand/middleware";
import useEvaluationStore from "@/store/test/useEvaluationState";
import {
  saveVideoChunks,
  loadVideoChunks,
  clearVideoChunks,
} from "@/utils/recordingStorage";
import API2 from "@/utils/interceptor2";
import API from "@/utils/interceptor";

export const useRecordingStore = create(
  persist(
    (set, get) => ({
      isRecording: false,
      submissionStatus: null,
      recordingId: null,

      startRecording: async () => {
        await clearVideoChunks();
        set({
          isRecording: true,
          submissionStatus: null,
          recordingId: Date.now().toString(),
        });
      },

      stopRecording: () => {
        if (typeof window !== "undefined" && window.recorder) {
          window.recorder.stop();
        }
        set({ isRecording: false });
      },

      addChunk: async (chunk) => {
        if (!chunk || chunk.size === 0) return;
        const currentChunks = await loadVideoChunks();
        const updated = [...currentChunks, chunk];
        await saveVideoChunks(updated);
      },

      clearRecording: async () => {
        await clearVideoChunks();
        set({
          isRecording: false,
          submissionStatus: null,
          recordingId: null,
        });
      },

      submitRecording: async () => {
        try {
          const req = await API.get("/job-seeker/profile/getUserDet");
          const name = req.data.name;
          const email = req.data.email;
          const { recordingId } = get();
          if (!recordingId) throw new Error("No recording ID available");

          const { startSubmission, completeSubmission, failSubmission } =
            useEvaluationStore.getState();

          startSubmission(); // Start loader (UI feedback)

          const chunks = await loadVideoChunks();
          if (!chunks || chunks.length === 0) {
            throw new Error("No video chunks available to submit");
          }

          const formData = new FormData();
          // Create WebM blob
          const webmBlob = new Blob(chunks, { type: "video/webm" });
          formData.append("name", name);
          formData.append("email", email);

          // Prepare form data
          formData.append("video", webmBlob, "recording.webm");
          formData.append("recordingId", recordingId);
          // Upload via API
          const response = await API2.post("/evaluate-video", formData);

          // Cleanup after success
          await get().clearRecording();
          completeSubmission();

          return {
            status: "success",
            message: response?.data?.message || "Video uploaded successfully",
          };
        } catch (error) {
          useEvaluationStore.getState().failSubmission(error);
          set({ submissionStatus: "error" });
          console.error("Error uploading recording:", error);
          throw error;
        }
      },
    }),
    {
      name: "recording-store",
      partialize: (state) => {
        const { isRecording, submissionStatus, recordingId } = state;
        return { isRecording, submissionStatus, recordingId };
      },
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);
