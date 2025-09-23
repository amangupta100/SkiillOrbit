const userModel = require("../../models/UserModel");
const bcrypt = require("bcryptjs");
const {
  genAccessToken,
  genRefreshToken,
} = require("../../helpers/genAuthToken");
const UserModel = require("../../models/UserModel");

const register = async (req, res) => {
  let { fullname: name, email, password } = req.body;

  try {
    let user = await userModel.findOne({ email });
    if (user) {
      return res.json({ message: "User Already Exist", success: false });
    } else {
      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(password, salt, async function (err, hash) {
          user = await userModel.create({
            name: name,
            email: email,
            password: hash,
          });

          // Generate new session token
          const sessionToken = user.generateSessionToken();
          user.sessionToken = sessionToken;

          await user.updateLastLogin();
          await user.save();

          res.cookie("profileSetupPending", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: 15 * 60 * 1000, // 15 minutes
            ...(process.env.NODE_ENV === "production"
              ? { domain: ".skillsorbit.in" }
              : {}), // localhost me domain set mat karo
          });

          // Access Token — valid for 15 minutes
          genAccessToken(user, res);
          // // Refresh Token — valid for 7 days
          genRefreshToken(user, res);
          res.json({
            success: true,
            message: "Register successfully",
            user: {
              profileImg: user.image,
              role: user.role,
              id: user._id,
              name: user.name,
              email: user.email,
            },
          });
        });
      });
    }
  } catch (err) {
    res.json({ message: "Internal Server Error", success: false });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const checkUser = await userModel.findOne({ email });
    if (!checkUser) {
      return res.json({
        success: false,
        message: "Email or Password is wrong, Please try again!",
      });
    }

    const checkPasswordMatch = await bcrypt.compare(
      password,
      checkUser.password
    );

    if (!checkPasswordMatch) {
      return res.json({
        success: false,
        message: "Email or Password is wrong, Please try again!",
      });
    }

    // Already logged in elsewhere check
    if (checkUser.sessionToken) {
      return res.json({
        success: false,
        message: "Already logged in on another device",
      });
    }

    // Generate new session token
    const sessionToken = checkUser.generateSessionToken();
    checkUser.sessionToken = sessionToken;

    await checkUser.updateLastLogin();
    await checkUser.save();

    // Set both tokens as cookies
    genAccessToken(checkUser, res);
    genRefreshToken(checkUser, res);

    res.json({
      success: true,
      message: "Logged in successfully",
      user: {
        email: checkUser.email,
        role: checkUser.role,
        id: checkUser._id,
        name: checkUser.name,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message, success: false });
  }
};

const logout = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (user) {
      user.sessionToken = null;
      user.lastLogout = new Date();
      await user.markOffline(); // optional: set status offline
      await user.save();
    }

    // Clear cookies
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
      maxAge: 15 * 60 * 1000, // 15 minutes
      ...(process.env.NODE_ENV === "production"
        ? { domain: ".skillsorbit.in" }
        : {}), // localhost me domain set mat karo
    });

    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
    maxAge: 15 * 60 * 1000, // 15 minutes
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
    const user = await UserModel.findById(userId);
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

module.exports = {
  register,
  login,
  logout,
  profileSetupEnd,
  clearAccRefCook,
  uploadDomainData,
};
