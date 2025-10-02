const jwt = require("jsonwebtoken");

const genAccessToken = (user, res) => {
  const accessToken = jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      desiredRole: user.desiredRole,
      domain: user.desiredDomain,
    },
    process.env.ACCESS_SECRET_KEY,
    { expiresIn: "15m" } // shorter lifespan
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

const genRefreshToken = (user, res) => {
  // Token expiry in seconds
  const refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 days in seconds
  const refreshToken = jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      desiredRole: user.desiredRole,
      domain: user.desiredDomain,
    },
    process.env.REFRESH_SECRET_KEY,
    { expiresIn: refreshTokenExpiry } // longer lifespan
  );
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: refreshTokenExpiry * 1000,
    ...(process.env.NODE_ENV === "production"
      ? { domain: ".skillsorbit.in" }
      : {}), // localhost me domain set mat karo
  });
};

module.exports = { genAccessToken, genRefreshToken };
