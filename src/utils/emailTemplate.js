const getOtpTemplate = (otp) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>SkillPORT OTP Verification</title>
    <style>
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #f7f7fc;
    margin: 0;
    padding: 0;
  }

  .wrapper {
    width: 100%;
    padding: 40px 0;
    background: linear-gradient(135deg, #fff7e6, #f4f4ff);
  }

  .container {
    max-width: 650px;
    margin: auto;
    background: #ffffff;
    border-radius: 16px;
    padding: 40px 35px;
    border: 1px solid #eeeeee;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    text-align: center;
  }

  .brand {
    font-size: 30px;          /* Increased ~70% */
    font-weight: 800;
    letter-spacing: 1px;
    margin-bottom: 25px;
    color: #000;
    font-family: 'Cinzel','Trajan Pro','Times New Roman',serif;
  }

  .title {
    font-size: 26px;
    font-weight: bold;
    color: #102a63;
    margin-bottom: 8px;
  }

  .subtitle {
    color: #555;
    font-size: 15px;
    margin-bottom: 35px;
  }

  .otp-box {
    display: inline-block;
    padding: 18px 50px;
    font-size: 36px;
    font-weight: 800;
    color: #102a63;
    border: 2.5px solid #102a63;
    border-radius: 10px;
    letter-spacing: 7px;
    background: #fdfdfd;
    box-shadow: inset 0 2px 6px rgba(0,0,0,0.08);
    margin-bottom: 30px;
  }

  .note {
    color: #666;
    font-size: 14px;
    margin-bottom: 5px;
  }

  .highlight {
    font-weight: 700;
    color: #000;
  }

  .warning {
    font-size: 13px;
    color: #999;
    margin-top: 3px;
  }

  .footer {
    margin-top: 35px;
    font-size: 12px;
    color: #aaa;
    border-top: 1px solid #eee;
    padding-top: 15px;
  }
</style>
  </head>

  <body>
    <div class="wrapper">
      <div class="container">
        <div class="brand">SkillPORT</div>
        <div class="title">Secure Verification</div>
        <div class="subtitle">Use the OTP below to securely continue your login</div>
        <div class="otp-box">${otp}</div>
        <div class="note">This OTP is valid for <span class="highlight">10 minutes</span>.</div>
        <div class="warning">Please do not share it with anyone.</div>
        <div class="footer">© SkillPORT — Secure Authentication Service</div>
      </div>
    </div>
  </body>
  </html>`;
};

module.exports = { getOtpTemplate };
