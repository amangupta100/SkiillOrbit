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
    domain: ".skillsorbit.in", // allows cookie for both api.skillsorbit.in and skillsorbit.in
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
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: ".skillsorbit.in", // allows cookie for both api.skillsorbit.in and skillsorbit.in
  });
};

module.exports = { genAccessToken, genRefreshToken };
