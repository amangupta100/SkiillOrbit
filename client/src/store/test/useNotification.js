import {create} from 'zustand'

export const useNotificationStore = create((set) => ({
    isNotificationContentVisible: false,
    toggleContentVisibility: () => set((state) => ({isNotificationContentVisible: !state.isNotificationContentVisible})),
}))