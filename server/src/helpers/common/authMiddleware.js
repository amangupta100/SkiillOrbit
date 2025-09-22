const jwt = require("jsonwebtoken");
const User = require("../../models/UserModel");
const Recruiter = require("../../models/RecruiterModel");

const authMiddleware = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized Access or Session Expired",
    });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY);

    const [user, recruiter] = await Promise.all([
      User.findById(decoded.id)
        .select("_id name role image desiredRole desiredDomain")
        .lean(),
      Recruiter.findById(decoded.id)
        .select("_id name role image company")
        .lean(),
    ]);

    const authUser = user || recruiter;

    if (!authUser) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access" });
    }

    // Attach user or recruiter based on role
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
        ...(recruiter && { company: recruiter.company }),
      };
    }

    return next();
  } catch (accessErr) {
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Session expired" });
    }

    try {
      const decodedRefresh = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET_KEY
      );

      const [user, recruiter] = await Promise.all([
        User.findById(decodedRefresh.id)
          .select("_id name role image desiredRole desiredDomain")
          .lean(),
        Recruiter.findById(decodedRefresh.id)
          .select("_id name role image company")
          .lean(),
      ]);

      const authUser = user || recruiter;

      if (!authUser) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid account" });
      }

      const tokenPayload =
        authUser.role === "job-seeker"
          ? {
              id: authUser._id,
              role: authUser.role,
              name: authUser.name,
              desiredRole: authUser.desiredRole,
              domain: authUser.desiredDomain,
            }
          : {
              id: authUser._id,
              role: authUser.role,
              name: authUser.name,
            };

      const newAccessToken = jwt.sign(
        tokenPayload,
        process.env.ACCESS_SECRET_KEY,
        { expiresIn: "15m" }
      );

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 15 * 60 * 1000,
      });

      // Attach user or recruiter based on role
      if (authUser.role === "job-seeker") {
        req.user = {
          id: authUser._id,
          name: authUser.name,
          role: authUser.role,
          image: authUser.image,
          desiredRole: authUser.desiredRole,
          desiredDomain: authUser.desiredDomain,
        };
      } else {
        req.recruiter = {
          id: authUser._id,
          name: authUser.name,
          role: authUser.role,
          image: authUser.image,
          ...(recruiter && { company: recruiter.company }),
        };
      }

      return next();
    } catch (refreshErr) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(403).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }
  }
};

module.exports = authMiddleware;
