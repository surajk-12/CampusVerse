import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isAnonymous: { type: Boolean, default: false },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    attachments: [
      {
        fileType: { type: String, enum: ["image", "video"] },
        url: { type: String, required: true },
      },
    ],
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who reported this post
  },
  { timestamps: true }
);

// Virtual property to calculate net votes
postSchema.virtual("votesCount").get(function () {
  return this.upvotes.length - this.downvotes.length;
});

export default mongoose.model("Post", postSchema);
