const {
  clearNotifications,
  markNotificationsAsRead,
  getNotifications,
  getAllInterviews,
} = require("../../controllers/common/NotificationContr");
const authMiddleware = require("../../helpers/common/authMiddleware");

const router = require("express").Router();

router.get("/getallNotf", authMiddleware, getNotifications);
router.post("/clearNotif", authMiddleware, clearNotifications);
router.put("/markNotfRead", authMiddleware, markNotificationsAsRead);
router.get("/getAllInt", authMiddleware, getAllInterviews);

module.exports = router;
