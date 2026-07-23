import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const collegeSchema = new mongoose.Schema({
  collegeName: String,
  city: String,
});

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  college: { type: mongoose.Schema.Types.ObjectId, ref: "College" }
});

const College = mongoose.model("College", collegeSchema);
const User = mongoose.model("User", userSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const colleges = await College.find();
    console.log("\n--- COLLEGES ---");
    colleges.forEach(c => {
      console.log(`ID: ${c._id} | Name: ${c.collegeName} | City: ${c.city}`);
    });

    const users = await User.find().populate("college");
    console.log("\n--- USERS ---");
    users.forEach(u => {
      console.log(`ID: ${u._id} | Name: ${u.firstName} ${u.lastName} | Email: ${u.email} | College ID: ${u.college?._id} | College Name: ${u.college?.collegeName}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
