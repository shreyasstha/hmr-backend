import mongoose from "mongoose";

const dashboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  referralStates: [
    {
      referral: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Referral",
      },
      patientName: {
        type: String,
        ref: "Referral",
      },
      status: {
        type: String,
        enum: ["referral", "todo", "completed", "cancelled", "deleted"],
        default: "referral",
      },
      previousStatus: {
        type: [String],
      },
      deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
});

const Dashboard = mongoose.model("Dashboard", dashboardSchema);
export default Dashboard;
