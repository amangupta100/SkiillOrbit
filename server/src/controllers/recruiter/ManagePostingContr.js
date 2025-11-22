const InternshipModel = require("../../models/InternshipModel");
const Job = require("../../models/JobModel");
const RecruiterModel = require("../../models/RecruiterModel");
const Application = require("../../models/ApplicationModel");
const mongoose = require("mongoose");
const User = require("../../models/UserModel");
const {
  applicationStatusUpdate,
  sendShortlistEmail,
} = require("./sendMailContr");

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

    // ✅ Step 1: Detect Job or Internship
    let type = "Job";
    let opportunity = await Job.findById(opportunityId);

    if (!opportunity) {
      opportunity = await InternshipModel.findById(opportunityId);
      type = "Internship";
    }

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found",
      });
    }

    // ✅ Step 2: Fetch all applications WITH atsScore
    const applications = await Application.find(
      type === "Job" ? { job: opportunityId } : { internship: opportunityId }
    )
      .populate("user", "name email image resume skills")
      .sort({ appliedAt: -1 })
      .lean(); // ✅ lean allows modifying output safely

    // ✅ Step 3: Format applicants with ATS score included
    const formattedApplicants = applications.map((app) => ({
      _id: app._id,
      appliedAt: app.appliedAt,
      status: app.status,
      user: app.user,
      atsScore: app.atsScore || null,
    }));

    return res.status(200).json({
      success: true,
      type,
      totalApplicants: formattedApplicants.length,
      applicants: formattedApplicants,
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

    // 2️⃣ Verify recruiter owns this opportunity (Job or Internship) and populate company
    const opportunity =
      (await Job.findOne({
        _id: opporId,
        createdBy: recruiterObjectId,
      }).populate("company")) ||
      (await InternshipModel.findOne({
        _id: opporId,
        createdBy: recruiterObjectId,
      }).populate("company"));

    if (!opportunity) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: You do not own this opportunity or it doesn't exist.",
      });
    }

    // Extract company name safely
    const companyName = opportunity.company?.name || "Unknown Company";

    console.log(companyName);
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

      // 📧 send email with companyName
      const mailResult = await applicationStatusUpdate(
        applicant.email,
        applicant.name,
        opportunity.role,
        "Seen by recruiter",
        recruiterName || "Recruiter",
        companyName
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
          companyName, // Include in response if needed
        },
        status: application.status,
      });
    }

    // 6️⃣ If already seen or processed → skip email
    return res.status(200).json({
      success: true,
      message: `Application already ${application.status}, no email sent.`,
      applicant,
      opportunity: {
        id: opportunity._id,
        role: opportunity.role,
        domain: opportunity.domain,
        companyName, // Include in response if needed
      },
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

const changeOpportunityStatus = async (req, res) => {
  try {
    const { id } = req.params; // Opportunity ID
    const { reason } = req.body;
    const recruiterId = req.recruiter.id; // from recruiterAuth middleware

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid reason (min 5 characters) for closing this posting.",
      });
    }

    // 🧩 Detect whether it's a Job or Internship
    let opportunity = await Job.findById(id);
    let type = "Job";

    if (!opportunity) {
      opportunity = await InternshipModel.findById(id);
      type = "Internship";
    }

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found.",
      });
    }

    // 🛑 Only allow change if status is 'Active'
    if (opportunity.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: `Status cannot be changed because this ${type.toLowerCase()} is already ${
          opportunity.status
        }. Only Active postings can be closed.`,
      });
    }

    // ✅ Update status to Closed
    opportunity.status = "Closed";
    opportunity.closureDetails = {
      reason: reason.trim(),
      closedBy: recruiterId,
      closedAt: new Date(),
    };

    await opportunity.save();

    return res.status(200).json({
      success: true,
      message: `${type} status changed to 'Closed' successfully.`,
      data: {
        id: opportunity._id,
        type,
        status: opportunity.status,
        closureDetails: opportunity.closureDetails,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Server error while changing status.",
    });
  }
};

const getOpportunityStatus = async (req, res) => {
  try {
    const { id } = req.params;

    let opportunity = await Job.findById(id).select(
      "status closureDetails role"
    );
    let type = "Job";

    if (!opportunity) {
      opportunity = await InternshipModel.findById(id).select(
        "status closureDetails role"
      );
      type = "Internship";
    }

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found",
      });
    }

    return res.json({
      success: true,
      type,
      data: {
        status: opportunity.status,
        role: opportunity.role,
        closureDetails: opportunity.closureDetails || {},
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};

const searchApplicantsByName = async (req, res) => {
  try {
    const { id } = req.params; // opportunity ID
    const { query = "" } = req.query; // typed letters from search box

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Opportunity ID is required.",
      });
    }

    // 🧩 Detect opportunity type (Job or Internship)
    let type = "Job";
    let opportunity = await Job.findById(id).populate("applications");
    if (!opportunity) {
      opportunity = await InternshipModel.findById(id).populate("applications");
      type = "Internship";
    }

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found.",
      });
    }

    // 🧾 Get all applications for this opportunity
    const applications = await Application.find({
      _id: { $in: opportunity.applications },
    }).populate("user", "name email image");

    // 🧠 Filter by letter (case insensitive)
    const filteredApplicants = applications
      .filter((a) => a.user?.name?.toLowerCase().includes(query.toLowerCase()))
      .map((a) => ({
        id: a._id,
        name: a.user?.name || "Unknown",
        email: a.user?.email || "",
        image: a.user?.image || null,
      }));

    return res.status(200).json({
      success: true,
      type,
      total: filteredApplicants.length,
      applicants: filteredApplicants,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error while searching applicants.",
    });
  }
};

const filterApplicantsForOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      skill,
      minScore,
      maxScore,
      experience,
      education,
      location,
      status,
    } = req.query;

    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "Opportunity ID is required" });

    // Detect opportunity type
    let type = "Job";
    let opportunity = await Job.findById(id).populate("applications");
    if (!opportunity) {
      opportunity = await InternshipModel.findById(id).populate("applications");
      type = "Internship";
    }

    if (!opportunity)
      return res
        .status(404)
        .json({ success: false, message: "Opportunity not found" });

    // Fetch related applications
    const applications = await Application.find({
      _id: { $in: opportunity.applications },
    }).populate(
      "user",
      "name email image skills education location experience"
    );

    let filtered = applications;

    // 🔹 Filter by name/keyword
    if (name) {
      const query = name.toLowerCase();
      filtered = filtered.filter((a) =>
        a.user?.name?.toLowerCase().includes(query)
      );
    }

    // 🔹 Filter by skill
    if (skill) {
      const skillQuery = skill.toLowerCase();
      filtered = filtered.filter((a) =>
        a.user?.skills?.some((s) => s.toLowerCase().includes(skillQuery))
      );
    }

    // 🔹 Filter by education
    if (education) {
      filtered = filtered.filter((a) =>
        a.user?.education?.toLowerCase()?.includes(education.toLowerCase())
      );
    }

    // 🔹 Filter by experience
    if (experience) {
      filtered = filtered.filter((a) =>
        a.user?.experience?.toLowerCase()?.includes(experience.toLowerCase())
      );
    }

    // 🔹 Filter by location
    if (location) {
      filtered = filtered.filter((a) =>
        a.user?.location?.toLowerCase()?.includes(location.toLowerCase())
      );
    }

    // 🔹 Filter by status (based on Application model enums)
    if (
      status &&
      [
        "pending",
        "seen",
        "shortlisted",
        "interview_scheduled",
        "interviewed",
        "offered",
        "selected",
        "rejected",
        "withdrawn",
      ].includes(status)
    ) {
      filtered = filtered.filter((a) => a.status === status);
    }

    // 🔹 Filter by ATS score
    if (minScore || maxScore) {
      filtered = filtered.filter((a) => {
        const score = a.atsScore || 0;
        return (
          (minScore ? score >= parseFloat(minScore) : true) &&
          (maxScore ? score <= parseFloat(maxScore) : true)
        );
      });
    }

    const results = filtered.map((a) => ({
      id: a._id,
      name: a.user?.name,
      email: a.user?.email,
      image: a.user?.image || null,
      atsScore: a.atsScore || null,
      appliedAt: a.appliedAt,
      status: a.status,
    }));

    return res.status(200).json({
      success: true,
      type,
      total: results.length,
      applicants: results,
      filtered: true,
    });
  } catch (err) {
    console.error("❌ Filter Applicants Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const shortlistApplicant = async (req, res) => {
  try {
    const { opporId, applId } = req.body;
    const recruiterId = req.recruiter?.id;

    if (!opporId || !applId) {
      return res.status(400).json({
        success: false,
        message: "Opportunity ID and Application ID are required.",
      });
    }

    // 🔹 Validate recruiterId (must be a valid ObjectId string)
    if (!mongoose.Types.ObjectId.isValid(recruiterId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recruiter ID.",
      });
    }

    // 🔹 Convert recruiterId to string for comparison
    const recruiterIdStr = String(recruiterId);

    // 🔹 Find Job or Internship
    let opportunity = await Job.findById(opporId).populate(
      "company",
      "name logo"
    );
    let oppType = "Job";

    if (!opportunity) {
      opportunity = await InternshipModel.findById(opporId).populate(
        "company",
        "name logo"
      );
      oppType = "Internship";
    }

    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: "Opportunity not found.",
      });
    }

    // 🔹 Ensure recruiter owns this posting (createdBy is ObjectId)
    const createdByStr = String(opportunity.createdBy);

    if (createdByStr !== recruiterIdStr) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized recruiter access.",
      });
    }

    // 🔹 Find the application
    const application = await Application.findById(applId).populate(
      "user",
      "name email"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    // 🔹 Verify application belongs to the same opportunity
    const oppField = oppType === "Job" ? "job" : "internship";

    if (String(application[oppField]) !== String(opporId)) {
      return res.status(400).json({
        success: false,
        message: "Application does not belong to this opportunity.",
      });
    }

    // 🔹 Already shortlisted?
    if (application.status === "shortlisted") {
      return res.status(400).json({
        success: false,
        message: "Applicant is already shortlisted.",
      });
    }

    // 🔹 Update application status
    application.status = "shortlisted";
    application.reviewedBy = recruiterId;
    await application.save(); // ✅ Save to DB

    // 🔹 Prepare email data
    const applicantName = application.user.name;
    const applicantEmail = application.user.email;
    const companyName = opportunity.company.name || "Company";
    const role = opportunity.role || opportunity.title || "Opportunity";

    // 🔹 Send email
    await sendShortlistEmail(applicantEmail, applicantName, companyName, role);

    return res.status(200).json({
      success: true,
      message: `Applicant ${applicantName} shortlisted successfully.`,
      updatedStatus: "shortlisted",
      opportunityType: oppType,
    });
  } catch (err) {
    console.error("Shortlist Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
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
  changeOpportunityStatus,
  getOpportunityStatus,
  searchApplicantsByName,
  filterApplicantsForOpportunity,
  shortlistApplicant,
};
