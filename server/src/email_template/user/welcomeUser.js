const greetUser = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Welcome Email</title>
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
        padding: 32px;
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
        <h1>Welcome to SkillsOrbit 🚀</h1>
      </div>
      <div class="content">
        <p>Hi {{ .Candidate_Name}},</p>
        <p>
          Welcome to <strong>SkillsOrbit</strong> — where your skills speak louder than your resume.
          We’re excited to have you on board!
        </p>
        <p>
          Here's what you can do next:
        </p>
        <ul>
          <li>🎯 Take your first skill test</li>
          <li>📝 Apply</li>
          <li>⚡ Get recruiter response as soon as possible</li>
        </ul>
        <p>
          Let’s make your job search smarter, faster, and fairer.
        </p>
        <a class="button" href="https://skillsorbit.in/job-seekerDashboard/test">Take Your First Test</a>
      </div>
      <div class="footer">
        SkillsOrbit <br />
        You're receiving this email because you signed up for SkillsOrbit.
      </div>
    </div>
  </body>
</html>
`;

module.exports = { greetUser };
