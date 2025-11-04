const InternshipModel = require("../../models/InternshipModel");
const Job = require("../../models/JobModel");
const RecruiterModel = require("../../models/RecruiterModel");
const Application = require("../../models/ApplicationModel");
const mongoose = require("mongoose");
const User = require("../../models/UserModel");
const {
  applicationStatusUpdate,
} = require("../../controllers/recruiter/sendMailContr");

const createJobPosting = async (req, res) => {
  try {
    const {
      location,
      domain,
      role,
      requiredSkills,
      optionalSkills,
      description,
      salaryRange,
      benchmarkScore,
      nop,
      experience,
      preferredJoiningDate,
      extBenefits,
    } = req.body;

    const recruiter = req.recruiter; // set by authMiddleware

    if (!recruiter) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to perform the action",
      });
    }

    // get recruiter details with company populated
    const reqDet = await RecruiterModel.findById(recruiter.id).populate(
      "companyId"
    );
    if (!reqDet) {
      return res
        .status(404)
        .json({ success: false, message: "Recruiter not found" });
    }

    const job = await Job.create({
      location,
      domain,
      role,
      requiredSkills,
      description,
      salaryRange,
      createdBy: reqDet._id,
      company: reqDet.companyId,
      benchmarkScore: benchmarkScore,
      extBenefits,
      preferredJoiningDate,
      experience,
      optionalSkills,
      nop,
    });

    reqDet.jobPosts.push(job._id);
    await reqDet.save();

    const populatedJob = await Job.findById(job._id).populate("company");

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      populatedJob,
    });
  } catch (error) {
    console.error("❌ Error in createJobPosting:", error);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getallPosting = async (req, res) => {
  try {
    const recruiter = req.recruiter;

    if (!recruiter || !recruiter.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Fetch jobs
    const jobs = await Job.find({ createdBy: recruiter.id })
      .populate("company", "name logo")
      .populate({
        path: "applications",
      })
      .sort({ createdAt: -1 })
      .lean(); // convert to plain objects

    // Tag type
    const taggedJobs = jobs.map((job) => ({ ...job, type: "Job" }));

    // Fetch internships
    const internships = await InternshipModel.find({ createdBy: recruiter.id })
      .populate("company", "name logo")
      .populate({
        path: "applications",
      })
      .sort({ createdAt: -1 })
      .lean();

    const taggedInternships = internships.map((internship) => ({
      ...internship,
      type: "Internship",
    }));

    // Combine both
    const allPostings = [...taggedJobs, ...taggedInternships].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      count: allPostings.length,
      jobs: allPostings,
    });
  } catch (error) {
    console.error("Error fetching postings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job/internship postings",
    });
  }
};

/**
 * Create a new internship posting
 */
const createInternPosting = async (req, res) => {
  try {
    const {
      domain,
      role,
      requiredSkills,
      optionalSkills,
      duration,
      stipend,
      nop,
      benchmarkScore,
      location,
      preferredJoiningDate,
      mode,
      experience,
      about,
      benefits,
      preferences,
    } = req.body;

    const recruiter = req.recruiter; // ✅ set by authMiddleware

    if (!recruiter) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized request. Recruiter authentication failed.",
      });
    }

    // ✅ Fetch recruiter with company populated
    const reqDet = await RecruiterModel.findById(recruiter.id).populate(
      "companyId"
    );

    if (!reqDet) {
      return res.status(404).json({
        success: false,
        message: "Recruiter not found.",
      });
    }

    // 🧹 Clean & validate preferences safely
    const cleanedPreferences = {};

    if (
      preferences?.graduationYear &&
      !isNaN(preferences.graduationYear) &&
      Number(preferences.graduationYear) >= 2000 &&
      Number(preferences.graduationYear) <= 2035
    ) {
      cleanedPreferences.GraduationYear = Number(preferences.graduationYear);
    }

    if (
      preferences?.cgpaValue &&
      !isNaN(preferences.cgpaValue) &&
      Number(preferences.cgpaValue) >= 0 &&
      Number(preferences.cgpaValue) <= 10
    ) {
      cleanedPreferences.MinimumCGPA = parseFloat(preferences.cgpaValue);
    }

    if (preferences?.others && preferences.others.trim() !== "") {
      cleanedPreferences.OtherPreferences = preferences.others.trim();
    }

    // 🧱 Construct Internship data
    const internshipData = {
      domain: String(domain).trim(),
      role: String(role).trim(),
      requiredSkills: requiredSkills || [],
      optionalSkills: optionalSkills || [],
      duration: String(duration),
      stipend: {
        min: Number(stipend?.min) || 0,
        max: Number(stipend?.max) || 0,
      },
      positionsAvailable: Number(nop) || 1,
      benchmarkScore: benchmarkScore || "ALL",
      location,
      preferredJoiningDate,
      mode,
      experienceLevel: experience,
      about,
      benefits: benefits || [],
      preferences: cleanedPreferences,
      createdBy: reqDet._id,
      company: reqDet.companyId,
    };

    // 🧾 Create internship document
    const newInternship = await InternshipModel.create(internshipData);

    // 🔗 Link internship to recruiter profile
    reqDet.internships.push(newInternship._id);
    await reqDet.save();

    // 🧩 Populate company details for response
    const populatedInternship = await InternshipModel.findById(
      newInternship._id
    ).populate("company");

    return res.status(201).json({
      success: true,
      message: "🎉 Internship vacancy created successfully!",
      data: populatedInternship,
    });
  } catch (error) {
    console.error("❌ Internship creation failed:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message || "Something went wrong while creating internship.",
    });
  }
};

const deletePosting = async (req, res) => {
  try {
    const recruiter = req.recruiter; // set in authMiddleware
    const { id } = req.params;

    if (!recruiter || !recruiter.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Try finding in Job first
    let posting = await Job.findById(id);
    let type = "Job";

    if (!posting) {
      posting = await InternshipModel.findById(id);
      type = "Internship";
    }

    if (!posting) {
      return res
        .status(404)
        .json({ success: false, message: "Posting not found" });
    }

    // Ownership check
    if (posting.createdBy.toString() !== recruiter.id) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to delete this posting",
      });
    }

    await posting.deleteOne();

    return res.status(200).json({
      success: true,
      message: `${type} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting posting:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete posting",
    });
  }
};

const getApplicantsByOpportunity = async (req, res) => {
  try {
    const { id: opportunityId } = req.params;

    if (!opportunityId) {
      return res.status(400).json({
        success: false,
        message: "Missing opportunity ID",
      });
    }

    // 🧩 Step 1: Detect type automatically (Job or Internship)
    let type = "Job";
    let opportunity = await Job.findById(opportunityId);

    if (!opportunity) {
      opportunity = await InternshipModel.findById(opportunityId);
      type = "Internship";
    }

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found (Job or Internship)",
      });
    }

    // 🧩 Step 2: Fetch all applications for this opportunity
    const applications = await Application.find(
      type === "Job" ? { job: opportunityId } : { internship: opportunityId }
    )
      .populate("user", "name email image resume skills") // Return applicant info
      .sort({ appliedAt: -1 });

    return res.status(200).json({
      success: true,
      type,
      totalApplicants: applications.length,
      applicants: applications,
    });
  } catch (error) {
    console.error("❌ Error fetching applicants:", error);
    return res.status(500).json({
      success: false,
      message: `Server Error: ${error.message}`,
    });
  }
};

const sendDet_upDateStatus = async (req, res) => {
  try {
    const { id: recruiterId, name: recruiterName } = req.recruiter;
    const { applicantId, opporId } = req.params;

    // 1️⃣ Validate recruiter
    if (!recruiterId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Recruiter not found",
      });
    }

    const recruiterObjectId = new mongoose.Types.ObjectId(recruiterId);

    // 2️⃣ Verify recruiter owns this opportunity (Job or Internship)
    const opportunity =
      (await Job.findOne({ _id: opporId, createdBy: recruiterObjectId })) ||
      (await InternshipModel.findOne({
        _id: opporId,
        createdBy: recruiterObjectId,
      }));

    if (!opportunity) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: You do not own this opportunity or it doesn't exist.",
      });
    }

    // 3️⃣ Fetch applicant details
    const applicant = await User.findById(applicantId).select("-password");
    if (!applicant) {
      return res
        .status(404)
        .json({ success: false, message: "Applicant not found" });
    }

    // 4️⃣ Find the applicant's application for this opportunity
    const application = await Application.findOne({
      user: applicantId,
      $or: [{ job: opporId }, { internship: opporId }],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "No application found for this user and opportunity",
      });
    }

    // 5️⃣ If status is pending → update to 'seen' and send email
    if (application.status === "pending") {
      application.status = "seen";
      application.reviewedBy = recruiterObjectId;
      await application.save();

      // 📧 send email
      const mailResult = await applicationStatusUpdate(
        applicant.email,
        applicant.name,
        opportunity.role,
        "Seen by recruiter",
        recruiterName || "Recruiter"
      );

      if (!mailResult.success) {
        return res.status(500).json({
          success: false,
          message: "Application updated but failed to send email",
          error: mailResult.error,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Application status changed from pending to seen. Email sent to ${applicant.email}`,
        applicant,
        opportunity: {
          id: opportunity._id,
          role: opportunity.role,
          domain: opportunity.domain,
        },
        status: application.status,
      });
    }

    // 6️⃣ If already seen or processed → skip email
    return res.status(200).json({
      success: true,
      message: `Application already ${application.status}, no email sent.`,
      applicant,
      opportunity,
      status: application.status,
    });
  } catch (error) {
    console.error("Error in sendDet_upDateStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching applicant details or sending email",
      error: error.message,
    });
  }
};

module.exports = {
  createJobPosting,
  getallPosting,
  createInternPosting,
  deletePosting,
  getApplicantsByOpportunity,
  sendDet_upDateStatus,
};
