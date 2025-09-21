const InternshipModel = require("../../models/InternshipModel");
const Job = require("../../models/JobModel");

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
    const jobs = await Job.find({ createdBy: recruiter._id })
      .populate("company", "name logo")
      .sort({ createdAt: -1 })
      .lean(); // convert to plain objects

    // Tag type
    const taggedJobs = jobs.map((job) => ({ ...job, type: "Job" }));

    // Fetch internships
    const internships = await InternshipModel.find({ createdBy: recruiter._id })
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
      title,
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
      createdBy,
      company,
    } = req.body;

    const recruiter = req.recruiter; // set by authMiddleware

    if (!recruiter || !recruiter._id || !recruiter.companyId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const internshipData = {
      title,
      requiredSkills,
      optionalSkills,
      duration: Number(duration),
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
        graduationYear: Number(preferences?.graduationYear),
        minimumCGPA: parseFloat(preferences?.cgpaValue),
        otherPreferences: preferences?.others || "",
      },
      createdBy: recruiter._id,
      company: recruiter.companyId,
    };

    const newInternship = await InternshipModel.create(internshipData);

    // Populate the company field
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

module.exports = { createJobPosting, getallPosting, createInternPosting };
