const { suggestDomains, suggestRoles, suggestSkills } = require("../../controllers/user/JobSkillDataContr")

const router = require("express").Router()

router.get("/getDomain",suggestDomains)
router.get("/getRoles",suggestRoles)
router.get("/getSkills",suggestSkills)

module.exports = router