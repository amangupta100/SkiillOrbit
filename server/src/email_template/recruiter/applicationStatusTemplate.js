const applicationStatusTemplate = (
  userName,
  jobRole,
  status,
  recruiterName,
  companyName
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Status Update</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f9f9f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    }
    .header {
      background-color: #171717;
      text-align: center;
      padding: 24px;
    }
    .header img {
      max-width: 160px;
    }
    .content {
      padding: 30px;
      color: #333333;
      text-align: left;
    }
    h2 {
      color: #111827;
      margin-top: 0;
    }
    .status {
      background: #f3f4f6;
      padding: 12px 18px;
      border-left: 5px solid #4f46e5;
      font-weight: 600;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 16px;
      font-size: 14px;
      text-align: center;
      color: #6b7280;
    }
    @media (max-width: 600px) {
      .container {
        width: 95%;
        margin: 20px auto;
      }
      .content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/ddad6pdhx/image/upload/v1764000861/skillsorbit_logo_kvqgee.png" alt="Company Logo">
    </div>
    <div class="content">
      <h2>Hi ${userName},</h2>
      <p>We wanted to update you about your application for the role of <strong>${jobRole}</strong> at ${companyName}.</p>
      <div class="status">
        Current Status: ${status}
      </div>
      <p>If you have any questions, feel free to reach out to us.</p>
      <p>Best regards,<br><strong>${recruiterName}</strong><br>Recruitment Team</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} TalentSync. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

module.exports = { applicationStatusTemplate };
