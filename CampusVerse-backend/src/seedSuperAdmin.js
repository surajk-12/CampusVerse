/**
 * seedSuperAdmin.js
 * ─────────────────────────────────────────────────────────
 * One-time script to create (or reset) the Super Admin account.
 *
 * Run with:
 *   node src/seedSuperAdmin.js
 *
 * Credentials created:
 *   Email   : admin@campusverse.com
 *   Password: Admin@1234
 * ─────────────────────────────────────────────────────────
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌  MONGO_URI not found in .env");
  process.exit(1);
}

/* ── Minimal inline schema (bypasses required fields for super admin) ── */
const userSchema = new mongoose.Schema(
  {
    firstName:    { type: String },
    lastName:     { type: String },
    email:        { type: String, required: true, unique: true },
    password:     { type: String, required: true },
    gender:       { type: String, default: "Other" },
    course:       { type: String, default: "N/A" },
    branch:       { type: String, default: "N/A" },
    passingYear:  { type: Number, default: 9999 },
    college:      { type: mongoose.Schema.Types.ObjectId, ref: "College", default: null },
    collegeIdCard:{ type: String, default: "admin" },
    photo:        { type: String, default: "admin" },
    isVerified:   { type: Boolean, default: true },
    role:         { type: String, default: "super_admin" },
  },
  { timestamps: true }
);

const ADMIN_EMAIL    = "admin@campusverse.com";
const ADMIN_PASSWORD = "Admin@1234";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected to MongoDB");

  const User = mongoose.model("User", userSchema);

  // Check if already exists
  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    // Update role + reset password in case it was changed
    const salt = await bcrypt.genSalt(10);
    existing.role     = "super_admin";
    existing.password = await bcrypt.hash(ADMIN_PASSWORD, salt);
    existing.isVerified = true;
    await existing.save();
    console.log("♻️   Existing account updated as Super Admin.");
  } else {
    const salt     = await bcrypt.genSalt(10);
    const hashed   = await bcrypt.hash(ADMIN_PASSWORD, salt);
    await User.create({
      firstName:   "Super",
      lastName:    "Admin",
      email:       ADMIN_EMAIL,
      password:    hashed,
      role:        "super_admin",
      isVerified:  true,
    });
    console.log("🎉  Super Admin account created successfully!");
  }

  console.log("─────────────────────────────────");
  console.log(`  Email    : ${ADMIN_EMAIL}`);
  console.log(`  Password : ${ADMIN_PASSWORD}`);
  console.log("─────────────────────────────────");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});
