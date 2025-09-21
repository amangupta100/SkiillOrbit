// socket.js
const User = require("../models/UserModel");
const Recruiter = require("../models/RecruiterModel");

function setupSocket(io) {
  const statusNamespace = io.of("/UserStatus");

  statusNamespace.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;
    const role_type = socket.handshake.query.role_type;

    if (!userId || !role_type) {
      return socket.disconnect();
    }

    try {
      if (role_type === "job-seeker") {
        const user = await User.findById(userId);
        if (user) {
          user.onlineStatus = "online";
          await user.updateActivity();
        }
      } else if (role_type === "recruiter") {
        const recruiter = await Recruiter.findById(userId);
        if (recruiter) {
          recruiter.onlineStatus = "online";
          await recruiter.updateActivity();
        }
      }
    } catch (err) {
      console.error(err);
    }

    socket.on("disconnect", async () => {
      try {
        if (role_type === "job-seeker") {
          const user = await User.findById(userId);
          if (user) await user.markOffline();
        } else if (role_type === "recruiter") {
          const recruiter = await Recruiter.findById(userId);
          if (recruiter) await recruiter.markOffline();
        }
      } catch (err) {
        console.error(err);
      }
    });
  });
}

module.exports = { setupSocket };
