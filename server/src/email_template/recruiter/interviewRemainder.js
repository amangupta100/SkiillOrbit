// email_template/interview/interviewReminderTemplate.js

const interviewReminderTemplate = (
  recipientName,
  otherPartyName,
  companyName,
  role,
  interviewDate,
  notes,
  uniqueCode,
  recipientType // 'applicant' | 'recruiter'
) => {
  const isApplicant = recipientType === "applicant";

  const greeting = `Hi ${recipientName},`;

  const reminderText = isApplicant
    ? `This is a friendly reminder about your upcoming interview.`
    : `This is a reminder about your scheduled interview with the candidate.`;

  const otherPartyLabel = isApplicant ? "Interviewer" : "Candidate";

  // Applicant joins the interview using the unique link
  const joinInterviewLink = `https://skilssorbit.in/job-seekerDashboard/interviews/${uniqueCode}`;

  // Recruiter uses dashboard (does not join)
  const recruiterLink = "https://skillsorbit.in/recruiterDashboard";

  // decide which button/link to show:
  const primaryButtonLink = isApplicant ? joinInterviewLink : recruiterLink;
  const primaryButtonText = isApplicant ? "Join Interview" : "Manage Interview";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
        <title>Interview Reminder</title>

        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            background-color: #f5f5f5;
            padding: 0;
            margin: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .header {
            background: #FF9800;
            text-align: center;
            padding: 32px;
            color: white;
          }
          .content {
            padding: 32px;
            color: #333;
          }
          .details {
            background: #fff3e0;
            border: 1px solid #ffe0b2;
            border-radius: 6px;
            padding: 20px;
            margin: 25px 0;
          }
          .details ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .details li {
            margin: 12px 0;
            padding-left: 22px;
            position: relative;
          }
          .details li:before {
            content: "⏰";
            position: absolute;
            left: 0;
            top: -3px;
            font-size: 16px;
            color: #FF9800;
          }
          .code-box {
            background: #fff3e0;
            border-left: 5px solid #FF9800;
            padding: 14px;
            margin: 18px 0;
            font-size: 15px;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            background: #FF9800;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 20px;
          }
          .footer {
            font-size: 12px;
            color: #999;
            text-align: center;
            padding: 24px;
            background: #fafafa;
          }
        </style>
      </head>

      <body>
        <div class="container">

          <!-- HEADER -->
          <div class="header">
            <img src="https://res.cloudinary.com/ddad6pdhx/image/upload/v1758799527/logo_qzuuth.png"
                 alt="SkillsOrbit Logo"
                 style="max-width: 160px;" />
            <h1 style="margin-top: 12px;">Interview Reminder</h1>
          </div>

          <!-- CONTENT -->
          <div class="content">
            <p>${greeting}</p>

            <p>${reminderText}</p>

            <!-- INTERVIEW CODE -->
            <div class="code-box">
              <strong>Interview Reference Code:</strong><br/>
              <span style="font-size: 18px; font-weight: bold; color: #E65100;">
                ${uniqueCode}
              </span>
              <br/>
              <small style="color:#555;">Use this code to join your interview.</small>
            </div>

            <!-- JOIN / MANAGE BUTTON -->
            <a class="button" href="${primaryButtonLink}">
              ${primaryButtonText}
            </a>

            <!-- DETAILS -->
            <div class="details">
              <h3 style="margin-top: 0;">Upcoming Interview Details:</h3>
              <ul>
                <li><strong>Date & Time:</strong> ${interviewDate}</li>
                <li><strong>Role:</strong> ${role}</li>
                <li><strong>Company:</strong> ${companyName}</li>
                <li><strong>${otherPartyLabel}:</strong> ${otherPartyName}</li>
              </ul>

              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
            </div>

            <p>
              Ensure you're prepared and able to join on time.<br/>
             
            </p>
          </div>

          <!-- FOOTER -->
          <div class="footer">
            SkillsOrbit — Smarter Hiring. Less Effort.<br/>
            © ${new Date().getFullYear()} SkillsOrbit Inc.
          </div>

        </div>
      </body>
    </html>
  `;
};

module.exports = { interviewReminderTemplate };
