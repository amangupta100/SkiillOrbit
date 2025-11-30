// controllers/sendEmailController.js
const nodemailer = require("nodemailer");
const { format } = require("date-fns");

const Interview = require("../../models/InterviewSchema");

const {
  interviewReminderTemplate,
} = require("../../email_template/recruiter/interviewRemainder");
const {
  interviewScheduledTemplate,
} = require("../../email_template/recruiter/interviewScheduled");
const {
  applicationStatusTemplate,
} = require("../../email_template/recruiter/applicationStatusTemplate");
const { greetRecruiter } = require("../../email_template/recruiter/welcome");
const {
  shortlistedTemplate,
} = require("../../email_template/recruiter/shortlistedTemplate");

const { reminderQueue } = require("../../utils/queue");

// --------------------
// Transporter (use env vars)
const SMTP_USER = process.env.SMTP_USER || "skillorbit01@gmail.com";
const SMTP_PASS = process.env.SMTP_PASS || "kyst ovep ombh toph";

const transport = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || "gmail",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Generic sendEmail helper
const sendEmail = async ({ to, subject, html, text = "" }) => {
  try {
    await transport.sendMail({
      from: `${process.env.EMAIL_FROM_NAME || "SkillsOrbit"} <${SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return { success: true };
  } catch (err) {
    console.error(`Email send failed to ${to}:`, err);
    return { success: false, error: err.message };
  }
};

// --------------------
// scheduleReminderJob(interviewDoc)
// - Accepts either interview document or an object with required fields.
// - Adds a delayed job to run at interviewDate - REMINDER_MINUTES.
// - Saves job.id into interview.reminderJobId and sets reminderJobScheduled=true
const REMINDER_MINUTES = Number(process.env.REMINDER_MINUTES || 90);

async function scheduleReminderJob(interview) {
  // interview can be mongoose doc or plain object with interviewDate and _id
  try {
    const interviewId = interview._id?.toString() || interview.interviewId;
    const interviewDate = interview.interviewDate
      ? new Date(interview.interviewDate)
      : null;
    if (!interviewId || !interviewDate) {
      throw new Error("Invalid interview data for scheduling reminder");
    }

    const msUntilReminder =
      interviewDate.getTime() - Date.now() - REMINDER_MINUTES * 60 * 1000;
    const delay = Math.max(0, msUntilReminder);

    const payload = {
      interviewId,
      // pass minimal data; worker will re-fetch latest interview
    };

    const job = await reminderQueue.add("sendInterviewReminder", payload, {
      delay,
      attempts: 5,
      backoff: { type: "exponential", delay: 60000 },
      removeOnComplete: true,
      removeOnFail: false,
    });

    // persist job id in interview doc if possible
    try {
      await Interview.findByIdAndUpdate(interviewId, {
        reminderJobScheduled: true,
        reminderJobId: job.id,
      });
    } catch (e) {
      console.warn("Failed to persist reminderJobId on interview:", e.message);
    }

    return { success: true, jobId: job.id };
  } catch (err) {
    console.error("Failed to schedule reminder job:", err);
    return { success: false, error: err.message };
  }
}

// cancel job by jobId (or by interview id)
async function cancelReminderJobByJobId(jobId) {
  try {
    if (!jobId) throw new Error("jobId required");
    const job = await reminderQueue.getJob(jobId);
    if (job) await job.remove();
    return { success: true };
  } catch (err) {
    console.error("Failed to cancel reminder job:", err);
    return { success: false, error: err.message };
  }
}

async function cancelReminderJobByInterviewId(interviewId) {
  try {
    const interview = await Interview.findById(interviewId).lean();
    if (!interview) throw new Error("Interview not found");
    if (interview.reminderJobId) {
      await cancelReminderJobByJobId(interview.reminderJobId);
      await Interview.findByIdAndUpdate(interviewId, {
        reminderJobScheduled: false,
        reminderJobId: null,
      });
    }
    return { success: true };
  } catch (err) {
    console.error("Failed to cancel reminder job by interview id:", err);
    return { success: false, error: err.message };
  }
}

// reschedule: remove old job + create new scheduled job
async function rescheduleReminderJob(interview) {
  try {
    // cancel existing job (if any)
    const existing = await Interview.findById(interview._id).lean();
    if (existing?.reminderJobId) {
      await cancelReminderJobByJobId(existing.reminderJobId);
    }
    // schedule anew
    return await scheduleReminderJob(interview);
  } catch (err) {
    console.error("Failed to reschedule reminder job:", err);
    return { success: false, error: err.message };
  }
}

const greetRecCont = async (name, email) => {
  try {
    await transport.sendMail({
      from: "SkillsOrbit",
      to: `${email}`,
      subject: "Welcome to SkillsOrbit 🎉",
      text: `Hi ${name},\n\nWelcome to SkillsOrbit`,
      html: greetRecruiter.replace("{{ .Candidate_Name}}", name),
    });
    return { success: true, message: "Welcome email sent successfully" };
  } catch (err) {
    console.error("Error sending recruiter greeting:", err);
    return { success: false, message: "Email not sent" };
  }
};

const applicationStatusUpdate = async (
  email,
  name,
  jobRole,
  status,
  recruiterName,
  companyName
) => {
  try {
    const html = applicationStatusTemplate(
      name,
      jobRole,
      status,
      recruiterName,
      companyName
    );
    await sendEmail({
      to: email,
      subject: `Application Status Update for ${jobRole}`,
      html,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const sendShortlistEmail = async (
  applicantEmail,
  applicantName,
  companyName,
  role
) => {
  try {
    const html = shortlistedTemplate(applicantName, companyName, role);
    await sendEmail({
      to: applicantEmail,
      subject: `You've been shortlisted for ${role} at ${companyName}! 🎉`,
      html,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const sendInterviewScheduledEmail = async (
  applicantEmail,
  applicantName,
  recruiterName,
  companyName,
  role,
  interviewDate,
  notes,
  uniqueCode
) => {
  try {
    const formattedDate = new Date(interviewDate).toLocaleString();
    const html = interviewScheduledTemplate(
      applicantName,
      recruiterName,
      companyName,
      role,
      formattedDate,
      notes,
      uniqueCode
    );
    await sendEmail({
      to: applicantEmail,
      subject: `Interview Scheduled for ${role} at ${companyName}`,
      html,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const sendInterviewReminderEmail = async (
  applicantEmail,
  applicantName,
  recruiterEmail,
  recruiterName,
  companyName,
  role,
  interviewDate,
  notes,
  uniqueCode
) => {
  try {
    const formattedDate = new Date(interviewDate).toLocaleString();
    const htmlApplicant = interviewReminderTemplate(
      applicantName,
      recruiterName,
      companyName,
      role,
      formattedDate,
      notes,
      uniqueCode || "",
      "applicant"
    );
    const htmlRecruiter = interviewReminderTemplate(
      recruiterName,
      applicantName,
      companyName,
      role,
      formattedDate,
      notes,
      uniqueCode || "",
      "recruiter"
    );

    // send applicant + recruiter in parallel
    await Promise.all([
      sendEmail({
        to: applicantEmail,
        subject: `Reminder: Interview for ${role} in ${REMINDER_MINUTES} Minutes`,
        html: htmlApplicant,
      }),
      sendEmail({
        to: recruiterEmail,
        subject: `Reminder: Upcoming Interview for ${role} in ${REMINDER_MINUTES} Minutes`,
        html: htmlRecruiter,
      }),
    ]);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// Export
module.exports = {
  sendEmail,
  greetRecCont,
  applicationStatusUpdate,
  sendShortlistEmail,
  sendInterviewReminderEmail,
  sendInterviewScheduledEmail,
  // helpers
  scheduleReminderJob,
  cancelReminderJobByJobId,
  cancelReminderJobByInterviewId,
  rescheduleReminderJob,
};
