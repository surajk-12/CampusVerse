import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { swaggerUi, swaggerSpec } from "./config/swagger.js";
import collegeRoutes from "./routes/college.routes.js";
import notificationRoutes from "./routes/notifications.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chat.routes.js";
import feedRoutes from "./routes/feed.routes.js";
import eventRoutes from "./routes/event.routes.js";
import resourceRoutes from "./routes/resource.routes.js";
import itemRoutes from "./routes/item.routes.js";
import queryRoutes from "./routes/query.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import { initSocket } from "./socket.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/", (req, res) => {
  res.send("🚀 CampusVerse Backend is Running...");
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/ai", aiRoutes);

// Wrap express in an HTTP server so Socket.io can share the same port
const httpServer = createServer(app);

// Initialize Socket.io (JWT-authenticated, room-secured)
initSocket(httpServer);

// Server Start
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io active on ws://localhost:${PORT}`);
});

// Nodemon reload trigger comment
