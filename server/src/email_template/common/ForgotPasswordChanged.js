const PasswordChangedTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Changed</title>
  <style>
    body { background: #f6f9fc; margin: 0; padding: 0; font-family: Arial; }
    .container {
      max-width: 600px; background: #fff;
      margin: 30px auto; padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .title { font-size: 22px; font-weight: bold; color: #222; }
    .msg { font-size: 16px; margin-top: 15px; color: #444; }
    .footer { margin-top: 25px; font-size: 13px; color: #777; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <p class="title">Your Password Was Successfully Changed</p>
    <p class="msg">
      Hi {{name}},<br /><br />
      This email is to notify you that your password for the account <strong>{{email}}</strong> was recently changed.
    </p>

    <p class="msg">
      If you did not perform this action, please reset your password immediately or contact support.
    </p>

    <p class="footer">
      © ${new Date().getFullYear()} SkillsOrbit. All Rights Reserved.
    </p>
  </div>
</body>
</html>
`;

module.exports = { PasswordChangedTemplate };
