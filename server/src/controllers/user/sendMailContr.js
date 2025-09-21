const nodemailer = require("nodemailer");
const { greetUser } = require("../../email_template/user/welcomeUser");
const { resultTemplate } = require("../../email_template/user/resulttemplate");

let transport = nodemailer.createTransport({
  service: "gmail", // Use 'service' instead of 'host' and 'port'
  auth: {
    user: "skillorbit01@gmail.com",
    pass: "kyst ovep ombh toph",
  },
});

const greetUserCont = async (req, res) => {
  const { email, name } = req.body;

  try {
    let info = await transport.sendMail({
      from: "SkillOrbit skillorbit01@gmail.com",
      to: `${email}`,
      subject: "Welcome to SkillOrbit 🎉",
      text: `Hi ${name},\n\nWelcome to SkillOrbit`,
      html: greetUser.replace("{{ .Candidate_Name}}", name),
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    res.json({ success: false, message: "Email not send" });
  }
};

const sendResultEmail = async (req, res) => {
  const { name, email, status } = req.query;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: "Missing params" });
  }

  try {
    await transport.sendMail({
      from: "SkillOrbit <skillorbit01@gmail.com>",
      to: email,
      subject: "Your Test Result is Ready 🎉",
      html: resultTemplate(name, score || "N/A", status || "Completed"),
    });

    res.json({ success: true, message: "Result email sent successfully" });
  } catch (err) {
    res.json({ success: false, message: "Email not sent", error: err.message });
  }
};

module.exports = { greetUserCont, sendResultEmail };
