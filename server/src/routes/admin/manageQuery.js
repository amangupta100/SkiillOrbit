const router = require("express").Router();
const {
  getAllSupportQueries,
  createQuery,
} = require("../../controllers/admin/manageQuery");
const authMiddleware = require("../../helpers/common/authMiddleware");

router.post("/createQuery", createQuery);
router.get("/allQueries", authMiddleware, getAllSupportQueries);

module.exports = router;
