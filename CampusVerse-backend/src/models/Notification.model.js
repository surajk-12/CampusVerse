import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        from: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
        to: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
        type: {type: String, enum: ["request"], default: "request"},
        status: {type: String, enum: ["pending", "accepted", "rejected"], default: "pending"},
    },
    {timestamps: true}
);

export default mongoose.model("Notification", notificationSchema)