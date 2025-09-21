const { connection } = require("mongoose");
const UserModel = require("../../models/UserModel");

const getUserDet = async (req, res) => {
  try {
    const { id } = req.user;
    if (!id) {
      return res.json({
        success: false,
        message: "Unauthorized to perform the action",
      });
    }

    // Exclude confidential fields using projection (-fieldName)
    const user = await UserModel.findById(id).select(
      "-password -loginHistory -sessionToken -appliedJobs -lastLogin -lastLogout -lastActive -lastActiveDisplay -onlineStatus"
    );

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const uploadResume = async (req, res) => {
  const { id } = req.user;
  const resumeData =
    typeof req.body.ResumeData === "string"
      ? JSON.parse(req.body.ResumeData)
      : req.body.ResumeData;
  const { Filename } = req.body;

  if (!id) {
    return res.json({
      success: false,
      message: "Unauthorized to perform the action",
    });
  }

  try {
    const user = await UserModel.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // Candidate Info
    if (resumeData.candidate) {
      user.desiredRole = resumeData.candidate.role || user.desiredRole;
      user.summary = resumeData.candidate.summary || user.summary;
      user.desiredDomain = resumeData.candidate.domain || user.desiredDomain;
    }

    // Skills
    if (resumeData.skills) {
      user.skills = resumeData.skills;
    }

    // Education
    if (resumeData.education) {
      user.education = resumeData.education.map((edu) => ({
        degree: edu.degree,
        institution: edu.institution,
        year: edu.year,
      }));
    }

    // Projects - push directly to userSchema
    if (resumeData.projects) {
      user.projects = resumeData.projects.map((project) => ({
        title: project.name,
        description: project.description,
        technologies: project.technologies,
      }));
    }

    // Achievements
    if (resumeData.achievements) {
      user.achievements = resumeData.achievements.map((ach) => ({
        description: ach,
      }));
    }

    // Experience
    if (resumeData.experience) {
      user.experience = resumeData.experience.map((exp) => ({
        company: exp.company,
        position: exp.position,
        duration: exp.duration,
        achievements:
          exp.achievements?.map((ach) => ({ description: ach })) || [],
      }));
    }

    // Resume file
    user.resume = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      filename: Filename,
      lastModified: new Date(),
    };

    await user.save();

    res.clearCookie("profileSetupPending", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
    });

    res.json({ success: true, message: "Resume uploaded successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    const { id } = req.user;
    const { image } = req.body;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized to perform the action",
      });
    }

    // Validate the Base64 image
    if (!image || !image.startsWith("data:image/")) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid image data" });
    }

    // Extract Base64
    const matches = image.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid image format" });
    }

    const fileType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");

    // Validate file size (max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return res
        .status(400)
        .json({ success: false, message: "Image size exceeds 5MB limit" });
    }

    // Save to DB
    const user = await UserModel.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.image = {
      data: image, // store Base64 directly
      contentType: `image/${fileType}`,
      lastModified: new Date(),
    };

    await user.save();

    res.json({
      success: true,
      message: "Profile image uploaded successfully",
      userDet: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: `Server error ${err.message}` });
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
    const user = await UserModel.findById(id).populate("projects");

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
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user.id,
      { $push: { projects: newProject } },
      { new: true }
    );

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

module.exports = { uploadProject };

module.exports = {
  getUserDet,
  uploadResume,
  uploadProfileImage,
  getallProjects,
  getSkills,
  uploadProject,
};
