const { connection } = require("mongoose");
const UserModel = require("../../models/UserModel");
const TestModel = require("../../models/TestModel");

const getAllTestScores = async (req, res) => {
  try {
    const { id: userId } = req.user; // Assuming user ID comes from authenticated user

    // Find all tests for this user, selecting only the relevant score fields
    const tests = await TestModel.find({ userId })
      .sort({ submittedAt: -1 }) // Sort by most recent first
      .lean();

    if (!tests || tests.length === 0) {
      return res.json({
        success: true,
        message: "No test results found for this user",
      });
    }

    return res.json({
      success: true,
      tests,
    });
  } catch (error) {
    return res.json({
      success: false,
      error: "Server error while fetching test results",
    });
  }
};

const getSkillsByUserDesiredRole = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { q } = req.query; // Get search query parameter

    const user = await UserModel.findById(userId);
    if (!user || !user.desiredRole) {
      return res.status(404).json({ error: "User or desired role not found" });
    }

    const roleName = user.desiredRole;

    // Build the aggregation pipeline
    const pipeline = [
      { $unwind: "$roles" },
      { $match: { "roles.title": { $regex: `^${roleName}$`, $options: "i" } } },
      { $unwind: "$roles.skills" },
      { $group: { _id: "$roles.skills" } },
      { $project: { _id: 0, skill: "$_id" } },
    ];

    // Add query filtering if search term exists
    if (q && q.length > 0) {
      pipeline.splice(3, 0, {
        $match: { "roles.skills": { $regex: q, $options: "i" } },
      });
    }

    const skills = await connection.db
      .collection("JobSkillData")
      .aggregate(pipeline)
      .toArray();

    return res.status(200).json(skills.map((s) => s.skill));
  } catch (error) {
    console.error("Error fetching skills for role:", error);
    return res.status(500).json({ error: "Failed to fetch skills" });
  }
};

const genTest = async (req, res) => {
  try {
    const { skills, questionCount, userId } = req.testDet;
    const { questions } = req.body;

    if (!skills || !questionCount || !userId) {
      return res.status(400).json({
        message: "Missing required test details.",
        success: false,
      });
    }

    const parsedSkills = JSON.parse(skills);
    const parsedQuestions = JSON.parse(questions);

    // Map questions to include all necessary details
    const embeddedQuestions = parsedQuestions.map((q) => ({
      title: q.title,
      type: q.type || "code",
      codeSnippet: q.codeSnippet || "",
      description: q.description || "",
      difficulty: q.difficulty || "medium",
    }));

    // Create the test with questions embedded
    const newTest = new TestModel({
      userId,
      skills: parsedSkills,
      totalQuestions: parseInt(questionCount),
      duration: `${parseInt(questionCount) * 3} mins`,
      startedAt: new Date(),
      submittedAt: new Date(Date.now() + parseInt(questionCount) * 3 * 60000),
      testCompleted: false,
      questions: embeddedQuestions,
    });

    await newTest.save();

    // Save test in user's `test` field
    const user = await UserModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.test = user.test || [];
    user.test.push(newTest); // Push the entire test document
    await user.save();

    res.status(201).json({
      success: true,
      message: "Test generated and saved in user successfully.",
      testId: newTest._id,
    });
  } catch (err) {
    console.error("Error generating test:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const testSubmit = async (req, res) => {
  res.clearCookie("td", {
    httpOnly: true, // Must match original cookie settings
    secure: process.env.NODE_ENV === "production", // Must match original
    sameSite: "none",
    maxAge: 4 * 60 * 60 * 1000, // cookie life matches token
  });

  res.json({ success: true, message: "Test Submitted Successfully" });
};

module.exports = {
  getAllTestScores,
  getSkillsByUserDesiredRole,
  genTest,
  testSubmit,
};
