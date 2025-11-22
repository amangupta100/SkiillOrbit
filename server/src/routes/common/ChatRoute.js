const router = require("express").Router();
const {
  searchApplicants,
  getChatList,
  createOrGetConversation,
  getChatMessages,
  getAllChatsWithMessages,
  GetPrivateChat,
  scheduleInterview,
} = require("../../controllers/common/ChatController");
const authMiddleware = require("../../helpers/common/authMiddleware");

router.get("/searchApplicants", authMiddleware, searchApplicants);
router.get("/getChatList", authMiddleware, getChatList);
router.post("/get&CreateConversation", authMiddleware, createOrGetConversation);
router.get("/messages/:chatId", authMiddleware, getChatMessages);
router.get("/allchatswithmessages", authMiddleware, getAllChatsWithMessages);
router.post("/GetPrivateChat", authMiddleware, GetPrivateChat);
router.post("/scheduleInterview", authMiddleware, scheduleInterview);

module.exports = router;
