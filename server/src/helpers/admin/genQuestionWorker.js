const { Worker } = require("bullmq");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { connection, genQtnQueue } = require("../../utils/genQtnsQueue");
const Question = require("../../models/QuestionModel");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const worker = new Worker(
  genQtnQueue,
  async (job) => {
    const { skills, questionCount, difficulty } = job.data;

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are a senior technical interviewer. Generate ${questionCount} **unique, non-repetitive debugging questions**
strictly based on the following skills: ${skills.join(", ")}.

The questions must match this difficulty level: **"${difficulty}"**.

Follow the difficulty rules:

EASY →  
- Simple syntax issues  
- Basic debugging  

MEDIUM →  
- Conceptual errors  
- Tricky debugging situations  
- Misunderstood behaviors  
- Logical bugs  
- Common real-world mistakes  
- Moderate starter code (20–35 lines)

HARD →  
- Deep internal behavior  
- Multi-step reasoning bugs  
- Complex code flow  
- Hard to detect mistakes  
- Larger starter code (30–45 lines)
- Include Advanced Concepts

EXPERT →  
- Advanced performance optimization  
- Complex code (30–60 lines)
- Include most advanced concepts

OUTPUT RULES:
- Each question MUST be **new and unique**, not similar to previous ones.
- Questions should be realistic and reflect real engineering debugging scenarios.
- Every question MUST be JSON in this exact structure:
{
  "title": "",
  "description": "",
  "difficulty": "${difficulty}",
  "topicsCovered": [],
  "starterCode": "",
  "solutionCode": "",
  "tags": []
}

STRICT RULES:
- DO NOT include serialNumber.
- DO NOT include skills (we will set them manually).
- DO NOT include markdown or code fences.
- DO NOT include extra fields.

Return ONLY valid JSON exactly in this format:
{
  "questions": [ ... ]
}
`;

    const result = await model.generateContent(prompt);
    let text = result?.response?.text?.();
    text = text.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(text);
    const questions = parsed.questions || [];

    const formattedQuestions = questions.map((q) => ({
      ...q,
      difficulty,
      skills,
    }));

    for (const q of formattedQuestions) {
      const doc = new Question(q);
      await doc.save();
    }

    return { count: formattedQuestions.length };
  },
  {
    connection,
    concurrency: Number(process.env.WORKER_CONCURRENCY || 3),
  }
);

// Event listeners (unchanged)
worker.on("ready", () => {
  console.log("🟢 Question Worker is ready and listening to", genQtnQueue);
});
worker.on("error", (err) => {
  console.error("🔴 Worker error:", err);
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed`, err);
});

module.exports = worker;
