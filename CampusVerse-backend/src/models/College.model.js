import mongoose from "mongoose";

const collegeSchema = new mongoose.Schema(
  {
    collegeName: { type: String, required: true, unique: true },
    country: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    address: { type: String, required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("College", collegeSchema);
