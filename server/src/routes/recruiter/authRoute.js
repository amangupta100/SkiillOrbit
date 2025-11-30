const {
  setProfilePendingCookie,
  recruiterLogin,
  logout,
  register,
} = require("../../controllers/recruiter/authController");
const router = require("express").Router();
const authMiddleware = require("../../helpers/common/authMiddleware");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PNG, JPG, JPEG allowed"), false);
  },
});

router.post("/profilePendingCookie", setProfilePendingCookie);

router.get("/check-auth", authMiddleware, (req, res) => {
  const recruiter = req.recruiter;
  res.status(200).json({
    success: true,
    recruiter,
    message: "Recruiter is authenticated",
  });
});

// frontend must send → formData.append("logo", file)
router.post("/register", upload.single("logo"), register);
router.post("/login", recruiterLogin);
router.post("/logout", authMiddleware, logout);

module.exports = router;
