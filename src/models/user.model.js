import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";

const userSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: [true, "First Name is required"],
    trim: true,
  },
  lastName: {
    type: String,
    trim: [true, "Last Name is required"],
  },
  accessToken: {
    type: String, // Store refresh token for authentication
  },
  refreshToken: {
    type: String, // Store refresh token for authentication
  },
  phoneNumber: {
    type: String,
    unique: true,
    required: [true, "Number is required"],
    maxlength: [10, "Number should be at least 10 digits"],
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    required: [true, "Email is required"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
    maxlength: [128, "Password must be at most 128 characters long"],
  },
  regNo: {
    type: String,
    required: [true, "Number is required"],
  },
  role: {
    type: String,
    enum: ["admin", "user", "staff", "superadmin"],
    default: "user",
  },
});

userSchema.methods.generateAccessToken = function () {
  try {
    //proves user authentication

    const accessToken = jwt.sign(
      {
        data: {
          id: this._id,
          email: this.email,
          role: this.role,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "5m" } 
    );
    return accessToken;
  } catch (error) {
    console.error("Error during generating accessToken:", error.message);
    throw new ApiError(500, error.message || "Error during login");
  }
};
userSchema.methods.generateRefreshToken = function () {
  try {
    //use to get new access token when expires
    //both stored in HTTP-only
    const refreshToken = jwt.sign(
      {
        data: {
          id: this._id,
          email: this.email,
          role: this.role,
        },
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    return refreshToken;
  } catch (error) {
    console.error("Error during generating refreshToken:", error.message);
    throw new ApiError(500, error.message || "Error during login");
  }
};

const User = mongoose.model("User", userSchema);
export default User;
