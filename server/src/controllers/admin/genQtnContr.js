const { GoogleGenerativeAI } = require("@google/generative-ai");
const Question = require("../../models/QuestionModel");
const { genQtnQueueMain } = require("../../utils/genQtnsQueue");

// ------------------------------------------
// DETECT QUESTION TYPE BASED ON DOMAIN
// ------------------------------------------
function getPromptTypeByDomain(domain = "") {
  const debuggingDomains = [
    "software",
    "engineer",
    "developer",
    "cloud",
    "aws",
    "azure",
    "gcp",
    "devops",
    "infrastructure",
    "linux",
    "data",
    "ml",
    "ai",
    "testing",
    "qa",
    "cyber",
    "security",
  ];

  const lower = domain.toLowerCase();
  if (debuggingDomains.some((d) => lower.includes(d))) return "debugging";

  return "scenario"; // fallback for PM, business, HR, etc.
}

// ------------------------------------------
// BUILD PROMPT BASED ON CATEGORY
// ------------------------------------------
function buildPrompt({ parsedSkills, questionCount, difficulty, domain }) {
  const type = getPromptTypeByDomain(domain);

  if (type === "debugging") {
    return `
You are a senior technical interviewer.

Generate ${questionCount} UNIQUE debugging questions.
Skills: ${parsedSkills.join(", ")}
Domain: ${domain}
Difficulty: ${difficulty}

RULES FOR QUESTION TYPES:
- For AWS/Cloud/DevOps:
  • AWS CLI debugging
  • EC2, IAM, VPC, S3, Lambda issues
  • CloudWatch log debugging
  • Shell/terminal command failures
  • Permission/role mistakes
  
- For Software Engineering:
  • Logical bugs
  • Wrong outputs
  • Hidden edge case failures
  • Performance bugs
  • Real-world debugging tasks

- For Cybersecurity:
  • Firewall rule misconfig
  • Log anomaly debugging
  • Attack/traffic pattern debugging

- For Data/ML:
  • Pipeline debugging
  • Wrong model output
  • Data transformation issues

DIFFICULTY LEVEL RULES:
EASY → simple syntax or small mistakes  
MEDIUM → tricky behavior, logic errors  
HARD → multi-step flow debugging  
EXPERT → deep knowledge + performance implications  

OUTPUT FORMAT (MANDATORY):
{
  "questions": [
    {
      "title": "",
      "description": "",
      "difficulty": "${difficulty}",
      "topicsCovered": [],
      "starterCode": "",
      "solutionCode": "",
      "tags": []
    }
  ]
}

STRICT RULES:
- NO serialNumber
- NO skills field (we set it manually)
- NO markdown or code fences
- ONLY return pure JSON
`;
  }

  // -------------------------
  // SCENARIO BASED QUESTIONS
  // -------------------------
  return `
You are a senior interviewer.

Generate ${questionCount} SCENARIO-BASED questions.
Skills: ${parsedSkills.join(", ")}
Domain: ${domain}
Difficulty: ${difficulty}

These must test:
- problem reasoning
- decision making
- ambiguous real-world challenges
- prioritization
- troubleshooting without code
- operational thinking

If domain is non-technical:
- No debugging required
- Turn tasks into scenario questions
- Include realistic constraints

OUTPUT FORMAT:
{
  "questions": [
    {
      "title": "",
      "description": "",
      "difficulty": "${difficulty}",
      "topicsCovered": [],
      "starterCode": "",
      "solutionCode": "",
      "tags": []
    }
  ]
}

STRICT RULES:
- NO serialNumber
- NO markdown
- NO extra fields
- ONLY pure JSON
`;
}

// ------------------------------------------
// INSTANT QUESTION GENERATION
// ------------------------------------------
const generateQuestionsInstantly = async (req, res) => {
  try {
    const { skills, questionCount, difficulty, domain } = req.body;

    if (!skills || !questionCount || !difficulty || !domain) {
      return res.status(400).json({
        success: false,
        message: "skills, difficulty, questionCount and domain required",
      });
    }

    const parsedSkills = Array.isArray(skills) ? skills : skills.split(",");
    const allowedDiff = ["easy", "medium", "hard", "expert"];

    if (!allowedDiff.includes(difficulty)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid difficulty" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = buildPrompt({
      parsedSkills,
      questionCount,
      difficulty,
      domain,
    });

    const result = await model.generateContent(prompt);
    let responseText = result?.response
      ?.text?.()
      .replace(/```json|```/g, "")
      .trim();
    const parsed = JSON.parse(responseText);

    const formattedQuestions = parsed.questions.map((q) => {
      const { serialNumber, skills: aiSkills, ...rest } = q;
      return { ...rest, difficulty, skills: parsedSkills };
    });

    const saved = [];
    for (const q of formattedQuestions) {
      const doc = new Question(q);
      await doc.save();
      saved.push(doc);
    }

    return res.status(200).json({
      success: true,
      message: "Questions generated successfully",
      data: saved,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Generation failed",
      error: err.message,
    });
  }
};

// ------------------------------------------
// SCHEDULED GENERATION
// ------------------------------------------
const scheduleQuestionGeneration = async (req, res) => {
  try {
    const { skills, questionCount, difficulty, scheduleAt, domain } = req.body;

    if (!skills || !questionCount || !difficulty || !scheduleAt || !domain) {
      return res.status(400).json({
        success: false,
        message:
          "skills, difficulty, questionCount, domain and scheduleAt required",
      });
    }

    const parsedSkills = Array.isArray(skills) ? skills : skills.split(",");
    const delay = new Date(scheduleAt).getTime() - Date.now();

    if (delay < 0) {
      return res.status(400).json({
        success: false,
        message: "Schedule time must be in future",
      });
    }

    const job = await genQtnQueueMain.add(
      "genQuestionQueue",
      { skills: parsedSkills, questionCount, difficulty, domain },
      {
        delay,
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Generation scheduled",
      jobId: job.id,
      scheduledFor: scheduleAt,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to schedule generation",
      error: err.message,
    });
  }
};

const getQuestionsBySkill = async (req, res) => {
  try {
    let { skill, page = 1, limit = 20 } = req.query;

    if (!skill) {
      return res.status(400).json({
        success: false,
        message: "Skill is required",
      });
    }

    const skillsArray = skill.split(",");
    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    // Fetch paginated questions
    const questions = await Question.find({
      skills: { $in: skillsArray },
    })
      .sort({ serialNumber: 1 }) // ASC
      .skip(skip)
      .limit(limit);

    const total = await Question.countDocuments({
      skills: { $in: skillsArray },
    });

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      questions,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
      error: err.message,
    });
  }
};

const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: question,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to get question",
      error: err.message,
    });
  }
};

module.exports = {
  scheduleQuestionGeneration,
  generateQuestionsInstantly,
  getQuestionsBySkill,
  getQuestionById,
};
