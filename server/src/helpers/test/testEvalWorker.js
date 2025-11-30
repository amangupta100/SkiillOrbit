const { Worker } = require("bullmq");
const { connection } = require("../../utils/testEvalQueue");
const TestModel = require("../../models/TestModel");
const UserModel = require("../../models/UserModel");
const QuestionModel = require("../../models/QuestionModel");
const { GoogleGenAI } = require("@google/genai"); // ← Updated import for new SDK
const { sendResultEmail } = require("../../controllers/user/sendMailContr");
const { TEST_EVAL_QUEUE_NAME } = require("../../utils/testEvalQueue");

/**
 * ================================================================
 *  🔥 Gemini AI Runner With Multi-Key Failover (1 → 5)
 * ================================================================
 */
async function runGeminiWithFailover(prompt) {
  const keys = [
    process.env.GOOGLE_API_KEY, // primary
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3,
    process.env.GEMINI_API_KEY4,
    process.env.GEMINI_API_KEY5, // last fallback
  ];

  let lastError = null;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!key) continue; // skip missing env keys

    try {
      console.log(`🔑 Trying Gemini Key #${i + 1}`);

      const ai = new GoogleGenAI({ apiKey: key }); // ← Pass key via options

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // ← Updated to latest stable model
        contents: prompt, // ← Simplified: string prompt (array also works)
        config: {
          // ← Use 'config' key (camelCase for responseMimeType)
          responseMimeType: "application/json", // ← CamelCase, no snake_case
        },
      });

      let jsonText = response.text; // ← Plain JSON string

      if (!jsonText) {
        throw new Error(`Empty AI response using key #${i + 1}`);
      }

      // Failsafe: Strip common markdown wrappers (e.g., ```json ... ```) if present
      jsonText = jsonText
        .replace(/```json\s*/g, "")
        .replace(/```\s*$/gm, "")
        .trim();

      // SUCCESS
      console.log(`✅ Key #${i + 1} SUCCESS`);
      return JSON.parse(jsonText);
    } catch (err) {
      console.log(`❌ Key #${i + 1} FAILED → ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini keys failed");
}

// ========================================================================
//                               MAIN WORKER
// ========================================================================
const worker = new Worker(
  TEST_EVAL_QUEUE_NAME,
  async (job) => {
    const { testId, uanswer } = job.data;
    console.log("🚀 Worker started for", testId);

    const test = await TestModel.findById(testId);
    if (!test) throw new Error("❌ Test not found");

    const user = await UserModel.findById(test.userId);
    if (!user) throw new Error("❌ User not found");

    const questions = await QuestionModel.find({
      _id: { $in: test.questions },
    });

    if (!questions.length) throw new Error("❌ No questions found");

    // Build dataset for AI
    const combined = questions.map((q, i) => ({
      question: {
        title: q.title,
        description: q.description,
        starterCode: q.starterCode || "",
      },
      userAnswer: uanswer[i]?.code || "",
    }));

    const prompt = `
You are a strict senior evaluator. Your task is to evaluate the user's code against each question and generate the exact correct code solution for that specific question.

CRITICAL RULES:
- Evaluate ONE question at a time based on its title, description, and starterCode.
- "correctAnswer": ALWAYS output the FULL, COMPLETE, EXECUTABLE that SOLVES the EXACT problem described in the title and description. Use the provided starterCode as a base (extend/complete/fix it if incomplete), and incorporate relevant fixes from the userAnswer if they add value. Format as a plain indented string (no markdown fences, no triple quotes, no explanations inside the code).
- "isCorrect": true ONLY if the user's code is functionally identical to your generated correctAnswer (ignore minor whitespace/formatting; flag logic errors, missing imports, syntax issues).
- "reason": Brief (1-2 sentences) explanation of correctness/incorrectness, referencing SPECIFIC code differences or fixes in the correctAnswer.
- No partial credit: If the code doesn't fully solve the problem, isCorrect = false.
- Output ONLY valid JSON—no prose, no code blocks.

EXAMPLE OUTPUT FORMAT (adapt to the data):
{
  "evaluation": [
    {
      "correctAnswer": "# imports\\nfrom django.db import models\\n\\nclass MyModel(models.Model):\\n    name = models.CharField(max_length=100)\\n    \\ndef view_function(request):\\n    obj = MyModel.objects.create(name='test')\\n    return render(request, 'template.html', {'obj': obj})",
      "isCorrect": false,
      "reason": "User missed the model definition and used incorrect import; correctAnswer adds proper CharField and create logic based on the problem's description of needing a basic model with name field."
    }
  ],
  "correctCount": 1,
  "incorrectCount": 0,
  "scorePercent": 100
}

DATA (array of {question: {title, description, starterCode}, userAnswer: string}):
${JSON.stringify(combined)}
`;

    // ======================================================================
    //                             RUN AI WITH FAILOVER
    // ======================================================================
    let evaluationJSON = null;

    try {
      evaluationJSON = await runGeminiWithFailover(prompt);
    } catch (err) {
      console.log("⚠ All Gemini keys failed → FAILSAFE ACTIVATED");

      evaluationJSON = {
        evaluation: questions.map((q, i) => ({
          correctAnswer:
            q.starterCode || "No solution available due to AI failure.",
          isCorrect: false,
          reason: "AI evaluation failed; using starter code as fallback.",
        })),
        correctCount: 0,
        incorrectCount: questions.length,
        scorePercent: 0,
      };
    }

    const { evaluation, correctCount, incorrectCount, scorePercent } =
      evaluationJSON;

    // ======================================================================
    //                     STRUCTURE USER + CORRECT ANSWERS
    // ======================================================================
    const cleanedUserAnswers = uanswer.map((ans, i) => ({
      code: ans.code || "",
      isCorrect: evaluation[i]?.isCorrect || false,
    }));

    const cleanedCorrectAnswers = evaluation.map((ev) => ({
      correctAnswer: ev.correctAnswer || "",
      reason: ev.reason || "",
    }));

    // ======================================================================
    //                             SAVE INTO DB
    // ======================================================================
    test.uanswer = cleanedUserAnswers;
    test.cAnswer = cleanedCorrectAnswers;
    test.correctCount = correctCount;
    test.incorrectCount = incorrectCount;
    test.scorePercent = scorePercent;
    test.testCompleted = true;
    test.submittedAt = new Date();
    await test.save();

    // Update verified skills
    if (scorePercent >= 70) {
      const newlyVerified = test.skills.filter(
        (s) => !user.verifiedSkills.includes(s)
      );
      if (newlyVerified.length) {
        user.verifiedSkills.push(...newlyVerified);
        await user.save();
      }
    }

    // Send results email
    await sendResultEmail(
      user.fullname || user.name || "Candidate",
      user.email,
      test.skills.join(", ")
    );

    console.log("🎉 Test evaluation complete for", testId);
  },
  {
    connection,
    concurrency: 1,
  }
);

// Worker logs
worker.on("ready", () =>
  console.log("🟢 Worker listening:", TEST_EVAL_QUEUE_NAME)
);
worker.on("completed", (job) => console.log(`✅ Job complete: ${job.id}`));
worker.on("failed", (job, err) => console.log(`❌ Job failed: ${job.id}`, err));

module.exports = worker;
