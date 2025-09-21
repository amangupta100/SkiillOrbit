// stores/useSidebarStore.js
import { create } from 'zustand';

export const useProgressSidebarStore = create((set) => ({
  isSidebarVisible: false,
  toggleSidebar: () => set((state) => ({ isSidebarVisible: !state.isSidebarVisible })),
}));