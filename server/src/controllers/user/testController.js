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
    const { skills, questions, questionCount } = req.body; // 👈 get from body instead of req.testDet
    const { id: userId } = req.user;

    console.log(questions.length);

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
    const { uanswer, canswer, flags } = req.body;
    const { t_id: testId } = req.cookies;
    const { id } = req.user;

    // 🧩 Step 1: Validate test ID
    if (!testId) {
      return res.status(400).json({
        success: false,
        message: "Missing test ID cookie.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(testId, process.env.TEST_SECRET_KEY);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired test token.",
      });
    }

    // 🧩 Step 2: Fetch test
    const test = await TestModel.findById(decoded.test_id);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found.",
      });
    }

    // 🛡 Step 3: Prevent duplicate submissions
    if (test.testCompleted) {
      return res.status(200).json({
        success: true,
        message: "Test already submitted.",
        correctCount: test.correctCount,
        incorrectCount: test.incorrectCount,
        scorePercent: test.scorePercent,
      });
    }

    // 🚨 Step 4: Handle suspicious flags
    if (flags && flags.length) {
      test.SuspiciousFlags = Array.isArray(flags)
        ? flags
        : [String(flags) || "Auto submission due to suspicious activity"];
      test.submittedAt = new Date();
      test.testCompleted = false;
      await test.save();

      clearTestCookies(res, test.totalQuestions);

      return res.json({
        success: true,
        message: "Flagged test saved successfully.",
        flags: test.SuspiciousFlags,
      });
    }

    // 👤 Step 5: Validate user
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // 🧮 Step 6: Evaluate answers
    if (!Array.isArray(uanswer) || !Array.isArray(canswer)) {
      return res.status(400).json({
        success: false,
        message: "Invalid answers format.",
      });
    }

    let correctCount = 0;
    let incorrectCount = 0;

    uanswer.forEach((ans, idx) => {
      if (canswer[idx] && ans.code?.trim() === canswer[idx].code?.trim()) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const scorePercent = Math.round(
      (correctCount / (test.totalQuestions || 1)) * 100
    );

    // 💾 Step 7: Save results
    test.uanswer = uanswer;
    test.canswer = canswer;
    test.correctCount = correctCount;
    test.incorrectCount = incorrectCount;
    test.scorePercent = scorePercent;
    test.testCompleted = true;
    test.submittedAt = new Date();

    await test.save();

    // ✅ Optional: Update user’s verified skills if high score
    if (scorePercent >= 70 && Array.isArray(test.skills)) {
      const newSkills = test.skills.filter(
        (s) => !user.verifiedSkills.includes(s)
      );
      if (newSkills.length > 0) {
        user.verifiedSkills.push(...newSkills);
        await user.save();
      }
    }

    // 🍪 Clear test cookies
    clearTestCookies(res, test.totalQuestions);

    return res.json({
      success: true,
      message: "Test submitted successfully.",
      correctCount,
      incorrectCount,
      scorePercent,
    });
  } catch (err) {
    console.error("❌ Error submitting test:", err);
    res.status(500).json({ error: "Internal server error." });
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

module.exports = {
  getAllTestScores,
  getSkillsByUserDesiredRole,
  genTest,
  testSubmit,
  getaTestDet,
};
