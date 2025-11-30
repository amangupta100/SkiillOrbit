const jwt = require("jsonwebtoken");
const User = require("../../models/UserModel");
const Recruiter = require("../../models/RecruiterModel");
const Notification = require("../../models/NotificationModel");

// ======================================================================
// 🔐 AUTH MIDDLEWARE
// ======================================================================
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
    console.error("AUTH ERROR:", err);

    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Access token expired" });
    }

    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// ======================================================================
// 🔵 Helper: Attach User + Image Path + Notifications (id always mapped)
// ======================================================================
async function attachUser(userId, req) {
  const [user, recruiter] = await Promise.all([
    User.findById(userId)
      .select("_id name role desiredRole desiredDomain email profilePath")
      .lean(),
    Recruiter.findById(userId)
      .select("_id name role companyId email profilePath")
      .lean(),
  ]);

  const authUser = user || recruiter;
  if (!authUser) return null;

  // Convert _id → id (IMPORTANT)
  const formattedUser = {
    id: authUser._id.toString(),
    name: authUser.name,
    role: authUser.role,
    email: authUser.email,
    desiredRole: authUser.desiredRole,
    desiredDomain: authUser.desiredDomain,
  };

  // ======================================================================
  // 🖼 PROFILE IMAGE PATH (from User/Recruiter model - Cloudinary URL)
  // ======================================================================
  formattedUser.image = authUser.profilePath || null;

  // ======================================================================
  // 🔔 UNREAD NOTIFICATIONS
  // ======================================================================
  const unreadNotifications = await Notification.find({
    receiverId: authUser._id,
    receiverRole: authUser.role,
    read: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  formattedUser.notifications = unreadNotifications;

  // ======================================================================
  // 🔴 ADMIN VALIDATION
  // ======================================================================
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const isAdmin = formattedUser.email === ADMIN_EMAIL;

  if (formattedUser.role === "admin" && isAdmin) {
    req.admin = { ...formattedUser };
    return formattedUser;
  }

  // ======================================================================
  // 🟢 JOB SEEKER / USER
  // ======================================================================
  if (formattedUser.role === "job-seeker") {
    req.user = { ...formattedUser };
    return formattedUser;
  }

  // ======================================================================
  // 🔵 RECRUITER
  // ======================================================================
  if (formattedUser.role === "recruiter") {
    req.recruiter = {
      ...formattedUser,
      company: recruiter.companyId, // attach companyId
    };
    return formattedUser;
  }

  return formattedUser;
}

module.exports = authMiddleware;
