const RecruiterModel = require("../../models/RecruiterModel");
const CompanyModel = require("../../models/CompanyModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  genAccessToken,
  genRefreshToken,
} = require("../../helpers/recruiter/genAuthToken");
const multer = require("multer");
const { greetRecCont } = require("./sendMailContr");
const cloudinary = require("cloudinary").v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Extract publicId
function extractPublicId(url) {
  try {
    const afterUpload = url.split("/upload/")[1];
    const withoutVersion = afterUpload.substring(afterUpload.indexOf("/") + 1);
    return withoutVersion.replace(/\.[^/.]+$/, "");
  } catch (e) {
    return null;
  }
}

const setProfilePendingCookie = async (req, res) => {
  res.cookie("profileSetupPending", "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
    ...(process.env.NODE_ENV === "production"
      ? { domain: ".skillsorbit.in" }
      : {}), // localhost me domain set mat karo
  });
  res.json({ success: "true", message: "Cookie setup successful" });
};

const recruiterLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const checkRecruiter = await RecruiterModel.findOne({ email }).populate(
      "companyId"
    );
    if (!checkRecruiter) {
      return res.json({
        success: false,
        message: "Email or Password is wrong, Please try again!",
      });
    }

    const checkPasswordMatch = await bcrypt.compare(
      password,
      checkRecruiter.password
    );
    if (!checkPasswordMatch) {
      return res.json({
        success: false,
        message: "Email or Password is wrong, Please try again!",
      });
    }

    // Already logged in elsewhere check
    if (checkRecruiter.sessionToken) {
      return res.json({
        success: false,
        message: "Already logged in on another device",
      });
    }

    // Generate new session token
    const sessionToken = checkRecruiter.generateSessionToken();
    checkRecruiter.sessionToken = sessionToken;

    await checkRecruiter.updateLastLogin();
    await checkRecruiter.save();

    // Generate tokens
    genAccessToken(checkRecruiter, res);
    genRefreshToken(checkRecruiter, res);

    // Structure the response data to match the frontend store expectations
    const responseData = {
      success: true,
      message: "Recruiter Login Successful",
      data: {
        recruiter: {
          id: checkRecruiter._id,
          name: checkRecruiter.name,
          email: checkRecruiter.email,
          // Include any other recruiter fields you need
        },
        company: checkRecruiter.companyId
          ? {
              id: checkRecruiter.companyId._id,
              name: checkRecruiter.companyId.name,
              // Include any other company fields you need
            }
          : null,
      },
    };

    res.json(responseData);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const user = await RecruiterModel.findById(req.recruiter.id);
    if (user) {
      user.sessionToken = null;
      user.lastLogout = new Date();
      await user.markOffline(); // optional: set status offline
      await user.save();
    }

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
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      ...(process.env.NODE_ENV === "production"
        ? { domain: ".skillsorbit.in" }
        : {}), // localhost me domain set mat karo
    });
    res.json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      designation,
      phone,
      linkedin,
      companyWebsite,
      company,
      companyTagline,
      companySize,
      headquarterLocation,
      industryType,
      aboutCompany,
      foundyear,
      companyType,
      twitter,
    } = req.body;

    // Check existing email
    const existing = await RecruiterModel.findOne({ email });
    if (existing) {
      return res.json({
        success: false,
        message: "Email already exists",
      });
    }

    // ---------------------------------------
    // UPLOAD COMPANY LOGO
    // ---------------------------------------
    let imagePath = null;

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "skillsorbit/company-logos",
              public_id: `logo-${company}-${Date.now()}`,
            },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          )
          .end(req.file.buffer);
      });

      imagePath = uploadResult.secure_url;
    }

    // ---------------------------------------
    // CREATE COMPANY
    // ---------------------------------------
    const newCompany = new CompanyModel({
      name: company,
      tagline: companyTagline,
      websiteURL: companyWebsite,
      numberOfEmployees: companySize,
      headquarters: headquarterLocation,
      industryType,
      about: aboutCompany,
      foundedYear: foundyear,
      companyType,
      linkedinUrl: linkedin,
      twitterUrl: twitter,
      imagePath, // CLOUDINARY URL
      location: headquarterLocation,
    });

    const savedCompany = await newCompany.save();

    // ---------------------------------------
    // HASH PASSWORD
    // ---------------------------------------
    const hash = await bcrypt.hash(password, 10);

    // ---------------------------------------
    // CREATE RECRUITER
    // ---------------------------------------
    const newRecruiter = new RecruiterModel({
      name,
      email,
      password: hash,
      designation,
      phoneNumber: phone,
      linkedInProfile: linkedin,
      companyId: savedCompany._id,
      role: "recruiter",
    });

    const sessionToken = newRecruiter.generateSessionToken();
    newRecruiter.sessionToken = sessionToken;

    await newRecruiter.updateLastLogin();
    await newRecruiter.save();

    // Send tokens
    genAccessToken(newRecruiter, res);
    genRefreshToken(newRecruiter, res);

    await greetRecCont(newRecruiter.name, newRecruiter.email);

    res.clearCookie("profileSetupPending", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
      ...(process.env.NODE_ENV === "production"
        ? { domain: ".skillsorbit.in" }
        : {}), // localhost me domain set mat karo
    });

    return res.json({
      success: true,
      message: "Recruiter Profile Setup Successfully",
      data: {
        recruiter: {
          _id: newRecruiter._id,
          name: newRecruiter.name,
          designation: newRecruiter.designation,
          companyId: newRecruiter.companyId,
        },
        company: {
          _id: savedCompany._id,
          name: savedCompany.name,
          imagePath: savedCompany.imagePath,
        },
      },
    });
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

module.exports = {
  setProfilePendingCookie,
  recruiterLogin,
  logout,
  register,
};
