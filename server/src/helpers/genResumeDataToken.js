const jwt = require("jsonwebtoken");

const genResumeDataToken = (req, res) => {
  const { id } = req.user;
  const { resumeDataSended: resumeData } = req.body;

  if (!req.user?.id) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  if (!resumeData) {
    return res.status(400).json({ error: "Resume data is required" });
  }

  // 3. Create token with proper data structure
  const token = jwt.sign(
    {
      id,
      resumeData, // Ensure valid JSON
    },
    process.env.ResumeDataToken,
    { expiresIn: "1h" }
  );

  // 4. Set cookie and send response
  res.cookie("rDV", token, {
    httpOnly: false,
    secure: true,
    sameSite: "none",
    maxAge: 60 * 60 * 1000, // 1 hour
  });
  res.json({ success: true, message: "Set successfully" });
};

module.exports = { genResumeDataToken };
