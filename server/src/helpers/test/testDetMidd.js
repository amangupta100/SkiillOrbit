const jwt = require("jsonwebtoken")
const UserModel = require("../../models/UserModel")

const testDetMidd =async (req,res,next) =>{

const td = req.cookies.td

if(!td) return res.status(401).json({success:false,message:"No authorized to perform this action at them moment"})

try{

const decoded =jwt.verify(td,process.env.TEST_SECRET_KEY) 

const user = await UserModel.findById(decoded.userId)
if(!user) return res.status(401).json({success:false,message:"No authorized to perform the action at the moment"})

req.testDet = {
    skills:decoded.skills,
    questionCount:decoded.questionCount,
    userId:decoded.userId
}
return next()
}catch(err){
return res.status(401).json({
    success:false,message:"Session Expired"
})
}
}

module.exports = {testDetMidd}