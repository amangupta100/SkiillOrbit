const InternshipModel = require("../../models/InternshipModel");
const Job = require("../../models/JobModel");
const RecruiterModel = require("../../models/RecruiterModel");

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

    if (!recruiter || !recruiter._id || !recruiter.companyId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const job = await Job.create({
      location,
      domain,
      role,
      requiredSkills,
      description,
      salaryRange,
      createdBy: recruiter._id,
      company: recruiter.companyId,
      benchmarkScore: benchmarkScore,
      extBenefits,
      preferredJoiningDate,
      experience,
      optionalSkills,
      nop,
    });

    const populatedJob = await Job.findById(job._id)
      .populate({
        path: "company",
        select:
          "name logo industryType about website headquartersSize foundedYear", // Add all company fields you need
      })
      .populate("createdBy", "name email")
      .populate("applicants", "name email resume score"); // Populate applicant details if needed
    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      populatedJob,
    });
  } catch (error) {
    console.error("Error creating job posting:", error);
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
      .sort({ createdAt: -1 })
      .lean(); // convert to plain objects

    // Tag type
    const taggedJobs = jobs.map((job) => ({ ...job, type: "Job" }));

    // Fetch internships
    const internships = await InternshipModel.find({ createdBy: recruiter.id })
      .populate("company", "name logo")
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

    const recruiter = req.recruiter; // set by authMiddleware

    if (!recruiter) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
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

    const internshipData = {
      domain,
      role,
      requiredSkills,
      optionalSkills,
      duration: String(duration), // schema expects String
      stipend: {
        min: Number(stipend.min),
        max: Number(stipend.max),
      },
      positionsAvailable: Number(nop),
      benchmarkScore: benchmarkScore || "ALL",
      location,
      preferredJoiningDate,
      mode,
      experienceLevel: experience,
      about,
      benefits,
      preferences: {
        GraduationYear: Number(preferences?.graduationYear),
        MinimumCGPA: parseFloat(preferences?.cgpaValue),
        OtherPreferences: preferences?.others || "",
      },
      createdBy: reqDet._id,
      company: reqDet.companyId, // ✅ fix: use recruiter’s companyId
    };

    // create internship
    const newInternship = await InternshipModel.create(internshipData);

    // push into recruiter’s internships
    reqDet.internships.push(newInternship._id);
    await reqDet.save();

    // populate for response
    const populatedInternship = await InternshipModel.findById(
      newInternship._id
    ).populate("company");

    return res.status(201).json({
      success: true,
      message: "Internship Vacancy created successfully",
      data: populatedInternship,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
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
      return res
        .status(403)
        .json({
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

module.exports = {
  createJobPosting,
  getallPosting,
  createInternPosting,
  deletePosting,
};
