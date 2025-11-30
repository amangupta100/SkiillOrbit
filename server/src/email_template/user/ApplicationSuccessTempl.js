const applicationSuccessTemplate = (name, opportunityTitle, type) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Application Success Email</title>
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
      }
      .button {
        display: inline-block;
        background: #2A956B;
        color: white;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 4px;
        margin-top: 24px;
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
        <!-- 🔻 Insert your logo URL below -->
        <img src="https://res.cloudinary.com/ddad6pdhx/image/upload/v1764000861/skillsorbit_logo_kvqgee.png" alt="SkillsOrbit Logo" />
        <h1>Application Submitted Successfully! 🎉</h1>
      </div>
      <div class="content">
        <p>Hi ${name},</p>
        <p>
          Congratulations! Your application for <strong>${opportunityTitle}</strong> (${type}) has been submitted successfully.
        </p>
        <p>
          Here's what happens next:
        </p>
        <ul>
          <li>✅ Your application is now live and ready for review</li>
          <li>⏰ Please wait some days for the recruiter to respond</li>
          <li>📧 If the recruiter views or shortlists your application, we'll inform you immediately</li>
          <li>💪 Till then, keep practicing and bettering yourself to stand out from others</li>
          <li>📊 You can track your application from your dashboard <a class="button" href="https://skillsorbit.in/job-seekerDashboard/applied">View My Applications</a></li>
        </ul>
        <p>
          Stay tuned — your skills are on their way to the right opportunity.
        </p>
      </div>
      <div class="footer">
        SkillsOrbit <br />
        You're receiving this email because you applied for an opportunity on SkillsOrbit.
      </div>
    </div>
  </body>
</html>
`;

module.exports = { applicationSuccessTemplate };
