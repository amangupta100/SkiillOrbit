const nodemailer = require("nodemailer");
const randomString = require("randomstring");
const { OTP_Verf } = require("../../email_template/common/SendOTP");

const generateOTP = () => {
  return randomString.generate({
    length: 6,
    charset: "numeric",
  });
};

let transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: "skillorbit01@gmail.com",
    pass: "kyst ovep ombh toph",
  },
});
const SendOTP = async (req, res) => {
  const { name, email } = req.body;
  try {
    const otp = generateOTP();
    let info = await transport.sendMail({
      from: "SkillOrbit skillorbit01@gmail.com", // sender address
      to: `${email}`, // list of receivers
      subject: "OTP Verification", // Subject line
      text: `Verify Your Email`, // plain text body
      html: OTP_Verf.replace("{{ .Token }}", otp).replace("{{ .name }}", name),
    });
    res.json({ success: true, message: "OTP send successfully", otp });
  } catch (err) {
    res.json({ success: false, message: "OTP not send" });
  }
};

const VerifyOTP = async (req, res) => {
  const { otp, token } = req.body;
  try {
    if (otp != token) res.json({ success: false, message: "Wrong OTP" });
    else {
      res.json({ success: true, message: "Email Verified Successfully" });
    }
  } catch (err) {
    res.json(err.message);
  }
};

module.exports = { SendOTP, VerifyOTP };
