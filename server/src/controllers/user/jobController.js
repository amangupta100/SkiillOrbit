const InternshipModel = require("../../models/InternshipModel");
const Job = require("../../models/JobModel");
const UserModel = require("../../models/UserModel");
const TestModel = require("../../models/TestModel");
const Application = require("../../models/ApplicationModel");
const { sendApplicationSuccess } = require("./sendMailContr");

const getallOpportunity = async (req, res) => {
  try {
    // ✅ Must have user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ✅ Fetch user saved list safely
    const userData = await UserModel.findById(req.user.id).lean();
    const savedOps = userData?.savedOpportunities || [];

    /** ✅ Get JOBS */
    const jobs = await Job.find()
      .populate(
        "company",
        "name imagePath tagline websiteURL numberOfEmployees industryType headquarters about foundedYear companyType linkedinUrl location"
      )
      .populate("createdBy", "name email")
      .populate("applications")
      .sort({ createdAt: -1 })
      .lean();

    /** ✅ Get INTERNSHIPS */
    const internships = await InternshipModel.find()
      .populate(
        "company",
        "name imagePath tagline websiteURL numberOfEmployees industryType headquarters about foundedYear companyType linkedinUrl location"
      )
      .populate("createdBy", "name email")
      .populate("applications")
      .sort({ createdAt: -1 })
      .lean();

    /** ✅ Mark saved: true/false */
    const taggedJobs = jobs.map((job) => {
      const saved = savedOps.some(
        (op) => String(op.itemId) === String(job._id) && op.itemType === "Job"
      );
      return { ...job, type: "Job", saved };
    });

    const taggedInternships = internships.map((internship) => {
      const saved = savedOps.some(
        (op) =>
          String(op.itemId) === String(internship._id) &&
          op.itemType === "Internship"
      );
      return { ...internship, type: "Internship", saved };
    });

    /** ✅ Merge & sort */
    const allPostings = [...taggedJobs, ...taggedInternships].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      count: allPostings.length,
      postings: allPostings,
    });
  } catch (err) {
    console.error("❌ Error fetching opportunities:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch opportunities",
    });
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

const applyForOpportunity = async (req, res) => {
  try {
    const userId = req.user?.id;
    const opportunityId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!opportunityId) {
      return res.status(400).json({
        success: false,
        message: "Missing opportunityId",
      });
    }

    // ✅ Step 1: Find Opportunity (Job or Internship)
    let opportunity = await Job.findById(opportunityId);
    let type = "Job";

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

    const opportunityTitle = opportunity.role; // Using 'role' field from JobModel (assuming Internship has similar)

    // ✅ Step 2: Check if user already applied
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

    // ✅ Step 3: Fetch user's current resume for snapshot
    const user = await UserModel.findById(userId);

    if (!user?.email || !user?.name) {
      // Log warning but proceed (email sending will fail gracefully)
      console.warn("User missing email or name for application success email");
    }

    // ✅ Create application WITH resume snapshot
    const application = await Application.create({
      user: userId,
      applicationType: type,
      status: "pending",
      appliedAt: new Date(),

      ...(type === "Job"
        ? { job: opportunityId }
        : { internship: opportunityId }),

      resumeSnapshot: user?.resume
        ? {
            data: user.resume.data,
            contentType: user.resume.contentType,
            filename: user.resume.filename,
            lastModified: user.resume.lastModified,
          }
        : null,
    });

    // ✅ Step 4: Update User reference
    await UserModel.findByIdAndUpdate(userId, {
      $push: { applications: application._id },
    });

    // ✅ Step 5: Update Opportunity reference
    if (type === "Job") {
      await Job.findByIdAndUpdate(opportunityId, {
        $push: { applications: application._id },
      });
    } else {
      await InternshipModel.findByIdAndUpdate(opportunityId, {
        $push: { applications: application._id },
      });
    }

    // ✅ Step 6: Send application success email to applicant (non-blocking for response)
    if (user?.email && user?.name && opportunityTitle) {
      sendApplicationSuccess(
        user.email,
        user.name,
        opportunityTitle,
        type
      ).catch((err) => {
        console.error("Application success email failed:", err);
      });
    }

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
    const { aplId: applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate("user") // applicant details
      .populate("reviewedBy") // recruiter details (if exists)
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
      });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // ✅ Applicant details
    const applicantDet = application.user;

    // ✅ Application details
    const applicationDet = application;

    // Allowed statuses to return recruiter
    const showRecruiterStatuses = [
      "shortlisted",
      "interview_scheduled",
      "interviewed",
      "offered",
      "selected",
    ];

    let recruiterDet = null;

    if (showRecruiterStatuses.includes(application.status)) {
      // only return recruiter if reviewedBy is not null
      if (application.reviewedBy) {
        recruiterDet = application.reviewedBy;
      }
    }
    const data = {
      applicationDet,
      applicantDet,
      recruiterDet,
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const saveOpportunity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, itemType } = req.body;

    if (!["Job", "Internship"].includes(itemType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid itemType" });
    }

    // ✅ Validate existence
    const exists =
      itemType === "Job"
        ? await Job.findById(itemId)
        : await InternshipModel.findById(itemId);

    if (!exists) {
      return res
        .status(404)
        .json({ success: false, message: "Opportunity not found" });
    }

    const user = await UserModel.findById(userId);

    // ✅ Check if already saved
    const index = user.savedOpportunities.findIndex(
      (op) => String(op.itemId) === String(itemId) && op.itemType === itemType
    );

    if (index !== -1) {
      // ✅ UNSAVE
      user.savedOpportunities.splice(index, 1);
      await user.save();
      return res
        .status(200)
        .json({ success: true, saved: false, message: "Removed from saved" });
    }

    // ✅ SAVE
    user.savedOpportunities.push({ itemId, itemType });
    await user.save();

    return res
      .status(200)
      .json({ success: true, saved: true, message: "Saved successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const searchOpportunities = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const q = req.query.q?.trim();
    if (!q || q.length < 1) {
      return res.status(200).json({
        success: true,
        count: 0,
        postings: [],
      });
    }

    const keywords = q.split(" ").filter((word) => word.length > 1);

    // 📌 Build dynamic OR-based query for keyword matching
    const searchQuery = {
      $or: [
        { role: { $regex: q, $options: "i" } },
        { title: { $regex: q, $options: "i" } },
        { domain: { $regex: q, $options: "i" } },
        { requiredSkills: { $in: keywords.map((k) => new RegExp(k, "i")) } },
        { optionalSkills: { $in: keywords.map((k) => new RegExp(k, "i")) } },
        { location: { $regex: q, $options: "i" } },
        { companyName: { $regex: q, $options: "i" } },
      ],
    };

    // Fetch user saved
    const userData = await UserModel.findById(userId).lean();
    const savedOps = userData?.savedOpportunities || [];

    /** ────────────────────────────────
     *  🔍 SEARCH JOBS
     * ────────────────────────────────*/
    const jobs = await Job.find(searchQuery)
      .populate(
        "company",
        "name logo tagline websiteURL numberOfEmployees industryType headquarters about foundedYear companyType linkedinUrl location"
      )
      .populate("applications")
      .sort({ createdAt: -1 })
      .lean();

    /** ────────────────────────────────
     *  🔍 SEARCH INTERNSHIPS
     * ────────────────────────────────*/
    const internships = await InternshipModel.find(searchQuery)
      .populate(
        "company",
        "name logo tagline websiteURL numberOfEmployees industryType headquarters about foundedYear companyType linkedinUrl location"
      )
      .populate("applications")
      .sort({ createdAt: -1 })
      .lean();

    /** ────────────────────────────────
     *  ❤️ Mark Saved
     * ────────────────────────────────*/
    const taggedJobs = jobs.map((job) => ({
      ...job,
      saved: savedOps.some(
        (s) => String(s.itemId) === String(job._id) && s.itemType === "Job"
      ),
      type: "Job",
    }));

    const taggedIntern = internships.map((int) => ({
      ...int,
      saved: savedOps.some(
        (s) =>
          String(s.itemId) === String(int._id) && s.itemType === "Internship"
      ),
      type: "Internship",
    }));

    /** ────────────────────────────────
     *  🔄 Merge & Sort (Active first)
     * ────────────────────────────────*/
    const merged = [...taggedJobs, ...taggedIntern].sort((a, b) => {
      if (a.status === "Active" && b.status !== "Active") return -1;
      if (b.status === "Active" && a.status !== "Active") return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.status(200).json({
      success: true,
      count: merged.length,
      postings: merged,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
};

module.exports = {
  getallOpportunity,
  getSkillMatch,
  applyForOpportunity,
  getAllApplications,
  getApplicationDetails,
  saveOpportunity,
  searchOpportunities,
};
