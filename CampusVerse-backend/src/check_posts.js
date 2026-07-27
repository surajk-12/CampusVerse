import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const postSchema = new mongoose.Schema({}, { strict: false });
const Post = mongoose.model("Post", postSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const posts = await Post.find().lean();
    console.log("\n--- POSTS ---");
    console.log(JSON.stringify(posts, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
