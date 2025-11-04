import { create } from "zustand";

const useJobFormStore = create((set) => ({
  // Modal state
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),

  // Form state
  jobForm: {
    location: "Remote", // enum: Remote, Hybrid, On-Site
    domain: "",
    role: "",
    requiredSkills: [],
    optionalSkills: [],
    description: "",
    salaryRange: {
      min: "",
      max: "",
    },
    benchmarkScore: "",
    nop: "",
    experience: "",
    preferredJoiningDate: "",
    extBenefits: [], // Changed from null → []
  },

  // Update top-level field
  setField: (field, value) =>
    set((state) => ({
      jobForm: {
        ...state.jobForm,
        [field]: value,
      },
    })),

  // Update nested salaryRange field
  setSalaryField: (key, value) =>
    set((state) => ({
      jobForm: {
        ...state.jobForm,
        salaryRange: {
          ...state.jobForm.salaryRange,
          [key]: value,
        },
      },
    })),

  // Update required and optional skills
  setSkills: (skills) =>
    set((state) => ({
      jobForm: {
        ...state.jobForm,
        requiredSkills: skills,
      },
    })),

  setOptionalSkills: (skills) =>
    set((state) => ({
      jobForm: {
        ...state.jobForm,
        optionalSkills: skills,
      },
    })),

  // Reset form
  resetForm: () =>
    set(() => ({
      jobForm: {
        location: "Remote",
        domain: "",
        role: "",
        requiredSkills: [],
        optionalSkills: [],
        description: "",
        salaryRange: { min: "", max: "" },
        benchmarkScore: "",
        nop: "",
        experience: "",
        preferredJoiningDate: "",
        extBenefits: [],
      },
    })),
}));

export default useJobFormStore;
