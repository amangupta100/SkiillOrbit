const testResultReadyTemplate = (userName, skillName) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Your Test Result is Ready</title>
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
        background: #ffffff;
        text-align: center;
        padding: 32px;
      }
      .header img {
        max-width: 160px;
      }
      .content {
        padding: 32px;
        color: #333;
      }
      .button {
        display: inline-block;
        background: #111827;
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
      <!-- HEADER SECTION -->
      <div class="header">
        <img src="https://res.cloudinary.com/ddad6pdhx/image/upload/v1764000861/skillsorbit_logo_kvqgee.png" alt="SkillsOrbit Logo" />
      </div>

      <!-- CONTENT SECTION -->
      <div class="content">
        <p>Hi <strong>${userName}</strong>,</p>

        <p>
          Your test results for the skill <strong>${skillName}</strong> is now ready! 🚀
        </p>

        <p>
          You can now view your performance, strengths, improvement areas, and detailed code evaluation inside your dashboard.
        </p>

        <ul>
          <li>📊 View score breakdown</li>
          <li>🐞 See debugging feedback</li>
          <li>💡 Learn from mistake highlights</li>
          <li>🏆 Check if the skill got verified</li>
        </ul>

        <a class="button" href="https://skillsorbit.in/job-seekerDashboard/tests">
          View Test Result
        </a>

        <p style="margin-top: 24px;">
          Keep learning, improving, and unlocking more opportunities at 
          <strong>SkillsOrbit</strong>.
        </p>
      </div>

      <!-- FOOTER SECTION -->
      <div class="footer">
        SkillsOrbit Inc. — Smarter Careers. Stronger Skills.
      </div>
    </div>
  </body>
</html>
`;

module.exports = { testResultReadyTemplate };
