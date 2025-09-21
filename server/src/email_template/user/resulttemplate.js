// email_template/resultTemplate.js

const resultTemplate = (candidateName, score, status) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Test Result</title>
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
        max-width: 140px;
        margin-bottom: 16px;
      }
      .content {
        padding: 32px;
        color: #333;
      }
      .status {
        font-weight: bold;
        color: ${status === "Passed" ? "#16a34a" : "#dc2626"};
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
        <img src="https://res.cloudinary.com/dt9codbw2/image/upload/v1757310129/logo_o6y0ba.png" alt="SkillOrbit Logo" />
        <h1>Your Test Result is Ready 🎉</h1>
      </div>
      <div class="content">
        <p>Hi <strong>${candidateName}</strong>,</p>
        <p>Your skill test evaluation has been completed successfully.</p>
        <p><b>Score:</b> ${score}</p>
        <p><b>Status:</b> <span class="status">${status}</span></p>
        <p>You can now login to your dashboard to view the full report and detailed feedback.</p>
        <a class="button" href="https://skillorbit.com/dashboard/user">View Result</a>
      </div>
      <div class="footer">
        SkillOrbit © ${new Date().getFullYear()} <br />
        You're receiving this email because you took a test on SkillOrbit.
      </div>
    </div>
  </body>
</html>
`;

module.exports = { resultTemplate };
