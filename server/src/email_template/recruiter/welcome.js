const greetRecruiter = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Welcome Recruiter</title>
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
        max-width: 160px; /* ✅ Bigger logo */
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
      <div class="header">
        <!-- ✅ Updated logo URL -->
        <img src="https://res.cloudinary.com/dt9codbw2/image/upload/v1757310129/logo_o6y0ba.png" alt="SkillOrbit Logo" />
      </div>
      <div class="content">
        <p>Hi [Recruiter Name],</p>
        <p>
          Welcome to <strong>SkillOrbit</strong> — your gateway to smarter, skill-first hiring.
        </p>
        <p>
          You can now:
        </p>
        <ul>
          <li>✅ Post jobs with required skills</li>
          <li>🎯 Receive only test-qualified applicants</li>
          <li>📈 Track candidate scores and interview results</li>
        </ul>
        <p>
          We're excited to help you find top talent with less effort.
        </p>
        <!-- ✅ Updated CTA text -->
        <a class="button" href="https://skillorbit.com/dashboard/recruiter">Post Your First Job</a>
      </div>
      <div class="footer">
        SkillOrbit Inc. — Smarter Hiring. Less Effort.
      </div>
    </div>
  </body>
</html>
`;

module.exports = { greetRecruiter };
