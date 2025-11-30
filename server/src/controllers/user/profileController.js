const { connection } = require("mongoose");
const UserModel = require("../../models/UserModel");
const UserProject = require("../../models/Project");
const UserExperience = require("../../models/Experience");
const UserEducation = require("../../models/Education");
const UserAchievement = require("../../models/Achievement");
const UserCertification = require("../../models/UserCertification");
const { greetUserCont } = require("./sendMailContr");
const cloudinary = require("cloudinary").v2;

const getUserDet = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized to perform the action",
      });
    }

    // 1️⃣ Fetch user
    const user = await UserModel.findById(id)
      .select(
        "-password -sessionToken -lastLogin -lastLogout -lastActive -lastActiveDisplay -onlineStatus"
      )
      .lean();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 2️⃣ Fetch nested collections
    const [projects, experience, education, achievements, certifications] =
      await Promise.all([
        UserProject.find({ userId: id }).lean(),
        UserExperience.find({ userId: id }).lean(),
        UserEducation.find({ userId: id }).lean(),
        UserAchievement.find({ userId: id }).lean(),
        UserCertification.find({ userId: id }).lean(),
      ]);

    // 3️⃣ Final clean response
    const responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      desiredRole: user.desiredRole || null,
      desiredDomain: user.desiredDomain || null,
      skills: user.skills || [],
      verifiedSkills: user.verifiedSkills || [],
      summary: user.summary || "",

      // Saved Opportunities
      savedOpportunities: user.savedOpportunities || [],

      // 🔥 Cloudinary URLs
      profileImage: user.profilePath || null,
      resume: user.resumePath || null,

      // Attachments
      projects,
      experience,
      education,
      achievements,
      certifications,
    };

    return res.json({ success: true, data: responseData });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error: " + err.message,
    });
  }
};

const uploadProfileImage = async (req, res) => {
  const { id } = req.user;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Profile image is required",
    });
  }

  try {
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ===========================
    // DELETE OLD IMAGE FROM CLOUDINARY
    // ===========================
    if (user.imagePath) {
      const publicId = cloudinary.utils.extractPublicId(user.imagePath);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
        });
      }
    }

    // ===========================
    // UPLOAD NEW IMAGE STREAM
    // ===========================
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "skillsorbit/profile_images",
            public_id: `profile-${id}-${Date.now()}`,
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(req.file.buffer);
    });

    user.profilePath = result.secure_url;
    await user.save();

    await greetUserCont(user.name, user.email);

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
      message: "Profile image uploaded successfully",
      profUrl: user.profilePath,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getallProjects = async (req, res) => {
  const { id } = req.user;
  if (!id)
    return res.json({
      success: false,
      message: "Unauthorized to perform the action",
    });

  try {
    const user = await UserModel.findById(id).select("projects");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // user.projects will now be an array of populated project documents
    return res.json({
      success: true,
      projects: user.projects,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
};

const getSkills = async (req, res) => {
  try {
    const { q } = req.query; // search query (optional)

    // Build aggregation pipeline
    const pipeline = [{ $unwind: "$roles" }, { $unwind: "$roles.skills" }];

    // Add query filtering if search term exists
    if (q && q.length > 0) {
      pipeline.push({
        $match: { "roles.skills": { $regex: q, $options: "i" } },
      });
    }

    // Group, project, and limit results
    pipeline.push(
      { $group: { _id: "$roles.skills" } },
      { $project: { _id: 0, skill: "$_id" } },
      { $limit: 7 } // ✅ only return top 10 skills
    );

    const skills = await connection.db
      .collection("JobSkillData")
      .aggregate(pipeline)
      .toArray();

    return res.status(200).json(skills.map((s) => s.skill));
  } catch (error) {
    console.error("Error fetching skills:", error);
    return res.status(500).json({ error: "Failed to fetch skills" });
  }
};

const uploadProject = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized. Please log in.",
        success: false,
      });
    }

    const {
      title,
      description,
      skills,
      isCurrent,
      startDate,
      endDate,
      links,
      media,
    } = req.body;

    // ✅ Basic validation
    if (!title || !description || !startDate) {
      return res.status(400).json({
        message: "Title, description, and startDate are required",
        success: false,
      });
    }

    // ✅ Construct project object
    const newProject = {
      title,
      description,
      skills: skills || [],
      isCurrent: isCurrent || false,
      startDate,
      endDate: isCurrent ? null : endDate,
      links: links || [],
      media: media || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // ✅ Push into user's projects array
    const updatedUser = await UserModel.findByIdAndUpdate(req.user.id, {
      $push: { projects: newProject },
    });

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    res.status(201).json({
      message: "Project added successfully",
      success: true,
      projects: updatedUser.projects,
    });
  } catch (error) {
    console.error("Error adding project:", error);
    res.status(500).json({ message: error.message, success: false });
  }
};

const getEducations = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const educations = await UserEducation.find({ userId }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      data: educations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

const createEducation = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { degree, institution, startYear, endYear, attachmentUrl } = req.body;

    if (!degree || !institution) {
      return res.status(400).json({
        success: false,
        message: "Degree and institution are required",
      });
    }

    const newEducation = await UserEducation.create({
      userId,
      degree,
      institution,
      startYear,
      endYear,
      attachments: attachmentUrl
        ? { type: "link", url: attachmentUrl }
        : undefined,
    });

    return res.json({
      success: true,
      message: "Education added successfully",
      data: newEducation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

const updateEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const educationId = req.params.id;

    if (!educationId) {
      return res.status(400).json({
        success: false,
        message: "Education ID is required",
      });
    }

    const edu = await UserEducation.findOne({ _id: educationId, userId });

    if (!edu) {
      return res.status(404).json({
        success: false,
        message: "Education not found or unauthorized",
      });
    }

    const { institution, degree, startDate, endDate, attachments } = req.body;

    if (institution !== undefined) edu.institution = institution;
    if (degree !== undefined) edu.degree = degree;
    if (startDate !== undefined) edu.startYear = startDate;
    if (endDate !== undefined) edu.endYear = endDate;
    if (attachments !== undefined) edu.attachments = attachments;

    await edu.save();

    res.json({
      success: true,
      message: "Education updated successfully",
      data: edu,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message,
    });
  }
};

const getUserExperiences = async (req, res) => {
  try {
    const userId = req.user.id;

    const experiences = await UserExperience.find({ userId })
      .sort({ from: -1 }) // latest first
      .lean();

    return res.status(200).json({
      success: true,
      data: experiences,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getUserDet,
  uploadProfileImage,
  getallProjects,
  getSkills,
  uploadProject,
  getEducations,
  createEducation,
  updateEducation,
  getUserExperiences,
};
