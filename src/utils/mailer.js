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

  const mailOptions = {
    from: `"HMR" <${EMAIL_USER}>`,
    to: to,
    subject: "Verify Your Email ",
    // text: `Your verification code is: ${code}`,
    html: `
      <h2>Welcome to HMR!</h2>
       <p>Click the link below to verify your email:</p>
        <a href="${code}" style="color:#5F41E4;font-weight:bold;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
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

const sendLoginOTPEmail = async (to, otp) => {
  // console.log("Sending verification email to:", to, "with otp:", otp); // Added for debugging
  const mailOptions = {
    from: `"HMR" <${EMAIL_USER}>`,
    to: to,
    subject: "Login OTP code",
    // text: `Your verification code is: ${code}`,
    html: `
      <h2>Welcome to HMR!</h2>
       <p>Your OTP for login is:</p>
      <h3 style="color:#5F41E4;">${otp}</h3>
        <p>This otp will expire in 5 minutes.</p>
      `,
  };

  try {
    await transporter.sendMail(mailOptions);

  } catch (error) {
    console.error("Failed to send verification email:", error.message);
    return false;
  }
};

export { sendThankYouEmail, sendVerificationEmail, sendLoginOTPEmail };
