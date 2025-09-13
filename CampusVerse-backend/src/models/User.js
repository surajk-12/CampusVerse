import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { type } from "os";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    course: { type: String, required: true }, // separate course
    branch: { type: String, required: true }, // separate branch
    passingYear: {type: Number, required: true},
    college: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true }, // link to college
    collegeIdCard: { type: String, required: true }, // file path
    photo: { type: String, required: true }, // renamed from livePhoto
    isVerified: { type: Boolean, default: false }, // manual or auto verify later
  },
  { timestamps: true }
);

// 🔑 Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Method to check password during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
