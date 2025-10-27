import mongoose from "mongoose";

const referralSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
  },
  dob: {
    type: String,
    required: true,
    trim: true,
  },
  gender: {
    type: String,
  },
  patientNumber: {
    type: String,
    required: [true, "Number is required"],
    minlength: [10, "Patient number should be at least 10 digits"],
    maxlength: [10, "Patient number should not exceed 10 digits"],
    match: [/^9\d{9}$/, "Invalid Patient Number"],
  },

  address: {
    type: String,
    required: true,
  },
  doctorName: {
    type: String,
    required: true,
  },
  doctorNumber: {
    type: String,
    required: [true, "Number is required"],
    minlength: [10, "Doctor number should be at least 10 digits"],
    maxlength: [10, "Doctor number should not exceed 10 digits"],
    match: [/^9\d{9}$/, "Invalid Patient Number"],
  },

  referralDate: {
    type: String,
    required: true,
    trim: true,
  },
  reason: {
    type: String,
  },
  medications: {
    type: [String],
    default: [],
  },
  priority: {
    type: String,
  },
  files: [
    //array of object
    {
      url: {
        type: String, // Cloudinary URL of the image
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
      },
    },
  ],
  notes: {
    type: String,
  },
  status: {
    type: [String],
    enum: ["referral", "todo", "completed", "cancelled", "deleted"],
    default: "referral",
  },
  previousStatus: {
    type: [String],
    enum: ["referral", "todo", "completed", "cancelled", "deleted"],
  },

  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Referral = mongoose.model("Referral", referralSchema);
export default Referral;
