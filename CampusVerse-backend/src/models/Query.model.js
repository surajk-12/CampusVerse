import mongoose from "mongoose";

const querySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
    tags: [{ type: String }],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    answersCount: { type: Number, default: 0 },
    acceptedAnswer: { type: mongoose.Schema.Types.ObjectId, ref: "Answer" },
    isPinned: { type: Boolean, default: false },                          // Moderator/Admin can pin
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],    // Users who reported this
  },
  { timestamps: true }
);

export default mongoose.model("Query", querySchema);
