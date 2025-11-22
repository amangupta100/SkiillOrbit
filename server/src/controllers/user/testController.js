const { connection } = require("mongoose");
const UserModel = require("../../models/UserModel");
const TestModel = require("../../models/TestModel");
const jwt = require("jsonwebtoken");
const Question = require("../../models/QuestionModel");
const { testEvalQueue } = require("../../utils/testEvalQueue");

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
    const { questions, selectedSkills: skills, questionCount } = req.body; // 👈 get from body instead of req.testDet
    const { id: userId } = req.user;

    if (!skills || !userId) {
      return res.status(400).json({
        message: "Missing required test details.",
        success: false,
      });
    }

    const parsedSkills = Array.isArray(skills) ? skills : JSON.parse(skills);
    const parsedQuestions = Array.isArray(questions)
      ? questions
      : JSON.parse(questions);

    const embeddedQuestions = parsedQuestions.map((q) => ({
      title: q.title,
      type: q.type || "code",
      codeSnippet: q.starterCode || "",
      description: q.description || "",
      difficulty: q.difficulty || "medium",
      topics: q.topicsCovered,
      sgenAnwer: q.solutionCode,
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
    const { uanswer } = req.body;
    const { t_id } = req.cookies;

    if (!t_id)
      return res.status(400).json({
        success: false,
        message: "Missing test token",
      });

    const decoded = jwt.verify(t_id, process.env.TEST_SECRET_KEY);

    const test = await TestModel.findById(decoded.test_id);
    if (!test)
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });

    // Enqueue job
    await testEvalQueue.add(
      "evaluateTest",
      { testId: test._id, uanswer },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
      }
    );

    res.clearCookie("t_id");

    return res.json({
      success: true,
      message: "Test submitted. Evaluation running in background.",
    });
  } catch (err) {
    console.error("Submit test error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// 🔧 Helper: Cookie clearing
function clearTestCookies(res, totalQuestions) {
  ["td", "t_id"].forEach((cookieName) =>
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: totalQuestions * 60 * 1000,
      ...(process.env.NODE_ENV === "production"
        ? { domain: ".skillsorbit.in" }
        : {}),
    })
  );
}

const getaTestDet = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const test = await TestModel.findOne({ _id: id, userId }).lean();

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      data: test,
    });
  } catch (err) {
    console.error("Error fetching test details:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🎯 Get Random Questions by Skill(s)
const getRandomQuestions = async (req, res) => {
  try {
    let { skills, questionCount } = req.query;

    if (!skills || !questionCount) {
      return res.status(400).json({
        success: false,
        message: "skills and questionCount are required",
      });
    }

    // Convert comma-separated → array
    const skillsArray = Array.isArray(skills) ? skills : skills.split(",");

    questionCount = Number(questionCount);

    if (isNaN(questionCount) || questionCount < 1) {
      return res.status(400).json({
        success: false,
        message: "questionCount must be a valid number",
      });
    }

    // 🎯 Random Sampling Query
    const randomQuestions = await Question.aggregate([
      { $match: { skills: { $in: skillsArray } } },

      // Shuffle & pick random X docs
      { $sample: { size: questionCount } },
    ]);

    return res.status(200).json({
      success: true,
      count: randomQuestions.length,
      questions: randomQuestions,
    });
  } catch (err) {
    console.error("Random question error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch random questions",
      error: err.message,
    });
  }
};

module.exports = {
  getAllTestScores,
  getSkillsByUserDesiredRole,
  genTest,
  testSubmit,
  getaTestDet,
  getRandomQuestions,
};
