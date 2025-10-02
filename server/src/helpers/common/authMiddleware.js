const jwt = require("jsonwebtoken");
const User = require("../../models/UserModel");
const Recruiter = require("../../models/RecruiterModel");

const authMiddleware = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ success: false, message: "No access token" });
  }

  try {
    // verify access token
    const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY);
    await attachUser(decoded.id, req);
    return next();
  } catch (err) {
    console.log("Auth Middleware Error:", err.message);

    if (err.name === "TokenExpiredError" || err.message === "jwt expired") {
      // 👇 important: don't refresh here, just tell client to refresh
      return res
        .status(401)
        .json({ success: false, message: "Access token expired" });
    }

    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// helper function to attach user/recruiter
async function attachUser(userId, req) {
  const [user, recruiter] = await Promise.all([
    User.findById(userId)
      .select("_id name role image desiredRole desiredDomain")
      .lean(),
    Recruiter.findById(userId).select("_id name role image company").lean(),
  ]);

  const authUser = user || recruiter;
  if (!authUser) return null;

  if (authUser.role === "job-seeker") {
    req.user = {
      id: authUser._id,
      name: authUser.name,
      role: authUser.role,
      image: authUser.image,
      desiredRole: authUser.desiredRole,
      domain: authUser.desiredDomain,
    };
  } else {
    req.recruiter = {
      id: authUser._id,
      name: authUser.name,
      role: authUser.role,
      image: authUser.image,
      ...(recruiter && { company: recruiter.companyId }),
    };
  }

  return authUser;
}

module.exports = authMiddleware;
