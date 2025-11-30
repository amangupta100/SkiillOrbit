// email_template/interview/interviewScheduledTemplate.js

const interviewScheduledTemplate = (
  applicantName,
  recruiterName,
  companyName,
  role,
  interviewDate,
  notes,
  uniqueCode
) => {
  const joinInterviewLink = `https://job-seekerDashboard/interviews/${uniqueCode}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
        <title>Interview Scheduled</title>
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
            background: #4CAF50;
            text-align: center;
            padding: 32px;
            color: white;
          }
          .content {
            padding: 32px;
            color: #333;
          }
          .details {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 20px;
            margin: 25px 0;
          }
          .details ul {
            list-style: none;
            padding: 0;
          }
          .details li {
            margin: 12px 0;
            padding-left: 22px;
            position: relative;
          }
          .details li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #4CAF50;
            font-size: 20px;
            top: -3px;
          }
          .code-box {
            background: #eef7ee;
            border-left: 5px solid #4CAF50;
            padding: 14px;
            margin: 18px 0;
            font-size: 15px;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            background: #4CAF50;
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
          
          <!-- Header -->
          <div class="header">
            <img
              src="https://res.cloudinary.com/ddad6pdhx/image/upload/v1764000861/skillsorbit_logo_kvqgee.png"
              alt="SkillsOrbit Logo"
              style="max-width: 160px;"
            />
            <h1 style="margin-top: 12px;">Interview Scheduled</h1>
          </div>

          <!-- Content Section -->
          <div class="content">
            <p>Hi <strong>${applicantName}</strong>,</p>

            <p>
              Your interview for the <strong>${role}</strong> position at 
              <strong>${companyName}</strong> has been successfully scheduled.
            </p>

            <!-- Interview Code -->
            <div class="code-box">
              <strong>Interview Room Code:</strong><br/>
              <span style="font-size: 18px; font-weight: bold; color: #2E7D32;">
                ${uniqueCode}
              </span>
              <br/>
              <small style="color:#555;">Use this code for joining to join interview session.</small>
            </div>

            <!-- Join Interview -->
            <p>
              You can join your interview using the button below or by visiting your dashboard.
            </p>

            <a class="button" href="https://skillsorbit.in/job-seekerDashboard/interviews/${uniqueCode}">
              Join Interview
            </a>

            <!-- Interview Details -->
            <div class="details">
              <h3 style="margin-top: 0;">Interview Details</h3>
              <ul>
                <li><strong>Date & Time:</strong> ${interviewDate}</li>
                <li><strong>Role:</strong> ${role}</li>
                <li><strong>Company:</strong> ${companyName}</li>
                <li><strong>Interviewer:</strong> ${recruiterName}</li>
              </ul>

              ${
                notes
                  ? `<p><strong>Additional Notes:</strong> ${notes}</p>`
                  : ""
              }
            </div>

            <p>
              Please prepare accordingly and join on time. If you have any questions,
              simply reply to this email and our team will assist you.
            </p>

            <a class="button" href="https://skillsorbit.in/applicantDashboard">
              View Interview Details
            </a>
          </div>

          <!-- Footer -->
          <div class="footer">
            SkillsOrbit — Smarter Hiring. Less Effort.<br/>
            © ${new Date().getFullYear()} SkillsOrbit Inc.
          </div>

        </div>
      </body>
    </html>
  `;
};

module.exports = { interviewScheduledTemplate };
