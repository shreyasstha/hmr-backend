import Dashboard from "../models/dashboard.model.js";
import Referral from "../models/referral.model.js";
import { ApiError } from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const postReferral = asyncHandler(async (req, res, next) => {
  try {
    const {
      patientName,
      dob,
      gender,
      patientNumber,
      address,
      doctorName,
      doctorNumber,
      referralDate,
      reason,
      medications,
      priority,
      notes,
    } = req.body;

    //only for staff
    if (req.user.role !== "staff") {
      throw new ApiError(403, "Only staff can post referrals");
    }

    const isBlank = (v) =>
      v === undefined ||
      v === null ||
      (typeof v === "string" && v.trim() === "");

    const requiredFields = [
      patientName,
      dob,
      gender,
      patientNumber,
      address,
      doctorName,
      doctorNumber,
      referralDate,
      reason,
      medications,
      priority,
      notes,
    ];

    if (requiredFields.some(isBlank)) {
      throw new ApiError(400, "All required fields must be provided");
    }
    const referralImages = req.files;
    console.log(req.files);

    if (!referralImages || referralImages.length === 0) {
      throw new ApiError(404, "No files uploaded");
    }

    // Array to store Cloudinary URLs for all images
    const referralPaths = [];

    for (const referralImage of referralImages) {
      const referralImageLocalPath = referralImage.path; // Local path for each image
      console.log("this is local path", referralImageLocalPath);

      // Upload each image to Cloudinary
      const referralPath = await uploadOnCloudinary(referralImageLocalPath);
      console.log("this is product path", referralPath);

      // Add the Cloudinary URL to the array
      referralPaths.push({
        url: referralPath.url,
        public_id: referralPath.public_id,
        name: referralImage.originalname,
      });
    }

    //create new referral
    const newReferral = new Referral({
      patientName,
      dob,
      gender,
      patientNumber,
      address,
      doctorName,
      doctorNumber,
      referralDate,
      reason,
      medications,
      priority,
      files: referralPaths,

      notes,
      status: "referral",
      previousStatus: ["referral"],
      postedBy: req.user._id,
    });

    const savedReferral = await newReferral.save();

    //save to dashboard => array, as we used find
    const dashboard = await Dashboard.find();

    if (!dashboard || dashboard.length === 0) {
      throw new ApiError(404, "No dashboard found");
    }

    await Promise.all(
      dashboard.map(async (dashboard) => {
        dashboard.referralStates.push({
          referral: savedReferral._id,
          column: "referral", // first state
          previousStatus: ["referral"],
        });
        await dashboard.save();
      })
    );

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { referral: savedReferral },
          "Referral registered successfully."
        )
      );
  } catch (error) {
    console.error("Error during registration:", error);
    throw new ApiError(500, error.message || "Error saving referral");
  }
});

const getReferrals = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    const referrals = await Referral.find({ postedBy: userId })
      .sort({ referralDate: 1 }) // first posted first shown
      .populate("postedBy", "firstName lastName");
    res
      .status(200)
      .json(new ApiResponse(200, referrals, "Referrals fetched successfully"));
  } catch (error) {
    console.error("Error fetching referrals:", error);
    throw new ApiError(500, error.message || "Error fetching referrals");
  }
});

const updateReferral = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patientName,
      dob,
      gender,
      patientNumber,
      address,
      doctorName,
      doctorNumber,
      referralDate,
      reason,
      medications,
      priority,
      notes,
      filesToDelete,
    } = req.body;

    // Find referral
    const referral = await Referral.findById(id);
    if (!referral) throw new ApiError(404, "Referral not found");

    //  Delete selected files as JSON string
    if (filesToDelete && Array.isArray(JSON.parse(filesToDelete))) {
      const toDelete = JSON.parse(filesToDelete);
      for (const public_id of toDelete) {
        await cloudinary.uploader.destroy(public_id);
      }

      // Remove deleted files from referral.files array
      referral.files = referral.files.filter(
        (file) => !toDelete.includes(file.public_id)
      );
    }

    // Upload new files
    if (req.files && req.files.length > 0) {
      const uploadedFiles = [];
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "hmr",
          resource_type: "auto",
       
        });
        fs.unlinkSync(file.path); //to delete from temp

        uploadedFiles.push({
          url: result.secure_url,
          public_id: result.public_id,
          name: file.originalname,
        });
      }

      referral.files.push(...uploadedFiles); // add new files
    }

    // Update text fields
    referral.patientName = patientName || referral.patientName;
    referral.dob = dob || referral.dob;
    referral.gender = gender || referral.gender;
    referral.patientNumber = patientNumber || referral.patientNumber;
    referral.address = address || referral.address;
    referral.doctorName = doctorName || referral.doctorName;
    referral.doctorNumber = doctorNumber || referral.doctorNumber;
    referral.referralDate = referralDate || referral.referralDate;
    referral.reason = reason || referral.reason;
    referral.medications = medications || referral.medications;
    referral.priority = priority || referral.priority;
    referral.notes = notes || referral.notes;

    const updatedReferral = await referral.save();

    res
      .status(200)
      .json(
        new ApiResponse(200, updatedReferral, "Referral updated successfully.")
      );
  } catch (error) {
    console.error("Error updating referral:", error);
    throw new ApiError(500, error.message || "Error updating referral");
  }
});

const deleteReferral = asyncHandler(async (req, res) => {
  try {
    const referralId = req.params.id;

    const deleteReferral = await Referral.findByIdAndDelete(referralId);
    if (!deleteReferral) {
      throw new ApiError(404, "Referral not found");
    }

    //remove from all dashboard
    await Dashboard.updateMany(
      {},
      { $pull: { referralStates: { referral: referralId } } }
    );
    {
      res
        .status(200)
        .json(
          new ApiResponse(200, deleteReferral, "Referral deleted successfully")
        );
    }
  } catch (error) {
    console.error("Error deleting referral:", error.message);
    throw new ApiError(500, error.message || "Error deleting referral");
  }
});

export { postReferral, getReferrals, updateReferral, deleteReferral };
