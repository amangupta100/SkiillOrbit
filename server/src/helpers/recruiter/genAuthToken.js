const jwt = require("jsonwebtoken");

const genAccessToken = (data, res) => {
  const accessToken = jwt.sign(
    { id: data._id, role: data.role, name: data.name },
    process.env.ACCESS_SECRET_KEY,
    { expiresIn: "15m" }
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
    ...(process.env.NODE_ENV === "production"
      ? { domain: ".skillsorbit.in" }
      : {}), // localhost me domain set mat karo
  });
};

const genRefreshToken = (data, res) => {
  // Token expiry in seconds
  const refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 days in seconds

  const refreshToken = jwt.sign(
    { id: data._id, role: data.role },
    process.env.REFRESH_SECRET_KEY,
    { expiresIn: refreshTokenExpiry } // JWT expiry
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: refreshTokenExpiry * 1000, // ✅ cookie expiry matches token
    ...(process.env.NODE_ENV === "production"
      ? { domain: ".skillsorbit.in" }
      : {}), // localhost → don’t set domain
  });
};

module.exports = { genAccessToken, genRefreshToken };
