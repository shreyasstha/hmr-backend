import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendThankYouEmail, sendVerificationEmail } from "../utils/mailer.js";

// Generate tokens
export const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    // console.log("at:", accessToken);
    // console.log("rt:", refreshToken);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
};

// Generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// registration
const register = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      firstName,
      lastName,
      phoneNumber,
      email,
      password,
      regNo,
      role,
    } = req.body;
    console.log(req.body);
    if (
      [
        title,
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
        regNo,
        role,
      ].some((field) => !field || field.trim() === "")
    ) {
      throw new ApiError(400, "All fields are required");
    }

    // Check if email or phone number already exists in the database
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (existingUser) {
      const errors = [];
      if (existingUser.email === email) {
        errors.push("Email already registered");
      }
      if (existingUser.phoneNumber === phoneNumber) {
        errors.push("Phone number already registered");
      }
      throw new ApiError(404, errors.join(" and "));
    }

    // Hash the password before saving to database
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification code
    const verificationCode = generateVerificationCode(); // Added server-side generation

    const newUser = new User({
      title,
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashedPassword,
      regNo,
      role,
      verificationCode,
      isVerified: false,
    });

    const savedUser = await newUser.save();
    await sendVerificationEmail(email, verificationCode);
    res
      .status(201)
      .json(new ApiResponse(201, savedUser, "User registered successfully."));
  } catch (error) {
    console.error("Error during registration:", error);
    throw new ApiError(500, error.message || "Error saving user");
  }
});

// login

const login = asyncHandler(async (req, res, next) => {
  try {
    const { email, password, role } = req.body || {};

    // Validate input
    if ([email, password].some((field) => !field || field.trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, "User not found. Please sign up.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password.");
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json(
          "Email not verified. Please check your email for verification code."
        );
    }

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    // Exclude sensitive fields like password and refreshToken from the response
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    // Cookie options
    //cookie => automatically sends tokens to server
    const options = {
      httpOnly: true, //prevent JS from reading cookies
      secure: true, //sent over https
      sameSite: "None", //control cross site cookie
      // maxAge: 7 * 24 * 60 * 60 * 1000, //7days => browser keeps the cookie
      maxAge: 5 * 60 * 1000,
    };

    // Success response
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, loggedInUser, "User logged in successfully"));
  } catch (error) {
    console.error("Error during login:", error.message);
    next(error);
  }
});

//email verification
const verifyEmail = async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check if already verified
    if (user.isVerified) {
      return res
        .status(200)
        .json(new ApiResponse(200, "Email already verified"));
    }

    // Check if code matches
    //can remove string here
    if (user.verificationCode.toString() !== verificationCode.toString()) {
      throw new ApiError(404, "Invalid verification code");
    }

    // Mark user as verified and remove the code
    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    await sendThankYouEmail(email, user.firstName);

    res.status(200).json(new ApiResponse(200, "Email verified successfully"));
  } catch (error) {
    console.error("Error during email verification:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken; //for cookies || for postman

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    ); //verifies refresh token

    const user = await User.findById(decodedToken.data?.id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    //generate new token
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    //save new refresh token in db
    user.refreshToken = newRefreshToken;
    await user.save();

    //set cookie option
    const options = {
      httpOnly: true,
      secure: true, //true for https
      sameSite: "strict",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options) // token set in cookies
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// Logout route
const logout = asyncHandler(async (req, res) => {
  // const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;
  console.log("from logout");
  // console.log("This is access", accessToken);
  console.log("This is refresh", refreshToken);

  if (!refreshToken) {
    throw new ApiError(404, "No tokens provided. Already logged out.");
  }

  try {
    // Find the user who has this refresh token stored
    const user = await User.findOne({ refreshToken });

    if (!user) {
      res.clearCookie("refreshToken");
      throw new ApiError(404, "User not found or already logged out.");
    }

    // Remove the refresh token from DB for security
    user.refreshToken = null;
    await user.save();

    // Clear the refresh token cookie
    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    };

    res
      .status(200)
      //.clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, user, "User logged out successfully."));
  } catch (error) {
    console.error("Error verifying token:", error);
    throw new ApiError(400, "Invalid Token.");
  }
});

export { register, login, refreshAccessToken, verifyEmail, logout };
