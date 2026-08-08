import mongoose from "mongoose";

const queryCommentSchema = new mongoose.Schema(
  {
    answer: { type: mongoose.Schema.Types.ObjectId, ref: "Answer", required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("QueryComment", queryCommentSchema);
