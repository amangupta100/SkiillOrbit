const nodemailer = require("nodemailer");
const randomString = require("randomstring");
const { OTP_Verf } = require("../../email_template/common/SendOTP");
const {
  ForgotPasswordOTP,
} = require("../../email_template/common/ForgotPassword");
const {
  PasswordChangedTemplate,
} = require("../../email_template/common/ForgotPasswordChanged");

const generateOTP = () => {
  return randomString.generate({
    length: 6,
    charset: "numeric",
  });
};

let transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: process.env.NODE_ENV === "production",
  auth: {
    user: "skillorbit01@gmail.com",
    pass: "kyst ovep ombh toph",
  },
});

const SendOTP = async (req, res) => {
  const { email, forgotPassword } = req.body;

  try {
    const otp = generateOTP();

    // Choose template based on forgotPassword flag
    const template = forgotPassword ? ForgotPasswordOTP : OTP_Verf;

    await transport.sendMail({
      from: "SkillsOrbit <skillorbit01@gmail.com>",
      to: email,
      subject: forgotPassword ? "Reset Password OTP" : "Email Verification OTP",
      html: template.replace("{{ .Token }}", otp),
    });

    return res.json({
      success: true,
      message: forgotPassword
        ? "Forgot password OTP sent successfully"
        : "OTP sent successfully",
      otp,
    });
  } catch (err) {
    return res.json({ success: false, message: "OTP could not be sent" });
  }
};

const VerifyOTP = async (req, res) => {
  const { otp, token } = req.body;

  try {
    if (otp !== token) {
      return res.json({ success: false, message: "Wrong OTP" });
    }
    return res.json({ success: true, message: "OTP Verified Successfully" });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

const sendPasswordChangedMail = async (email, name) => {
  try {
    const html = PasswordChangedTemplate.replace("{{email}}", email).replace(
      "{{name}}",
      name
    );

    await transport.sendMail({
      from: "SkillsOrbit <skillorbit01@gmail.com>",
      to: email,
      subject: "Your Password Has Been Changed",
      html,
    });

    console.log("Password changed email sent to:", email);
  } catch (err) {
    console.error("Failed to send password change email:", err.message);
  }
};

module.exports = { SendOTP, VerifyOTP, sendPasswordChangedMail };
