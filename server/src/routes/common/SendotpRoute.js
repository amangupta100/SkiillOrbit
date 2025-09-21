const { SendOTP, VerifyOTP } = require("../../controllers/common/SendOtpContr")

const router = require("express").Router()

router.post("/sendOTP",SendOTP)
router.post('/verifyOTP',VerifyOTP)

module.exports = router