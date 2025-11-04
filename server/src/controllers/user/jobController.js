const InternshipModel = require("../../models/InternshipModel");
const Job = require("../../models/JobModel");
const UserModel = require("../../models/UserModel");
const TestModel = require("../../models/TestModel");
const Application = require("../../models/ApplicationModel");

const getallOpportunity = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const jobs = await Job.find()
      .populate(
        "company",
        "name logo tagline websiteURL numberOfEmployees industryType headquarters about foundedYear companyType linkedinUrl location"
      )
      .populate("createdBy", "name email")
      .populate("applications")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all internships
    const internships = await InternshipModel.find()
      .populate(
        "company",
        "name logo tagline websiteURL numberOfEmployees industryType headquarters about foundedYear companyType linkedinUrl location"
      )
      .populate("createdBy", "name email")
      .populate("applications")
      .sort({ createdAt: -1 })
      .lean();

    const taggedJobs = jobs.map((job) => ({ ...job, type: "Job" }));
    const taggedInternships = internships.map((internship) => ({
      ...internship,
      type: "Internship",
    }));
    const allPostings = [...taggedJobs, ...taggedInternships].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      count: allPostings.length,
      postings: allPostings,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

const getSkillMatch = async (req, res) => {
  try {
    const { id: opportunityId } = req.params;
    const userId = req.user.id;

    // 🧩 Step 1: Fetch opportunity (job or internship)
    let opportunity =
      (await Job.findById(opportunityId)) ||
      (await InternshipModel.findById(opportunityId));

    if (!opportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    // 🧩 Step 2: Fetch user
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const tests = await TestModel.find({ userId })
      .sort({ submittedAt: -1 })
      .limit(10);

    // 🧩 Step 3: Get required skills from the opportunity
    const requiredSkills = opportunity.requiredSkills || [];
    const optionalSkills = opportunity.optionalSkills || [];

    // 🧩 Step 6: Response
    return res.status(200).json({
      requiredSkills,
      optionalSkills,
      tests,
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

//
// ✅ Apply for a particular job or internship
//
const applyForOpportunity = async (req, res) => {
  try {
    const userId = req.user?.id;
    const opportunityId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!opportunityId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing opportunityId" });
    }

    // 🧩 Step 1: Find opportunity (Job or Internship automatically)
    let opportunity = await Job.findById(opportunityId);
    let type = "Job";

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

    // 🧩 Step 2: Check if user already applied
    const existingApp = await Application.findOne({
      user: userId,
      ...(type === "Job"
        ? { job: opportunityId }
        : { internship: opportunityId }),
    });

    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: `You have already applied for this ${type.toLowerCase()}.`,
      });
    }

    // 🧩 Step 3: Create application
    const application = await Application.create({
      user: userId,
      applicationType: type,
      status: "pending",
      appliedAt: new Date(),
      ...(type === "Job"
        ? { job: opportunityId }
        : { internship: opportunityId }),
    });

    // 🧩 Step 4: Update references
    await UserModel.findByIdAndUpdate(userId, {
      $push: { applications: application._id },
    });

    await (type === "Job"
      ? Job.findByIdAndUpdate(opportunityId, {
          $push: { applications: application._id },
        })
      : InternshipModel.findByIdAndUpdate(opportunityId, {
          $push: { applications: application._id },
        }));

    // 🧩 Step 5: Respond success
    return res.status(200).json({
      success: true,
      message: `${type} application submitted successfully.`,
      application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Server Error: ${error.message}`,
    });
  }
};

const getAllApplications = async (req, res) => {
  try {
    // 🧠 Detect who is making the request
    const userId = req.user?.id;
    const recruiterId = req.recruiter?.id;

    if (!userId && !recruiterId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No valid user or recruiter found in request",
      });
    }

    let query = {};

    // 👩‍💼 If User — get their own job/internship applications
    if (userId) {
      query = { user: userId };
    }

    // 🧑‍💼 If Recruiter — get all applications reviewed or related to their postings
    if (recruiterId) {
      query = { reviewedBy: recruiterId };
    }

    // 🔍 Fetch applications
    const applications = await Application.find(query)
      .populate("user", "name email profileImage")
      .populate({
        path: "job",
        select:
          "domain role requiredSkills status company location employmentType",
        populate: {
          path: "company",
          select: "name description website logo location",
        },
      })
      .populate({
        path: "internship",
        select:
          "domain requiredSkills status role company duration stipend location",
        populate: {
          path: "company",
          select: "name description website logo location",
        },
      })
      .populate("reviewedBy", "name email")
      .sort({ appliedAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching applications",
      error: error.message,
    });
  }
};

const getApplicationDetails = async (req, res) => {
  try {
    const { aplId } = req.params;

    const application = await Application.findById(aplId)
      .populate({
        path: "user",
        select: "name email resume skills desiredRole linkedin github leetcode",
      })
      .populate({
        path: "job",
        select: "title company location salary jobType description",
      })
      .populate({
        path: "internship",
        select: "title company location stipend duration description",
      })
      .populate({
        path: "reviewedBy",
        select: "name email companyName",
      });

    if (!application) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getallOpportunity,
  getSkillMatch,
  applyForOpportunity,
  getAllApplications,
  getApplicationDetails,
};
