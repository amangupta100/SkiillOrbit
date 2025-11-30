const nodemailer = require("nodemailer");
const { greetUser } = require("../../email_template/user/welcomeUser");
const {
  testResultReadyTemplate,
} = require("../../email_template/user/resulttemplate");
const {
  applicationSuccessTemplate,
} = require("../../email_template/user/ApplicationSuccessTempl");

let transport = nodemailer.createTransport({
  service: "gmail", // Use 'service' instead of 'host' and 'port'
  auth: {
    user: process.env.SMTP_USER, // from env
    pass: process.env.SMTP_PASSWORD, // from env
  },
});

const greetUserCont = async (name, email) => {
  try {
    let info = await transport.sendMail({
      from: "SkillsOrbit skillorbit01@gmail.com",
      to: `${email}`,
      subject: "Welcome to SkillsOrbit 🎉",
      text: `Hi ${name},\n\nWelcome to SkillsOrbit`,
      html: greetUser.replace("{{ .Candidate_Name}}", name),
    });

    return { success: true, message: "Email sent successfully" };
  } catch (err) {
    return { success: false, message: "Email not send" };
  }
};

const sendResultEmail = async (name, email, skillName) => {
  if (!name || !email) {
    return { success: false, message: "Missing params" };
  }

  try {
    await transport.sendMail({
      from: "SkillsOrbit <skillorbit01@gmail.com>",
      to: email,
      subject: "Your Test Result is Ready 🎉",
      html: testResultReadyTemplate(name, skillName),
    });

    return { success: true, message: "Result email sent successfully" };
  } catch (err) {
    return { success: false, message: "Email not sent", error: err.message };
  }
};

// Service function to send application success email (callable from other controllers)
const sendApplicationSuccess = async (email, name, opportunityTitle, type) => {
  try {
    await transport.sendMail({
      from: "SkillsOrbit <skillorbit01@gmail.com>",
      to: email,
      subject: `Your Application for ${opportunityTitle} has been Submitted! 🎉`,
      html: applicationSuccessTemplate(name, opportunityTitle, type),
    });

    return { success: true, message: "Email sent successfully" };
  } catch (err) {
    console.error("Failed to send application success email:", err);
    return { success: false, message: "Email not sent", error: err.message };
  }
};

module.exports = { greetUserCont, sendResultEmail, sendApplicationSuccess };
