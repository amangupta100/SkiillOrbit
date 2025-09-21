// store/emailVerfStore.js
import { create } from 'zustand';

export const useEmailVerifyStore = create((set) => ({
  email: '',
  isEmailVerified: false,
  isOTPSent: false,
  otp: '',
  showEmailVerifyBox: false,
  showOtpBox:false,

  setEmail: (email) => set({ email }),
  setOTP: (otp) => set({ otp }),
  verifyEmail: () => set({ isEmailVerified: true }),
  setOTPSent: (bool) => set({ isOTPSent: bool }),
  setShowEmailVerifyBox: (bool) => set({ showEmailVerifyBox: bool }),
  setshowOtpBox:(bool)=>set({showOtpBox:bool}),
  resetEmailVerification: () =>
    set({
      email: '',
      isEmailVerified: false,
      isOTPSent: false,
      otp: '',
      showEmailVerifyBox: false,
    }),
}));
