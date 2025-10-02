const nodemailer = require("nodemailer");
const { greetRecruiter } = require("../../email_template/recruiter/welcome");

let transport = nodemailer.createTransport({
  service: "gmail", // Use 'service' instead of 'host' and 'port'
  auth: {
    user: "skillorbit01@gmail.com",
    pass: "kyst ovep ombh toph",
  },
});

const greetRecCont = async (req, res) => {
  const { email, name } = req.body;

  try {
    let info = await transport.sendMail({
      from: "SkillOrbit skillorbit01@gmail.com",
      to: `${email}`,
      subject: "Welcome to SkillOrbit 🎉",
      text: `Hi ${name},\n\nWelcome to SkillOrbit`,
      html: greetRecruiter.replace("{{ .Candidate_Name}}", name),
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    res.json({ success: false, message: "Email not send" });
  }
};

module.exports = { greetRecCont };
