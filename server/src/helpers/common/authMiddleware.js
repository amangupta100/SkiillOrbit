const jwt = require("jsonwebtoken");
const User = require("../../models/UserModel");
const Recruiter = require("../../models/RecruiterModel");

const authMiddleware = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ success: false, message: "No access token" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY);

    const authUser = await attachUser(decoded.id, req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: "Invalid user" });
    }

    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError" || err.message === "jwt expired") {
      return res
        .status(401)
        .json({ success: false, message: "Access token expired" });
    }

    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// helper function to attach user/recruiter/admin
async function attachUser(userId, req) {
  const [user, recruiter] = await Promise.all([
    User.findById(userId)
      .select("_id name role image desiredRole desiredDomain email")
      .lean(),
    Recruiter.findById(userId)
      .select("_id name role image companyId email")
      .lean(),
  ]);

  const authUser = user || recruiter;
  if (!authUser) return null;

  // ⚠️ ADMIN VALIDATION (EMAIL MUST MATCH ENV)
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const isAdmin = authUser.email === ADMIN_EMAIL;

  if (authUser.role === "admin" && isAdmin) {
    req.admin = {
      id: authUser._id,
      name: authUser.name,
      role: "admin",
      email: authUser.email,
      image: authUser.image,
    };
    return authUser;
  }

  // job-seeker
  if (authUser.role === "job-seeker") {
    req.user = {
      id: authUser._id,
      name: authUser.name,
      role: authUser.role,
      image: authUser.image,
      desiredRole: authUser.desiredRole,
      domain: authUser.desiredDomain,
      email: authUser.email,
    };
    return authUser;
  }

  // recruiter
  if (authUser.role === "recruiter") {
    req.recruiter = {
      id: authUser._id,
      name: authUser.name,
      role: authUser.role,
      image: authUser.image,
      email: authUser.email,
      ...(recruiter && { company: recruiter.companyId }),
    };
    return authUser;
  }

  // ❌ if role is admin but email does not match -- block it
  if (authUser.role === "admin" && !isAdmin) {
    return null;
  }

  return authUser;
}

module.exports = authMiddleware;
