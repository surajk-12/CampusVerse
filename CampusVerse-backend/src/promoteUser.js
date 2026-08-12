/**
 * promoteUser.js
 * ─────────────────────────────────────────────────────────
 * Promote any registered user to college_admin or moderator,
 * or create a new user with these permissions.
 *
 * Run with:
 *   node src/promoteUser.js <email> <role> <collegeName>
 *
 * Example:
 *   node src/promoteUser.js admin@nehru.com college_admin "Nehru College"
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

const args = process.argv.slice(2);
if (args.length < 3) {
  console.log("❌  Usage: node src/promoteUser.js <email> <role> <collegeName>");
  console.log("    Allowed roles: college_admin, moderator, student, super_admin");
  console.log('    Example: node src/promoteUser.js admin@nehru.com college_admin "Nehru College"');
  process.exit(1);
}

const [email, role, collegeName] = args;
const allowedRoles = ["super_admin", "college_admin", "moderator", "student"];
if (!allowedRoles.includes(role)) {
  console.error(`❌  Invalid role. Must be one of: ${allowedRoles.join(", ")}`);
  process.exit(1);
}

/* --- Schemas --- */
const collegeSchema = new mongoose.Schema({
  collegeName: { type: String, required: true, unique: true },
});

const userSchema = new mongoose.Schema({
  firstName:     { type: String, required: true },
  lastName:      { type: String },
  email:         { type: String, required: true, unique: true },
  password:      { type: String, required: true },
  gender:        { type: String, default: "Other" },
  course:        { type: String, default: "N/A" },
  branch:        { type: String, default: "N/A" },
  passingYear:   { type: Number, default: 2026 },
  college:       { type: mongoose.Schema.Types.ObjectId, ref: "College" },
  collegeIdCard: { type: String, default: "admin" },
  photo:         { type: String, default: "admin" },
  isVerified:    { type: Boolean, default: true },
  role:          { type: String, default: "student" },
});

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected to MongoDB");

  const College = mongoose.model("College", collegeSchema);
  const User = mongoose.model("User", userSchema);

  // 1. Find college
  const college = await College.findOne({ collegeName: new RegExp(`^${collegeName}$`, "i") });
  if (!college) {
    console.error(`❌  College "${collegeName}" not found in database.`);
    const allColleges = await College.find({}, "collegeName");
    console.log("    Available Colleges:", allColleges.map(c => c.collegeName));
    await mongoose.disconnect();
    process.exit(1);
  }

  // 2. Find or Create User
  let user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    user.role = role;
    user.college = college._id;
    user.isVerified = true;
    await user.save();
    console.log(`🎉  User "${email}" promoted to "${role}" for college "${college.collegeName}".`);
  } else {
    // Create one
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("Admin@1234", salt);
    user = await User.create({
      firstName: "College",
      lastName: "Admin",
      email: email.toLowerCase(),
      password: passwordHash,
      role: role,
      college: college._id,
      isVerified: true,
    });
    console.log(`🎉  New user created and promoted to "${role}" for college "${college.collegeName}"!`);
    console.log(`    Default Password: Admin@1234`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌  Operation failed:", err.message);
  process.exit(1);
});
