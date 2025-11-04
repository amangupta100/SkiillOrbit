const nodemailer = require("nodemailer");
const {
  applicationStatusTemplate,
} = require("../../email_template/recruiter/applicationStatusTemplate");

// ⚙️ Transporter configuration (you can move to a single mailer utility)
let transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "skillorbit01@gmail.com",
    pass: "kyst ovep ombh toph", // app password, not plain password
  },
});

// ✅ Recruiter greeting (unchanged)
const greetRecCont = async (req, res) => {
  const { email, name } = req.body;

  try {
    await transport.sendMail({
      from: "SkillOrbit <skillorbit01@gmail.com>",
      to: email,
      subject: "Welcome to SkillOrbit 🎉",
      text: `Hi ${name},\n\nWelcome to SkillOrbit`,
      html: `<h3>Hi ${name},</h3><p>Welcome to <b>SkillOrbit</b>! We're glad to have you onboard.</p>`,
    });

    res.json({ success: true, message: "Welcome email sent successfully" });
  } catch (err) {
    console.error("Error sending recruiter greeting:", err);
    res.json({ success: false, message: "Email not sent" });
  }
};

// ✅ Application status email (reusable from controller)
const applicationStatusUpdate = async (
  email,
  name,
  jobRole,
  status,
  recruiterName
) => {
  try {
    const html = applicationStatusTemplate(
      name,
      jobRole,
      status,
      recruiterName
    );

    await transport.sendMail({
      from: "SkillOrbit <skillorbit01@gmail.com>",
      to: email,
      subject: `Application Status Update for ${jobRole}`,
      html,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { greetRecCont, applicationStatusUpdate };
