const RecruiterModel = require("../../models/RecruiterModel");
const CompanyModel = require("../../models/CompanyModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  genAccessToken,
  genRefreshToken,
} = require("../../helpers/recruiter/genAuthToken");

const setProfilePendingCookie = async (req, res) => {
  res.cookie("profileSetupPending", "true", {
    httpOnly: true, // can be read by frontend/middleware
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 60 * 60 * 1000, // 1 hour
    domain: ".skillsorbit.in", // allows cookie for both api.skillsorbit.in and skillsorbit.in
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
      domain: ".skillsorbit.in", // allows cookie for both api.skillsorbit.in and skillsorbit.in
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      domain: ".skillsorbit.in", // allows cookie for both api.skillsorbit.in and skillsorbit.in
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
      companyTagLine,
      companySize,
      headquarterLocation,
      industryType,
      aboutCompany,
      foundedyear,
      companyType,
      twitter,
      image,
    } = req.body;

    const rec = await RecruiterModel.findOne({ email });
    if (rec) {
      return res.json({
        success: false,
        message: "Email already exists Try Again!",
      });
    }

    // Create company
    const newCompany = new CompanyModel({
      name: company,
      tagline: companyTagLine,
      websiteURL: companyWebsite || "",
      numberOfEmployees: companySize,
      headquarters: headquarterLocation,
      industryType,
      about: aboutCompany,
      foundedYear: foundedyear,
      companyType,
      linkedinUrl: linkedin,
      twitterUrl: twitter,
      location: headquarterLocation,
      logo: {
        data: image, // base64 string from frontend
        contentType: "image/png", // ya frontend se bhejna
        lastModified: new Date(),
      },
    });

    const savedCompany = await newCompany.save();

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        const newRecruiter = new RecruiterModel({
          name,
          email,
          password: hash, // Note: In production, hash this password before saving
          designation,
          phoneNumber: phone,
          linkedInProfile: linkedin,
          companyId: savedCompany._id,
          role: "recruiter",
        });

        const savedRecruiter = await newRecruiter.save();

        const response = {
          recruiter: {
            _id: savedRecruiter._id,
            name: savedRecruiter.name,
            role: savedRecruiter.role,
            designation: savedRecruiter.designation,
            companyId: savedRecruiter.companyId,
          },
          company: {
            _id: savedCompany._id,
            name: savedCompany.name,
            logo: savedCompany.logo,
          },
        };

        genAccessToken(newRecruiter, res);
        genRefreshToken(newRecruiter, res);

        res.clearCookie("profileSetupPending", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
          domain: ".skillsorbit.in", // allows cookie for both api.skillsorbit.in and skillsorbit.in
        });

        // Generate new session token
        const sessionToken = newRecruiter.generateSessionToken();
        newRecruiter.sessionToken = sessionToken;

        await newRecruiter.updateLastLogin();
        await newRecruiter.save();
        return res.json({
          success: true,
          message: "Recruiter Profile Setup successfully",
          data: response, // 👈 fixed
        });
      });
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
