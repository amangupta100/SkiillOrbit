const router = require("express").Router();
const {
  getAllDomains,
  getRoles,
  getRoleSkills,
  deleteSkill,
  addSkill,
  addRole,
  deleteRole,
} = require("../../controllers/admin/manageDomain&Skills");
const authMiddleware = require("../../helpers/common/authMiddleware");

router.get("/getDomain", authMiddleware, getAllDomains);
router.get("/getRoles", authMiddleware, getRoles);
router.get("/getRoleSkills", authMiddleware, getRoleSkills);
router.delete("/deleteSkill", authMiddleware, deleteSkill);
router.post("/addSkill", authMiddleware, addSkill);

// Add a new role to a domain
router.post("/addRole", addRole);

// Delete a role from a domain
router.delete("/deleteRole", deleteRole);

module.exports = router;
