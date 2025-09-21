const {
  getUserDet,
  uploadResume,
  uploadProfileImage,
  getallProjects,
  getSkills,
  uploadProject,
} = require("../../controllers/user/profileController");
const authMiddleware = require("../../helpers/common/authMiddleware");
const router = require("express").Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/getUserDet", authMiddleware, getUserDet);
router.post(
  "/uploadResume",
  authMiddleware,
  upload.single("file"),
  uploadResume
);
router.post("/uploadProfileImage", authMiddleware, uploadProfileImage);
router.get("/getProjects", authMiddleware, getallProjects);
router.get("/getSkills", authMiddleware, getSkills);
router.post("/uploadProject", authMiddleware, uploadProject);

module.exports = router;
