import Dashboard from "../models/dashboard.model.js";
import Referral from "../models/referral.model.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

//get dashboard of currently logged in user
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id; //identifies authenticated user

  const allReferrals = await Referral.find(); //get all info of referral

  // Find or create dashboard
  let dashboard = await Dashboard.findOne({ user: userId })
    .populate("referralStates.referral")
    .populate({
      path: "referralStates.deletedBy",
      select: "firstName lastName email",
    });

  //  If dashboard doesn’t exist yet, create it
  if (!dashboard) {
    const referralStates = allReferrals.map((r) => ({
      referral: r._id,
      status: "referral",
      patientName: r.patientName,
      previousStatus: ["referral"], // keep track of origin
    }));

    dashboard = await Dashboard.create({ user: userId, referralStates });

    // Re-fetch after creation with population
    dashboard = await Dashboard.findOne({ user: userId })
      .populate({
        path: "referralStates.referral",
        select:
          "patientName dob gender doctorName doctorNumber referralDate reason medications files notes",
      })
      .populate({
        path: "referralStates.deletedBy",
        select: "firstName lastName email",
      });
  }

  // Initialize columns
  const result = {
    _id: dashboard._id,
    user: userId,
    referral: [],
    todo: [],
    completed: [],
    cancelled: [],
    deleted: [],
  };

  // Fill columns based on dashboard states
  dashboard.referralStates.forEach((state) => {
    const ref = state.referral; // already populated referral doc

    if (ref && result[state.status]) {
      result[state.status].push({
        ...ref.toObject(),
        status: state.status,
        previousStatus: state.previousStatus || [],
        deletedBy: state.deletedBy || null,
      });
    }
  });

  // Any referrals not in dashboard → add to "referral"
  const existingReferralIds = new Set(
    dashboard.referralStates.map((r) => r.referral?._id.toString())
  );

  allReferrals.forEach((r) => {
    if (!existingReferralIds.has(r._id.toString())) {
      result.referral.push({
        ...r.toObject(),
        status: "referral",
        previousStatus: ["referral"],
      });
    }
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Dashboard fetched successfully"));
});

//dashboard of particular user
const getDashboardById = asyncHandler(async (req, res) => {
  const { userId } = req.params; //identifies resource => uses :id

  const user = await User.findById(userId).select("-password");
  if (!user) throw new ApiError(404, "User not found");

  const allReferrals = await Referral.find();

  let dashboard = await Dashboard.findOne({ user: userId })
    .populate({
      path: "referralStates.referral",
      select:
        "patientName dob gender patientNumber address doctorName doctorNumber referralDate reason medications files notes",
    })
    .populate({
      path: "referralStates.deletedBy",
      select: "firstName lastName email",
    });

  if (!dashboard) {
    const referralStates = allReferrals.map((r) => ({
      referral: r._id,
      status: "referral",
      patientName: r.patientName,
      previousStatus: ["referral"],
    }));

    dashboard = await Dashboard.create({ user: userId, referralStates });

    dashboard = await Dashboard.findOne({ user: userId })
      .populate({
        path: "referralStates.referral",
        select:
          "patientName dob gender doctorName doctorNumber referralDate reason medications files notes",
      })
      .populate({
        path: "referralStates.deletedBy",
        select: "firstName lastName email",
      });
  }

  const result = {
    _id: dashboard._id,
    user: userId,
    referral: [],
    todo: [],
    completed: [],
    cancelled: [],
    deleted: [],
  };

  //  Sort dashboard states into columns
  dashboard.referralStates.forEach((state) => {
    const ref = state.referral;
    if (ref && result[state.status]) {
      result[state.status].push({
        ...ref.toObject(),
        status: state.status,
        previousStatus: state.previousStatus || [],
        deletedBy: state.deletedBy || null,
      });
    }
  });

  // Include any new referrals not yet in dashboard
  const existingReferralIds = new Set(
    dashboard.referralStates.map((r) => r.referral?._id.toString())
  );

  allReferrals.forEach((r) => {
    if (!existingReferralIds.has(r._id.toString())) {
      result.referral.push({
        ...r.toObject(),
        status: "referral",
        previousStatus: ["referral"],
      });
    }
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Dashboard fetched successfully"));
});

//update dashboard of currently logged in user
const updateDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { referralId, newStatus } = req.body;

  if (!referralId || !newStatus) {
    return res.status(400).json({ message: "Missing referralId or newStatus" });
  }

  // Find or create dashboard
  let dashboard = await Dashboard.findOne({ user: userId });
  if (!dashboard) {
    dashboard = new Dashboard({ user: userId, referralStates: [] });
  }

  // Remove any existing state for this referral
  dashboard.referralStates = dashboard.referralStates.filter(
    (s) => s.referral?.toString() !== referralId
  );

  // Add updated state
  dashboard.referralStates.push({
    referral: referralId,
    status: newStatus,
  });

  await dashboard.save();

  res
    .status(200)
    .json(new ApiResponse(200, dashboard, "Dashboard updated successfully"));
});

const updateDashboardById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { referralId, newStatus } = req.body;

  const user = await User.findById(userId).select("-password");
  if (!user) throw new ApiError(404, "User not found");

  if (!referralId || !newStatus) {
    return res.status(400).json({ message: "Missing referralId or newStatus" });
  }

  // Find or create dashboard
  let dashboard = await Dashboard.findOne({ user: userId });
  if (!dashboard) {
    throw new ApiError(404, "Dashboard not found");
  }

  // Remove any existing state for this referral
  dashboard.referralStates = dashboard.referralStates.filter(
    (s) => s.referral?.toString() !== referralId
  );

  // Add updated state
  dashboard.referralStates.push({
    referral: referralId,
    status: newStatus,
  });

  await dashboard.save();

  res
    .status(200)
    .json(new ApiResponse(200, dashboard, "Dashboard updated successfully"));
});

const deleteReferral = asyncHandler(async (req, res) => {
  try {
    const { dashboardId, referralId } = req.params;

    const userId = req.user._id;

    const dashboard = await Dashboard.findById(dashboardId);
    if (!dashboard) {
      throw new ApiError(404, "Dashboard not found");
    }

    const referralStates = dashboard.referralStates.find(
      (r) => r.referral.toString() === referralId
    );

    if (!referralStates) {
      throw new ApiError(404, "Referral not found in dashboard");
    }

    referralStates.previousStatus = referralStates.status;
    referralStates.status = "deleted";
    referralStates.deletedBy = userId;

    //dashboard.markModified("referralStates"); //force db to detect

    await dashboard.save();

    // populate deletedBy with user details
    let deletedReferral = await Referral.findById(referralId)
      .populate("deletedBy", "firstName lastName email")
      .lean();   //mongoose to plain js

    

    // Combine both referral + state info
    deletedReferral = {
      ...deletedReferral,
      status: referralStates.status,
      previousStatus: referralStates.previousStatus,
      deletedBy: referralStates.deletedBy,
    };

    res
      .status(200)
      .json(
        new ApiResponse(200, deletedReferral, "Referral deleted successfully")
      );
  } catch (error) {
    console.error("Error deleting referral:", error.message);
    throw new ApiError(500, error.message || "Error deleting referral");
  }
});

const restoreReferral = asyncHandler(async (req, res) => {
  try {
    const { dashboardId, referralId } = req.params;

    const dashboard = await Dashboard.findById(dashboardId);
    if (!dashboard) {
      throw new ApiError(404, "Dashboard not found");
    }
    // if (req.user.role !== "admin") {
    //   throw new ApiError(403, "Only admin can restore referrals");
    // }

    const referralState = dashboard.referralStates.find(
      (r) => r.referral.toString() === referralId
    );

    if (!referralState) {
      throw new ApiError(404, "Referral not found in dashboard");
    }
    // Ensure previousStatus is a string, even if old data was an array
    let prevStatus = referralState.previousStatus;
    if (Array.isArray(prevStatus)) {
      prevStatus = prevStatus[0] || "referral";
    }

    // Restore previous status
    referralState.status = prevStatus;
    referralState.previousStatus = "deleted";

    await dashboard.save();

    let restoredReferral = await Referral.findById(referralId).lean();
    // .populate(
    //   "deletedBy",
    //   "firstName lastName email"
    // );

      restoredReferral = {
      ...restoredReferral,
      status: referralState.status,
      previousStatus: referralState.previousStatus,
      deletedBy: referralState.deletedBy,
    };

    res
      .status(200)
      .json(
        new ApiResponse(200,restoredReferral,"Referral restored successfully" )
      );
  } catch (error) {
    console.error("Error restoring referral:", error.message);
    throw new ApiError(500, error.message || "Error restoring referral");
  }
});

const getAdminDashboardSummary = asyncHandler(async (req, res) => {
  // Ensure only admin can access this
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  const dashboards = await Dashboard.find();

  // Initialize totals
  const totals = {
    referral: 0,
    todo: 0,
    completed: 0,
    cancelled: 0,
    deleted: 0,
  };

  // Loop through all dashboards and count each referralStates by status
  dashboards.forEach((dashboard) => {
    dashboard.referralStates.forEach((state) => {
      if (totals[state.status] !== undefined) {
        totals[state.status] += 1;
      }
    });
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, totals,"Admin dashboard summary fetched successfully")
    );
});

export {
  getDashboard,
  getDashboardById,
  updateDashboard,
  updateDashboardById,
  deleteReferral,
  restoreReferral,
  getAdminDashboardSummary,
};
