const { Worker } = require("bullmq");
const { connection } = require("../../utils/testEvalQueue");
const TestModel = require("../../models/TestModel");
const UserModel = require("../../models/UserModel");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { sendResultEmail } = require("../../controllers/user/sendMailContr");
const { TEST_EVAL_QUEUE_NAME } = require("../../utils/testEvalQueue");

const worker = new Worker(
  TEST_EVAL_QUEUE_NAME,
  async (job) => {
    const { testId, uanswer } = job.data;

    console.log("🚀 Worker started for", testId);

    const test = await TestModel.findById(testId);
    if (!test) throw new Error("❌ Test not found");

    const user = await UserModel.findById(test.userId);
    if (!user) throw new Error("❌ User not found");

    const questions = test.questions;

    // -----------------------------------------
    // Create dataset for AI
    // -----------------------------------------
    const combined = questions.map((q, i) => ({
      question: {
        title: q.title,
        description: q.description,
        starterCode: q.codeSnippet,
      },
      userAnswer: uanswer[i]?.code || "",
    }));

    // -----------------------------------------
    // AI: Generate correct answers + evaluate
    // -----------------------------------------

    console.log("🤖 Running evaluation and cAnswer generation...");

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are a MASTER Senior Debugging Evaluator.

You must:
1. Read the question description
2. Understand the intended correct behavior
3. Generate the CORRECT final answer (fully working version)
4. Evaluate the user's answer strictly
5. No partial credit — answer must be fully correct

RETURN STRICT JSON ONLY:
{
  "evaluation": [
    {
      "correctAnswer": "",
      "isCorrect": true/false,
      "reason": ""
    }
  ],
  "correctCount": 0,
  "incorrectCount": 0,
  "scorePercent": 0
}

DATA:
${JSON.stringify(combined, null, 2)}
`;

    let result = await model.generateContent(prompt);
    let text = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    let evaluationJSON;
    try {
      evaluationJSON = JSON.parse(text);
    } catch (err) {
      console.log("⚠ JSON Parse FAILED. Using fallback evaluation.");
      evaluationJSON = {
        evaluation: questions.map((q) => ({
          correctAnswer: "",
          isCorrect: false,
          reason: "AI parsing failed",
        })),
        correctCount: 0,
        incorrectCount: questions.length,
        scorePercent: 0,
      };
    }

    const { evaluation, correctCount, incorrectCount, scorePercent } =
      evaluationJSON;

    // Extract correctAnswers separately
    const generatedCorrectAnswers = evaluation.map((ev) => ({
      correctAnswer: ev.correctAnswer,
      reason: ev.reason,
    }));

    // -----------------------------------------
    // Save into DB
    // -----------------------------------------
    test.uanswer = uanswer;
    test.cAnswer = generatedCorrectAnswers; // ⭐ STORE AI-GENERATED CORRECT ANSWERS
    test.correctCount = correctCount;
    test.incorrectCount = incorrectCount;
    test.scorePercent = scorePercent;
    test.testCompleted = true;
    test.submittedAt = new Date();
    await test.save();

    // -----------------------------------------
    // Update verified skills
    // -----------------------------------------
    if (scorePercent >= 70) {
      const newSkills = test.skills.filter(
        (s) => !user.verifiedSkills.includes(s)
      );
      if (newSkills.length) {
        user.verifiedSkills.push(...newSkills);
        await user.save();
      }
    }

    // -----------------------------------------
    // Send Result Email
    // -----------------------------------------
    const mailStatus = await sendResultEmail(
      user.fullname || user.name || "Candidate",
      user.email,
      test.skills.join(", ")
    );

    console.log("📬 Email Status:", mailStatus);

    console.log("🎉 Evaluation done. Email sent. Correct answers saved.");
  },
  {
    connection,
    concurrency: 1,
  }
);

// Logs
worker.on("ready", () =>
  console.log("🟢 Worker listening:", TEST_EVAL_QUEUE_NAME)
);
worker.on("completed", (job) => console.log(`✅ Job completed: ${job.id}`));
worker.on("failed", (job, err) => console.log(`❌ Job failed: ${job.id}`, err));

module.exports = worker;
