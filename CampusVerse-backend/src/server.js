import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { swaggerUi, swaggerSpec } from "./config/swagger.js";
import collegeRoutes from "./routes/college.routes.js";
import notificationRoutes from "./routes/notifications.js"

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(express.json()); // parse JSON bodies
app.use(cors());
app.get("/", (req, res) => {
  res.send("🚀 CampusVerse Backend is Running...");
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/notifications", notificationRoutes)


// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
