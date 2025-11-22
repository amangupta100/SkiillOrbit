// workers/interviewReminderWorker.js (full updated file)
const { Worker } = require("bullmq");
const { connection, REMINDER_QUEUE } = require("../utils/queue");
const Interview = require("../models/InterviewSchema");
const JobModel = require("../models/JobModel");
const InternshipModel = require("../models/InternshipModel"); // ✅ Correct import
const UserModel = require("../models/UserModel");
const RecruiterModel = require("../models/RecruiterModel");
const { format } = require("date-fns");
const {
  interviewReminderTemplate,
} = require("../email_template/recruiter/interviewRemainder");
const { sendEmail } = require("../controllers/recruiter/sendMailContr");

// Create worker
const worker = new Worker(
  REMINDER_QUEUE,
  async (job) => {
    const { interviewId } = job.data;

    if (!interviewId) throw new Error("Missing interviewId in job");

    // Fetch interview and populate
    const iv = await Interview.findById(interviewId)
      .populate("applicantId", "name email")
      .populate("recruiterId", "name email")
      .lean();

    if (!iv) throw new Error("Interview not found: " + interviewId);
    if (iv.reminderSent) {
      return { skipped: "already sent" };
    }

    // Atomic claim (unchanged)
    const claimed = await Interview.findOneAndUpdate(
      { _id: iv._id, reminderSent: false },
      {
        $set: {
          reminderSent: true,
          reminderJobScheduled: false,
          reminderJobId: null,
        },
      },
      { new: true }
    );

    if (!claimed) {
      return { skipped: "claimed by other process" };
    }

    // 🚨 UPDATED: Fetch posting with logs & fallback
    let posting = null;
    let role = "Interview Role"; // 🚨 Fallback
    let companyName = "Your Company"; // 🚨 Fallback

    const postingType = (iv.postingType || "").toLowerCase();
    const postingId = iv.postingId;

    if (postingType === "job") {
      posting = await JobModel.findById(postingId)
        .populate("company", "name")
        .lean();
    } else if (postingType === "internship") {
      // 🚨 Explicit check (was 'else')
      posting = await InternshipModel.findById(postingId)
        .populate("company", "name")
        .lean();
    } else {
      console.warn(
        `⚠️ Invalid postingType "${postingType}" for interview ${interviewId} — using fallback`
      );
    }

    if (posting) {
      role = posting.role || role;
      companyName = posting.company ? posting.company.name : companyName;
    }

    // Proceed to emails/notifs regardless (no early return!)
    const formattedDate = format(new Date(iv.interviewDate), "PPP p");
    const notes = iv.notes || "";
    const code = iv.uniqueCode || "";

    const applicant = iv.applicantId;
    const recruiter = iv.recruiterId;

    // Send emails (parallel) — now always runs
    try {
      const htmlApplicant = interviewReminderTemplate(
        applicant.name,
        recruiter.name,
        companyName,
        role,
        formattedDate,
        notes,
        code,
        "applicant"
      );
      const htmlRecruiter = interviewReminderTemplate(
        recruiter.name,
        applicant.name,
        companyName,
        role,
        formattedDate,
        notes,
        code,
        "recruiter"
      );

      const results = await Promise.allSettled([
        sendEmail({
          to: applicant.email,
          subject: `Reminder: Interview in ${
            process.env.REMINDER_MINUTES || 60
          } minutes — ${role}`,
          html: htmlApplicant,
        }),
        sendEmail({
          to: recruiter.email,
          subject: `Reminder: Interview with ${applicant.name} in ~${
            process.env.REMINDER_MINUTES || 60
          } minutes — ${role}`,
          html: htmlRecruiter,
        }),
      ]);

      // 🚨 NEW: Log email results
      results.forEach((result, idx) => {
        if (result.status === "rejected")
          console.error(
            `❌ Email ${idx === 0 ? "applicant" : "recruiter"} failed:`,
            result.reason
          );
      });
    } catch (err) {
      console.error(
        "Failed sending reminder emails for interview:",
        interviewId,
        err
      );
    }

    // Push notifications (always runs)
    const REMINDER_MINUTES = process.env.REMINDER_MINUTES || 60;
    const notifForApplicant = {
      type: "INTERVIEW_REMINDER",
      title: "Interview Reminder",
      message: `Your interview for ${role} at ${companyName} is in ~${REMINDER_MINUTES} minutes (${formattedDate}).`,
      meta: { interviewId: iv._id },
      read: false,
      createdAt: new Date(),
    };
    const notifForRecruiter = {
      type: "INTERVIEW_REMINDER",
      title: "Interview Reminder",
      message: `Interview with ${applicant.name} for ${role} is in ~${REMINDER_MINUTES} minutes (${formattedDate}).`,
      meta: { interviewId: iv._id, applicantId: applicant._id },
      read: false,
      createdAt: new Date(),
    };

    const notifResults = await Promise.allSettled([
      UserModel.findByIdAndUpdate(applicant._id, {
        $push: { notifications: notifForApplicant },
      }),
      RecruiterModel.findByIdAndUpdate(recruiter._id, {
        $push: { notifications: notifForRecruiter },
      }),
    ]);

    // 🚨 NEW: Log notif results
    notifResults.forEach((result, idx) => {
      if (result.status === "rejected")
        console.error(
          `❌ Notif ${idx === 0 ? "applicant" : "recruiter"} failed:`,
          result.reason
        );
    });

    return { ok: true };
  },
  {
    connection,
    concurrency: Number(process.env.WORKER_CONCURRENCY || 3),
  }
);

// Event listeners (unchanged)
worker.on("ready", () => {
  console.log("🟢 Reminder Worker is ready and listening to", REMINDER_QUEUE);
});
worker.on("error", (err) => {
  console.error("🔴 Worker error:", err);
});
worker.on("completed", (job) => {
  console.log("Reminder job completed:", job.id);
});
worker.on("failed", (job, err) => {
  console.error("Reminder job failed:", job.id, err);
});

module.exports = worker; // 🚨 NEW: Export if needed for testing
