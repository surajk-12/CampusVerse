import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    organizingCollege: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
    dateTime: { type: Date, required: true },
    location: { type: String, required: true, trim: true }, // e.g. "Virtual zoom" or "Campus Ground"
    category: { type: String, enum: ["Tech", "Cultural", "Sports"], required: true },
    registrationLink: { type: String, trim: true }, // Optional external URL
    registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Internal student registrations
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
