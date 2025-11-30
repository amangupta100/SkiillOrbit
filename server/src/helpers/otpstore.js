// otpStore.js (simple in-memory storage)
const otpStore = new Map();

// TTL = 5 minutes
const OTP_TTL = 5 * 60 * 1000;

function setOTP(email, otp) {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + OTP_TTL,
  });
}

function getOTP(email) {
  return otpStore.get(email);
}

function deleteOTP(email) {
  otpStore.delete(email);
}

module.exports = { setOTP, getOTP, deleteOTP };
