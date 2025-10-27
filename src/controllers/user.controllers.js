import Dashboard from "../models/dashboard.model.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find({role: "user"}).select("-password");
    if (users.length === 0) {
      throw new ApiError(404, "No users found");
    }
    res
      .status(200)
      .json(new ApiResponse(200, users, "Users fetched successfully"));
  } catch (error) {
    console.error("Error fetching users:", error.message);
    throw new ApiError(500, error.message || "Error fetching users");
  }
});



// Get a single user by ID
const getUserById = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found.");
    }
    res
      .status(200)
      .json(new ApiResponse(200, user, "User fetched successfully"));
  } catch (error) {
    console.log("Error fetching user:", error.message);
    throw new ApiError(500, error.message || "Error fetching an user");
  }
});

const getProfile = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "User profile fetched successfully."));
});

// Update a user by ID
const updateUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Validate the updated data against schema
    });

    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }
    {
      res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "User updated successfully"));
    }
  } catch (error) {
    console.log("Error updating user:", error.message);
    throw new ApiError(500, error.message || "Error updating user");
  }
});

// Delete a user by ID
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await User.findById(userId);
    if (!deletedUser) {
      throw new ApiError(404, "User not found");
    }
    await Dashboard.deleteOne({ user: userId });
    await deletedUser.deleteOne();
    {
      res
        .status(200)
        .json(new ApiResponse(200, deletedUser, "User deleted successfully"));
      console.log("Deleted Successfully");
    }
  } catch (error) {
    console.error("Error deleting user:", error.message);
    throw new ApiError(500, error.message || "Error deleting user");
  }
});
export { getAllUsers, getUserById, getProfile, updateUser, deleteUser };
