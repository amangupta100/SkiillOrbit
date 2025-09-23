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
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
    ...(process.env.NODE_ENV === "production"
      ? { domain: ".skillsorbit.in" }
      : {}), // localhost me domain set mat karo
  });
  res.json({ success: true, message: "Set successfully" });
};

module.exports = { genResumeDataToken };
