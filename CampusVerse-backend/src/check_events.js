import mongoose from "mongoose";
import dotenv from "dotenv";
import College from "./models/College.model.js";
import User from "./models/User.js";
import Event from "./models/Event.model.js";

dotenv.config();

async function run() {
  try {
    console.log("Connecting to:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected successfully!");

    // Clean up previous test events
    await Event.deleteMany({});
    console.log("Cleared old events.");

    // Update David Miller to be Organizer
    const targetUser = await User.findOne({ email: "david@campusverse.com" });
    if (targetUser) {
      targetUser.role = "Organizer";
      targetUser.password = "password123";
      await targetUser.save();
      console.log(`✅ Set David Miller (${targetUser.email}) role to "Organizer" and password to "password123"`);
    } else {
      console.log("⚠️ Could not find David Miller profile");
    }

    const firstValidUser = targetUser || await User.findOne({ college: { $ne: null } });
    let firstValidCollege = null;
    if (firstValidUser) {
      firstValidCollege = await College.findById(firstValidUser.college);
    }

    if (firstValidUser && firstValidCollege) {
      console.log(`Creating mock events for College: ${firstValidCollege.collegeName} and User: ${firstValidUser.firstName}`);
      
      const mockEvent1 = new Event({
        title: "Cross-Campus Tech Hackathon 2026",
        description: "Join us for a 24-hour sprint of coding, design, and pitch matches! Students from any campus can participate, form teams, and win exciting prizes.",
        organizingCollege: firstValidCollege._id,
        dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days in future
        location: "Virtual Zoom & Campus Main Auditorium",
        category: "Tech",
        registrationLink: "",
        registrations: [firstValidUser._id],
        createdBy: firstValidUser._id
      });
      await mockEvent1.save();
      console.log("✅ Mock Tech Hackathon created successfully!");

      const mockEvent2 = new Event({
        title: "Campus Cultural Fest 2026",
        description: "An evening of dance, music, theater, and arts cross-campus! Join us to celebrate campus talent and network with students.",
        organizingCollege: firstValidCollege._id,
        dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days in future
        location: "Campus Main Ground",
        category: "Cultural",
        registrationLink: "",
        registrations: [],
        createdBy: firstValidUser._id
      });
      await mockEvent2.save();
      console.log("✅ Mock Cultural Fest created successfully!");
    } else {
      console.log("⚠️ Could not find valid user/college to seed fests");
    }

    // List all events
    const events = await Event.find().populate("organizingCollege").populate("createdBy");
    console.log("\n--- SEEDED EVENTS LIST ---");
    events.forEach((ev) => {
      console.log(`ID: ${ev._id} | Title: ${ev.title} | Cat: ${ev.category} | College: ${ev.organizingCollege?.collegeName} | Registrations: ${ev.registrations?.length}`);
    });

  } catch (err) {
    console.error("❌ Test Script Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
