const { connection } = require("mongoose");
const UserModel = require("../../models/UserModel");
const TestModel = require("../../models/TestModel");
const jwt = require("jsonwebtoken");

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
    const { skills, userId } = req.body; // 👈 get from body instead of req.testDet
    const { questions } = req.body;

    if (!skills || !userId) {
      return res.status(400).json({
        message: "Missing required test details.",
        success: false,
      });
    }

    const questionCount = questions.length;

    const parsedSkills = Array.isArray(skills) ? skills : JSON.parse(skills);
    const parsedQuestions = Array.isArray(questions)
      ? questions
      : JSON.parse(questions);

    const embeddedQuestions = parsedQuestions.map((q) => ({
      title: q.title,
      type: q.type || "code",
      codeSnippet: q.codeSnippet || "",
      description: q.description || "",
      difficulty: q.difficulty || "medium",
    }));

    const durationMinutes = parseInt(questionCount) * 3;

    const newTest = new TestModel({
      userId,
      skills: parsedSkills,
      totalQuestions: parseInt(questionCount),
      duration: `${durationMinutes} mins`,
      startedAt: new Date(),
      testCompleted: false,
      questions: embeddedQuestions,
    });

    await newTest.save();

    await UserModel.findByIdAndUpdate(userId, {
      $push: { test: newTest._id },
    });

    const t_id = jwt.sign(
      {
        test_id: newTest._id,
      },
      process.env.TEST_SECRET_KEY,
      { expiresIn: `${durationMinutes}m` }
    );

    res.cookie("t_id", t_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: durationMinutes * 60 * 1000, // duration minutes
      ...(process.env.NODE_ENV === "production"
        ? { domain: ".skillsorbit.in" }
        : {}), // localhost me domain set mat karo
    });

    res.status(201).json({
      success: true,
      message: "Test generated successfully",
      testId: newTest._id,
      test: newTest,
    });
  } catch (err) {
    console.error("Error generating test:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

const testSubmit = async (req, res) => {
  try {
    const { uanswer, canswer } = req.body;
    const { t_id: testId } = req.cookies;

    const test = await TestModel.findById(testId);
    if (!test) {
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });
    }

    // Basic evaluation (compare uanswer vs canswer)
    let correctCount = 0;
    let incorrectCount = 0;

    uanswer.forEach((ans, idx) => {
      if (canswer[idx] && ans.code?.trim() === canswer[idx].code?.trim()) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const scorePercent = Math.round((correctCount / test.totalQuestions) * 100);

    // Save fields
    test.uanswer = uanswer;
    test.canswer = canswer;
    test.correctCount = correctCount;
    test.incorrectCount = incorrectCount;
    test.scorePercent = scorePercent;
    test.testCompleted = true;
    test.submittedAt = new Date();

    await test.save();

    // Clear test cookie if used
    res.clearCookie("td", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: test.totalQuestions * 60 * 1000,
      ...(process.env.NODE_ENV === "production"
        ? { domain: ".skillsorbit.in" }
        : {}), // localhost me domain set mat karo
    });

    res.clearCookie("t_id", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: test.totalQuestions * 60 * 1000,
      ...(process.env.NODE_ENV === "production"
        ? { domain: ".skillsorbit.in" }
        : {}), // localhost me domain set mat karo
    });

    res.json({
      success: true,
      message: "Test submitted successfully",
      correctCount,
      incorrectCount,
      scorePercent,
    });
  } catch (err) {
    console.error("Error submitting test:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = {
  getAllTestScores,
  getSkillsByUserDesiredRole,
  genTest,
  testSubmit,
};
