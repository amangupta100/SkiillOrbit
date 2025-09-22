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
    secure: true, // true in production (HTTPS)
    sameSite: "none",
    maxAge: 15 * 60 * 1000, // 15 minutes,
  });
};

const genRefreshToken = (user, res) => {
  const refreshToken = jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      desiredRole: user.desiredRole,
      domain: user.desiredDomain,
    },
    process.env.REFRESH_SECRET_KEY,
    { expiresIn: "7d" } // longer lifespan
  );
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days,
  });
};

module.exports = { genAccessToken, genRefreshToken };
