const Job = require("../../models/JobModel");
const Internship = require("../../models/InternshipModel");
const User = require("../../models/UserModel");
const ApplicationModel = require("../../models/ApplicationModel");

const processAppl = async (req, res) => {
  try {
    const recruiterId = req.recruiter?.id;
    const { id: jobId } = req.params;
    const { applicantIds } = req.body;

    if (!recruiterId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized to perform the action",
      });
    }

    let opportunity, opporType;
    const job = await Job.findById(jobId).populate("applications");
    if (job) {
      opportunity = job;
      opporType = "Job";
    } else {
      opportunity = await Internship.findById(jobId).populate("applications");
      opporType = "Internship";
    }

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "No job or internship found with this ID",
      });
    }

    let filteredApplicantIds;
    if (applicantIds && applicantIds.length > 0) {
      filteredApplicantIds = opportunity.applications
        .filter((app) => applicantIds.includes(app._id.toString()))
        .map((a) => a.user);
    } else {
      filteredApplicantIds = opportunity.applications.map((a) => a.user);
    }

    if (!filteredApplicantIds.length) {
      return res.json({
        success: false,
        message: "No applicants found for this opportunity",
      });
    }

    const applicants = await Promise.all(
      filteredApplicantIds.map(async (userId) => {
        const user = await User.findById(userId).select(
          "name email resume phoneNumber skills"
        );
        if (!user) return null;

        const plainUser = user.toObject(); // 👈 convert to plain JS object

        if (plainUser.resume && plainUser.resume.data) {
          try {
            if (Buffer.isBuffer(plainUser.resume.data)) {
              plainUser.resume.data = plainUser.resume.data.toString("base64");
            } else if (plainUser.resume.data?.buffer) {
              plainUser.resume.data = Buffer.from(
                plainUser.resume.data.buffer
              ).toString("base64");
            } else if (Array.isArray(plainUser.resume.data?.data)) {
              plainUser.resume.data = Buffer.from(
                plainUser.resume.data.data
              ).toString("base64");
            } else {
              console.warn("Unknown resume data format for user:", userId);
              plainUser.resume.data = null;
            }
          } catch (err) {
            console.error(`Base64 conversion failed for user ${userId}:`, err);
            plainUser.resume.data = null;
          }
        }

        return plainUser;
      })
    );

    const validApplicants = applicants.filter(Boolean);

    return res.json({
      success: true,
      count: validApplicants.length,
      applicants: validApplicants,
      opporType,
    });
  } catch (error) {
    console.error("Error in processAppl:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching applicants",
    });
  }
};

const saveAtsScores = async (req, res) => {
  try {
    const { id } = req.params; // job/internship id
    const { scores } = req.body; // [{ applicantId, total, match, breakdown }]
    console.log(scores, id);

    if (!scores || !scores.length) {
      return res
        .status(400)
        .json({ success: false, message: "Scores missing" });
    }

    // ✅ Step 1 → Check if ID is a Job
    let opp = await Job.findById(id);
    let type = "Job";

    // ✅ Step 2 → If not job, check Internship
    if (!opp) {
      opp = await Internship.findById(id);
      if (!opp) {
        return res.status(404).json({
          success: false,
          message: "Opportunity not found",
        });
      }
      type = "Internship";
    }

    // ✅ Step 3 → Update ATS score for each applicant
    const updates = scores.map((s) =>
      ApplicationModel.updateOne(
        {
          user: s.applicantId,
          ...(type === "Job" ? { job: id } : { internship: id }),
        },
        { $set: { atsScore: s.total } }
      )
    );

    await Promise.all(updates);

    return res.json({
      success: true,
      message: "ATS scores saved successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

module.exports = { processAppl, saveAtsScores };
