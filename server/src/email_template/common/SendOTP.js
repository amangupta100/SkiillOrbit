const OTP_Verf = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    /* Fallback safe styles */
    body {
      margin: 0;
      padding: 0;
      background-color: #f6f9fc;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table {
      border-spacing: 0;
      width: 100%;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      padding: 20px;
      text-align: center;
      background: #ffffff;
    }
    .logo img {
      width: 200px;
      max-width: 100%;
    }
    .content {
      padding: 20px;
      color: #333333;
      font-size: 16px;
      line-height: 1.5;
    }
    .greeting {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .otp-box {
      display: inline-block;
      padding: 15px 25px;
      background: #3A86FF;
      color: #ffffff;
      font-size: 22px;
      font-weight: bold;
      letter-spacing: 5px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .info-text {
      color: #666666;
      font-size: 14px;
      margin-top: 10px;
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #999999;
    }
    /* Mobile responsiveness */
    @media screen and (max-width: 600px) {
      .content {
        padding: 15px !important;
        font-size: 15px !important;
      }
      .greeting {
        font-size: 18px !important;
      }
      .otp-box {
        font-size: 20px !important;
        padding: 12px 20px !important;
      }
    }
  </style>
</head>
<body>
  <center style="width: 100%; background: #f6f9fc; padding: 30px 0;">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="logo">
          <img src="https://res.cloudinary.com/dt9codbw2/image/upload/v1757310129/logo_o6y0ba.png" alt="SkillOrbit Logo">
        </div>
      </div>

      <!-- Content -->
      <div class="content">
        <div class="greeting">Hello {{ .name }},</div>
        <p>Your OTP code for authentication is:</p>
        
        <div class="otp-box">{{ .Token }}</div>

        <p class="info-text">Please enter this code to complete your authentication process. 
        This code will expire in <strong>10 minutes</strong>.</p>

        <p>If you didn't request this code, please ignore this email.</p>
        <p>Best regards,<br>SkillOrbit Team</p>
      </div>

      <!-- Footer -->
      <div class="footer">
        © ${new Date().getFullYear()} SkillOrbit. All rights reserved.
      </div>
    </div>
  </center>
</body>
</html>`;

module.exports = { OTP_Verf };
