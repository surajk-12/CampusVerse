import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    query: { type: mongoose.Schema.Types.ObjectId, ref: "Query", required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "QueryComment" }],
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who reported this answer
  },
  { timestamps: true }
);

export default mongoose.model("Answer", answerSchema);
