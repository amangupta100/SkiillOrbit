const userModel = require("../../models/UserModel");
const bcrypt = require("bcryptjs");
const {
  genAccessToken,
  genRefreshToken,
} = require("../../helpers/genAuthToken");
const UserModel = require("../../models/UserModel");
const { sendPasswordChangedMail } = require("../common/SendOtpContr");
const RecruiterModel = require("../../models/RecruiterModel");
const crypto = require("crypto");

// Helper function
function formatDate(date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const register = async (req, res) => {
  let { fullname: name, email, password } = req.body;

  try {
    // Check user already exists (FAST)
    let existingUser = await userModel.findOne({ email }).lean();
    if (existingUser) {
      return res.json({ success: false, message: "User Already Exist" });
    }

    // Hash password
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(password, salt, async function (err, hash) {
        // Create user
        const newUser = await userModel.create({
          name,
          email,
          password: hash,
          // lastActive updated on register itself
          lastActive: new Date(),
          lastActiveDisplay: formatDate(new Date()),
        });

        // Create session token
        const sessionToken = newUser.generateSessionToken();

        // Update fast fields (NO .save() → fastest)
        await userModel.updateOne(
          { _id: newUser._id },
          {
            $set: {
              sessionToken,
              lastLogin: new Date(),
              lastActive: new Date(),
              lastActiveDisplay: formatDate(new Date()),
              lastLogout: null,
            },
          }
        );

        // Cookie for profile setup
        res.cookie("profileSetupPending", "true", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
          maxAge: 15 * 60 * 1000, // 15 mins
          ...(process.env.NODE_ENV === "production"
            ? { domain: ".skillsorbit.in" }
            : {}),
        });

        // Access Token — valid for 15 minutes
        genAccessToken(newUser, res);
        // Refresh Token — valid for 7 days
        genRefreshToken(newUser, res);

        return res.json({
          success: true,
          message: "Registered successfully",
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
        });
      });
    });
  } catch (err) {
    return res.json({ success: false, message: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Fetch only required fields
    const user = await userModel
      .findOne({ email })
      .select("password sessionToken name email role loginHistory");

    if (!user) {
      return res.json({
        success: false,
        message: "Email or Password is wrong, Please try again!",
      });
    }

    // 2️⃣ Check password
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.json({
        success: false,
        message: "Email or Password is wrong, Please try again!",
      });
    }

    // 3️⃣ Already logged in?
    if (user.sessionToken) {
      return res.json({
        success: false,
        message: "Already logged in on another device",
      });
    }

    // 4️⃣ Generate new token
    const sessionToken = crypto.randomBytes(32).toString("hex");

    // 5️⃣ FAST atomic update (no .save(), no validation lag)
    const now = new Date();
    await userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          sessionToken,
          lastLogin: now,
          lastActive: now,
          lastActiveDisplay: now.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          onlineStatus: "online",
        },
        $push: {
          loginHistory: {
            timestamp: now,
          },
        },
      }
    );

    // Remove old history > 10 entries
    await userModel.updateOne(
      { _id: user._id },
      { $push: { loginHistory: { $each: [], $slice: -10 } } }
    );

    // 6️⃣ Set cookies
    genAccessToken(user, res);
    genRefreshToken(user, res);

    return res.json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const authId = req.admin?.id || req.user?.id;

    const now = new Date();

    // 🔥 1 atomic update — no .save(), no validation, no document load
    await userModel.updateOne(
      { _id: authId },
      {
        $set: {
          sessionToken: null,
          lastLogout: now,
          onlineStatus: "offline",
          lastActive: now,
          lastActiveDisplay: now.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        },
      }
    );

    // 🔥 Clear cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    };

    if (process.env.NODE_ENV === "production") {
      cookieOptions.domain = ".skillsorbit.in";
    }

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const profileSetupEnd = async (req, res) => {
  try {
    const { id } = req.user;
    const checkUser = await UserModel.findById(id);
    // Generate new session token
    const sessionToken = checkUser.generateSessionToken();
    checkUser.sessionToken = sessionToken;

    await checkUser.updateLastLogin();
    await checkUser.save();
    res.clearCookie("profileSetupPending", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
      ...(process.env.NODE_ENV === "production"
        ? { domain: ".skillsorbit.in" }
        : {}), // localhost me domain set mat karo
    });

    res.json({
      success: true,
      message: "Profile setup completed",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to complete profile setup",
    });
  }
};

const clearAccRefCook = async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
    ...(process.env.NODE_ENV === "production"
      ? { domain: ".skillsorbit.in" }
      : {}), // localhost me domain set mat karo
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 15 minutes
    ...(process.env.NODE_ENV === "production"
      ? { domain: ".skillsorbit.in" }
      : {}), // localhost me domain set mat karo
  });

  res.json({
    success: true,
    message: "Cookies Cleared",
  });
};

const uploadDomainData = async (req, res) => {
  try {
    const { userId, domain, role, skills } = req.body;

    // Check if userId is provided
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    // Find the user by ID
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Update the user fields
    user.desiredDomain = domain;
    user.desiredRole = role;

    // Only update skills if they're provided and it's an array
    if (skills && Array.isArray(skills)) {
      user.skills = skills;
    }

    // Save the updated user
    const updatedUser = await user.save();

    // Return the updated user (excluding sensitive data)
    const userResponse = updatedUser.toObject();
    delete userResponse.password;
    delete userResponse.__v;

    res.status(200).json({
      message: "Profile updated successfully",
      user: userResponse,
      success: true,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      message: "Server error while updating profile",
      error: error.message,
      success: false,
    });
  }
};

const checkEmailExist = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || email.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    let exists = null;

    // 🔍 SWITCH BASED ON ROLE
    if (role === "job-seeker") {
      exists = await UserModel.findOne({ email: email.trim() });
    } else {
      exists = await RecruiterModel.findOne({ email: email.trim() });
    }

    if (exists) {
      return res.status(200).json({
        success: true,
        exists: true,
        message: "Email exists in database",
      });
    }

    return res.status(200).json({
      success: false,
      exists: false,
      message: "Email not found",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    // Find user
    const user = await userModel.findOne({ email: email.trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(newPassword, salt);

    user.password = hashedPass;

    // Clear any logged in sessions
    user.sessionToken = null;

    await user.save();

    // ✉ Send success mail
    sendPasswordChangedMail(user.email, user.name);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error resetting password",
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  profileSetupEnd,
  clearAccRefCook,
  uploadDomainData,
  checkEmailExist,
  resetPassword,
};
