const jwt = require("jsonwebtoken");

const genAccessToken = (data, res) => {
  const accessToken = jwt.sign(
    { id: data._id, role: data.role, name: data.name },
    process.env.ACCESS_SECRET_KEY,
    { expiresIn: "15m" }
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV == "production", // true in production (HTTPS)
    sameSite: "none",
    maxAge: 15 * 60 * 1000, // 15 minutes
    domain:
      process.env.NODE_ENV == "production"
        ? "skiillorbit.onrender.com"
        : "localhost",
  });
};

const genRefreshToken = (data, res) => {
  const refreshToken = jwt.sign(
    { id: data._id, role: data.role },
    process.env.REFRESH_SECRET_KEY,
    { expiresIn: "7d" }
  );
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV == "production",
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain:
      process.env.NODE_ENV == "production"
        ? "skiillorbit.onrender.com"
        : "localhost",
  });
};

module.exports = { genAccessToken, genRefreshToken };
