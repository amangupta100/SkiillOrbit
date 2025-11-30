const nodemailer = require("nodemailer");
const randomString = require("randomstring");
const { OTP_Verf } = require("../../email_template/common/SendOTP");
const {
  ForgotPasswordOTP,
} = require("../../email_template/common/ForgotPassword");
const {
  PasswordChangedTemplate,
} = require("../../email_template/common/ForgotPasswordChanged");
const { getOTP, setOTP, deleteOTP } = require("../../helpers/otpstore");

const generateOTP = () => {
  return randomString.generate({
    length: 6,
    charset: "numeric",
  });
};

let transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER, // from env
    pass: process.env.SMTP_PASSWORD, // from env
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const SendOTP = async (req, res) => {
  const { email, forgotPassword } = req.body;

  try {
    const otp = generateOTP();

    // store in memory
    setOTP(email, otp);

    const template = forgotPassword ? ForgotPasswordOTP : OTP_Verf;

    await transport.sendMail({
      from: "SkillsOrbit <skillorbit01@gmail.com>",
      to: email,
      subject: forgotPassword ? "Reset Password OTP" : "Email Verification OTP",
      html: template.replace("{{ .Token }}", otp),
    });

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    return res.json({ success: false, message: "OTP could not be sent" });
  }
};

const VerifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const record = getOTP(email);

    if (!record) {
      return res.json({
        success: false,
        message: "OTP expired, request again",
      });
    }

    if (Date.now() > record.expiresAt) {
      deleteOTP(email);
      return res.json({ success: false, message: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.json({ success: false, message: "Wrong OTP" });
    }

    // success → remove OTP
    deleteOTP(email);

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
