import { create } from "zustand"

export const useFilterModal = create((set) => ({
  isOpen: false,
  filters: {
    status: "All",
    minApplicants: 0,
    minAvgScore: 0,
    postingDuration: "All",
    jobType: "All",
    location: "All"
  },
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters }
    })),
  resetFilters: () =>
    set({
      filters: {
        status: "All",
        minApplicants: 0,
        minAvgScore: 0,
        postingDuration: "All",
        jobType: "All",
        location: "All"
      }
    })
}))
