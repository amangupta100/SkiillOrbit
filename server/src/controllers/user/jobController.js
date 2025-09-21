const InternshipModel = require("../../models/InternshipModel");
const Job = require("../../models/JobModel");
const UserModel = require("../../models/UserModel");

const getallOpportunity =async (req,res) =>{
try{
 const user = req.user;

    if (!user || !user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

  const jobs = await Job.find({ status: "Active" })
      .populate('company', 'name logo tagline websiteURL numberOfEmployees industryType headquarters about foundedYear companyType linkedinUrl location')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 }).lean()

    // Fetch all internships
    const internships = await InternshipModel.find({ status: "Active" })
      .populate('company', 'name logo tagline websiteURL numberOfEmployees industryType headquarters about foundedYear companyType linkedinUrl location')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 }).lean()
  
 const taggedJobs = jobs.map(job => ({ ...job, type: "Job" }));
 const taggedInternships = internships.map(internship => ({ ...internship, type: "Internship" }));
 const allPostings = [...taggedJobs, ...taggedInternships].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

  return res.status(200).json({
      success: true,
      count: allPostings.length,
      postings: allPostings,
    });
}catch(err){
 res.status(500).json({ message: "Failed to fetch jobs" });
}
}


const getSkillMatch = async (req, res) => {
  try {
    const { id: opportunityId } = req.params;
    const userId = req.user.id;

    let opportunity = await Job.findById(opportunityId);
    if (!opportunity) {
      opportunity = await InternshipModel.findById(opportunityId);
      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
    }

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const requiredSkills = opportunity.requiredSkills || [];
    const verifiedSkills = user.verifiedSkills || [];

    const matchedSkills = verifiedSkills.filter(skill =>
      requiredSkills.includes(skill)
    );

    const unmatchedSkills = requiredSkills.filter(skill =>
      !verifiedSkills.includes(skill)
    );

    const matchedCount = matchedSkills.length;
    const unmatchedCount = unmatchedSkills.length;

    const matchPercentage = requiredSkills.length
      ? (matchedCount / requiredSkills.length) * 100
      : 0;

    return res.status(200).json({
      chartData: {
        labels: ["Matched", "Unmatched"],
        values: [matchedCount, unmatchedCount],
        percentage: Number(matchPercentage.toFixed(2)),
      },
      matchedSkills,
      unmatchedSkills,
      verifiedSkills,
      requiredSkills,
    });
  } catch (error) {
    console.error("Skill match error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getSkillMatch };



module.exports = {getallOpportunity,getSkillMatch}