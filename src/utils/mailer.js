import nodemailer from "nodemailer";
const { EMAIL_USER, EMAIL_PASS } = process.env;

const transporter = nodemailer.createTransport({
  //setup for encrypted emails
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Verification Email
const sendVerificationEmail = async (to, code) => {
  console.log("Sending verification email to:", to, "with code:", code); // Added for debugging

  const mailOptions = {
    from: `"HMR" <${EMAIL_USER}>`,
    to: to,
    subject: "Verify Your Email - HMR",
    // text: `Your verification code is: ${code}`,
     html: `
      <h2>Welcome to HMR!</h2>
      <p>Your verification code is:</p>
      <h1 style="color:#4CAF50;">${code}</h1>
      <p>This code will expire in 10 minutes.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send verification email:", error.message);
    return false;
  }
};

// Thank You Email
const sendThankYouEmail = async (to, firstName) => {
  const mailOptions = {
    from: `"HMR" <${EMAIL_USER}>`,
    to: to,
    subject: "Thank You for Registering!",
    html: `
      <h1>Welcome, ${firstName}!</h1>
      <p>Thank you for joining us! </p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send thank you email:", error.message);
  }
};

export { sendThankYouEmail, sendVerificationEmail };
