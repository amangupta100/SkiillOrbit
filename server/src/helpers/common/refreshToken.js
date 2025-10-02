const jwt = require("jsonwebtoken");
const User = require("../../models/UserModel");
const Recruiter = require("../../models/RecruiterModel");

// helper
async function attachUser(userId) {
  const [user, recruiter] = await Promise.all([
    User.findById(userId)
      .select("_id name role image desiredRole desiredDomain")
      .lean(),
    Recruiter.findById(userId).select("_id name role image company").lean(),
  ]);

  return user || recruiter;
}

// Refresh access token
const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ success: false, message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
    const authUser = await attachUser(decoded.id);

    if (!authUser) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid account" });
    }

    const tokenPayload = {
      id: authUser._id,
      role: authUser.role,
      name: authUser.name,

      ...(authUser.role === "job-seeker"
        ? {
            desiredRole: authUser.desiredRole,
            domain: authUser.desiredDomain,
          }
        : {
            company: authUser.company, // recruiter.company is already selected in attachUser
          }),
    };

    const newAccessToken = jwt.sign(
      tokenPayload,
      process.env.ACCESS_SECRET_KEY,
      {
        expiresIn: "15m",
      }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
      ...(process.env.NODE_ENV === "production"
        ? { domain: ".skillsorbit.in" }
        : {}), // localhost me domain set mat karo
    });

    return res.status(200).json({
      success: true,
      message: "Access token refreshed",
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res
      .status(403)
      .json({ success: false, message: "Invalid/expired refresh token" });
  }
};

module.exports = {
  refreshToken,
};
