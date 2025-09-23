const jwt = require("jsonwebtoken");

const genTestToken = (req, res) => {
  const { skills, userId, questionCount } = req.query;

  if (!skills || !userId || !questionCount) {
    throw new Error("Missing required test fields");
  }

  const token = jwt.sign(
    {
      skills,
      userId,
      questionCount,
    },
    process.env.TEST_SECRET_KEY,
    { expiresIn: `4h` }
  );

  res.cookie("td", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 4 * 60 * 60 * 1000, // cookie life matches token
    domain: ".skillsorbit.in", // allows cookie for both api.skillsorbit.in and skillsorbit.in
  });

  res.status(200).json({
    success: true,
    message: "Test token generated successfully",
  });
};

module.exports = { genTestToken };
