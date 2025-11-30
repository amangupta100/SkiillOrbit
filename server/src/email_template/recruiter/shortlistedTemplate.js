const shortlistedTemplate = (applicantName, companyName, role) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Shortlisted Notification</title>
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
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }
      .header {
        background: #111827;
        color: white;
        padding: 24px;
        text-align: center;
      }
      .header img {
        max-width: 120px;
        margin-bottom: 16px;
      }
      .content {
        padding: 20px;
        color: #333;
        line-height: 1.6;
      }
      .highlight {
        color: #2A956B;
        font-weight: 600;
      }
      .button {
        display: inline-block;
        background: #2A956B;
        color: white;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 4px;
        margin-top: 20px;
      }
      .footer {
        font-size: 12px;
        color: #999;
        text-align: center;
        padding: 24px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://res.cloudinary.com/ddad6pdhx/image/upload/v1764000861/skillsorbit_logo_kvqgee.png" alt="SkillsOrbit Logo" />
        <h1>You've Been Shortlisted! 🎉</h1>
      </div>
      <div class="content">
        <p>Hi ${applicantName},</p>
        <p>
          Great news! You’ve been <strong class="highlight">shortlisted</strong> for the role of 
          <strong>${role}</strong> at <strong>${companyName}</strong>.
        </p>
        <p>
          This means your skills and experience caught the attention of the recruiter — well done!
        </p>
        <p>
          The hiring team from <strong>${companyName}</strong> may reach out to you soon regarding the next steps 
          in the interview process.
        </p>
        <a href="https://skillsorbit.in/job-seekerDashboard/applied" class="button">View My Application</a>
        <p style="margin-top: 24px;">
          Keep an eye on your email and dashboard for any updates.
        </p>
        <p>We wish you the very best in your interview journey! 💪</p>
      </div>
      <div class="footer">
        SkillsOrbit © ${new Date().getFullYear()} <br />
        You’re receiving this email because you applied for ${role} at ${companyName} on SkillsOrbit.
      </div>
    </div>
  </body>
</html>
`;

module.exports = { shortlistedTemplate };
