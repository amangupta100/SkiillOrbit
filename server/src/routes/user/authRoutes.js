const {
  register,
  login,
  logout,
  profileSetupEnd,
  clearAccRefCook,
  uploadDomainData,
} = require("../../controllers/user/authController");
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { genResumeDataToken } = require("../../helpers/genResumeDataToken");
const authMiddleware = require("../../helpers/common/authMiddleware");
const {
  uploadProfileImage,
} = require("../../controllers/user/profileController");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get("/check-auth", authMiddleware, (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
    message: "User is authenticated",
  });
});

router.post("/upload-image", authMiddleware, uploadProfileImage);

router.post("/profileSetEnd", authMiddleware, profileSetupEnd);
router.post("/clearAccRefCookie", clearAccRefCook);
router.post("/uploadDomainData", authMiddleware, uploadDomainData);
router.post("/genResumeDataToken", authMiddleware, genResumeDataToken);
router.get("/getResumeData", authMiddleware, async (req, res, next) => {
  const genResumeDataToken = req.cookies.rDV;
  const decoded = jwt.verify(genResumeDataToken, process.env.ResumeDataToken);
  res.json({ success: true, decoded });

  next();
});

module.exports = router;
