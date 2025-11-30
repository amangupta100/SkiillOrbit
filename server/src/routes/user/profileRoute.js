const {
  getUserDet,
  uploadResume,
  uploadProfileImage,
  getallProjects,
  getSkills,
  uploadProject,
  getEducations,
  createEducation,
  updateEducation,
  getUserExperiences,
} = require("../../controllers/user/profileController");
const authMiddleware = require("../../helpers/common/authMiddleware");
const router = require("express").Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const cloudinary = require("cloudinary").v2;
const UserModel = require("../../models/UserModel");
const UserResume = require("../../models/ResumeModel");
const UserProject = require("../../models/Project");
const UserExperience = require("../../models/Experience");
const UserEducation = require("../../models/Education");
const UserAchievement = require("../../models/Achievement");
const UserCertification = require("../../models/UserCertification");
const UserImage = require("../../models/ImageModel");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const resumeFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF, DOC, DOCX allowed"), false);
};

const uploadResumeMulter = multer({
  storage: multer.memoryStorage(),
  fileFilter: resumeFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPG, JPEG, PNG allowed"), false);
};

const uploadImageMulter = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

function extractPublicIdFromUrl(url) {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;

    const afterUpload = parts[1]; // "v12345/folder/file.pdf"
    const withoutVersion = afterUpload.substring(afterUpload.indexOf("/") + 1);

    // Remove extension
    const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, "");

    return withoutExtension; // e.g. "skillsorbit/resumes/resume-12345"
  } catch (err) {
    return null;
  }
}

router.get("/getUserDet", authMiddleware, getUserDet);
router.post(
  "/uploadResume",
  authMiddleware,
  uploadResumeMulter.single("file"),
  async (req, res) => {
    const { id } = req.user;

    let resumeData =
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

      // ===========================
      // BASIC DETAILS
      // ===========================
      if (resumeData.candidate) {
        user.desiredRole = resumeData.candidate.role || user.desiredRole;
        user.summary = resumeData.candidate.summary || user.summary;
        user.desiredDomain = resumeData.candidate.domain || user.desiredDomain;
      }

      // ===========================
      // SKILLS
      // ===========================
      if (resumeData.skills) {
        user.skills = resumeData.skills;
      }

      // ===========================
      // EDUCATION → Collection
      // ===========================
      if (Array.isArray(resumeData.education)) {
        await UserEducation.deleteMany({ userId: id });
        await UserEducation.insertMany(
          resumeData.education.map((edu) => ({
            userId: id,
            degree: edu.degree,
            institution: edu.institution,
            year: edu.year,
          }))
        );
      }

      // ===========================
      // PROJECTS → Collection
      // ===========================
      if (Array.isArray(resumeData.projects)) {
        await UserProject.deleteMany({ userId: id });
        await UserProject.insertMany(
          resumeData.projects.map((proj) => ({
            userId: id,
            title: proj.name,
            description: proj.description,
            link: proj.link,
            skills: proj.technologies || [],
          }))
        );
      }

      // ===========================
      // ACHIEVEMENTS → Collection
      // ===========================
      if (Array.isArray(resumeData.achievements)) {
        await UserAchievement.deleteMany({ userId: id });

        await UserAchievement.insertMany(
          resumeData.achievements.map((ach) => ({
            userId: id,
            title: ach.title || null,
            description: ach.description || ach,
            year: ach.year || null,
          }))
        );
      }

      // ===========================
      // EXPERIENCE → Collection
      // ===========================
      if (Array.isArray(resumeData.experience)) {
        await UserExperience.deleteMany({ userId: id });

        await UserExperience.insertMany(
          resumeData.experience.map((exp) => ({
            userId: id,
            company: exp.company,
            role: exp.position,
            from: exp.from ? new Date(exp.from) : null,
            to: exp.to ? new Date(exp.to) : null,
            description: exp.description || null,
            attachments: exp.attachments || null,
          }))
        );
      }

      // ===========================
      // CERTIFICATIONS → Collection
      // ===========================
      if (Array.isArray(resumeData.certifications)) {
        await UserCertification.deleteMany({ userId: id });

        await UserCertification.insertMany(
          resumeData.certifications.map((c) => ({
            userId: id,
            title: c.title,
            issuer: c.issuer,
            year: c.year,
            attachments: c.attachments || null,
          }))
        );
      }

      // ===========================
      // RESUME FILE UPLOAD
      // ===========================
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Resume file is required",
        });
      }

      // Delete old resume from Cloudinary
      // Delete old resume from Cloudinary
      if (user.resumePath) {
        const publicId = extractPublicIdFromUrl(user.resumePath);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, {
            resource_type: "raw",
          });
        }
      }

      // Upload new resume
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "raw",
              folder: "skillsorbit/resumes",
              public_id: `resume-${id}-${Date.now()}`,
              filename: Filename,
              format: req.file.mimetype.split("/")[1],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(req.file.buffer);
      });

      user.resumePath = uploadResult.secure_url;
      await user.save();

      res.json({
        success: true,
        message: "Resume uploaded successfully",
        resumePath: user.resumePath,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.post(
  "/uploadProfileImage",
  authMiddleware,
  uploadImageMulter.single("file"), // IMPORTANT
  uploadProfileImage
);

router.get("/getProjects", authMiddleware, getallProjects);
router.get("/getSkills", authMiddleware, getSkills);
router.post("/uploadProject", authMiddleware, uploadProject);

router.get("/getEducations", authMiddleware, getEducations);
router.post("/createEducation", authMiddleware, createEducation);
router.put("/education/update/:id", authMiddleware, updateEducation);
router.get("/getUserExperiences", authMiddleware, getUserExperiences);

module.exports = router;
