import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Message from "./models/Message.js";

/**
 * Generates a deterministic, unique private room ID for two users.
 * Sorting ensures roomId is the same regardless of who initiates.
 * e.g., userId1="abc", userId2="xyz" → roomId="abc_xyz" always
 */
function getRoomId(userId1, userId2) {
  return [userId1, userId2].sort().join("_");
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // In production, restrict to your frontend URL
      methods: ["GET", "POST"],
    },
  });

  // ─────────────────────────────────────────────
  // SOCKET AUTH MIDDLEWARE
  // Runs before any socket connection is established.
  // Validates the JWT sent from the frontend handshake.
  // ─────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach verified user to socket for use in event handlers
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // ─────────────────────────────────────────────
  // CONNECTION EVENT
  // ─────────────────────────────────────────────
  io.on("connection", (socket) => {
    console.log(`✅ Socket connected: ${socket.user.firstName} (${socket.id})`);

    // ─── JOIN PRIVATE ROOM ───────────────────────────────────────────────────
    // Client emits this when opening a chat with a friend.
    // Server verifies the friendship before allowing the socket to join.
    // SECURITY: Even if a client sends a forged partnerId, we check DB.
    socket.on("join-room", async ({ partnerId }) => {
      try {
        const myId = socket.user._id.toString();

        // Verify: the requested partner is actually a mutual friend
        const me = await User.findById(myId).select("friends");
        const isFriend = me.friends.some((f) => f.toString() === partnerId);

        if (!isFriend) {
          socket.emit("error", { message: "Unauthorized: Not a verified friend" });
          return;
        }

        const roomId = getRoomId(myId, partnerId);

        // Leave any previously joined rooms (except own socket room)
        for (const room of socket.rooms) {
          if (room !== socket.id) {
            socket.leave(room);
          }
        }

        socket.join(roomId);
        socket.currentRoom = roomId;
        socket.emit("room-joined", { roomId });

        console.log(`📩 ${socket.user.firstName} joined room: ${roomId}`);
      } catch (err) {
        console.error("join-room error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ─── SEND MESSAGE ────────────────────────────────────────────────────────
    // Client emits a text message. Server saves it and broadcasts to the room.
    // Attachment-based messages continue going through the REST API (/api/chat/send).
    socket.on("send-message", async ({ recipientId, content }) => {
      try {
        const senderId = socket.user._id.toString();

        if (!content?.trim()) return;

        // Re-verify friendship on each message (extra security layer)
        const sender = await User.findById(senderId).select("friends");
        const isFriend = sender.friends.some((f) => f.toString() === recipientId);

        if (!isFriend) {
          socket.emit("error", { message: "Unauthorized: Cannot message non-friend" });
          return;
        }

        // Persist to database
        const message = await Message.create({
          sender: senderId,
          recipient: recipientId,
          content: content.trim(),
          attachments: [],
        });

        const roomId = getRoomId(senderId, recipientId);

        // Emit to everyone in the room (sender + recipient if online)
        io.to(roomId).emit("receive-message", message);

      } catch (err) {
        console.error("send-message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ─── BROADCAST ATTACHMENT MESSAGE ─────────────────────────────────────────
    // When a file message is sent via REST, the sender emits this event
    // so the backend can rebroadcast to the recipient in the room.
    socket.on("broadcast-message", async ({ message, recipientId }) => {
      try {
        const senderId = socket.user._id.toString();
        // Verify the friendship still holds
        const sender = await User.findById(senderId).select("friends");
        const isFriend = sender.friends.some((f) => f.toString() === recipientId);
        if (!isFriend) return;

        const roomId = getRoomId(senderId, recipientId);
        // Broadcast only to the other side (socket.to = everyone except sender)
        socket.to(roomId).emit("receive-message", message);
      } catch (err) {
        console.error("broadcast-message error:", err);
      }
    });

    // ─── TYPING INDICATORS ──────────────────────────────────────────────────
    socket.on("typing", ({ recipientId }) => {
      const roomId = getRoomId(socket.user._id.toString(), recipientId);
      // Broadcast to partner only (not back to the typer)
      socket.to(roomId).emit("user-typing", { userId: socket.user._id });
    });

    socket.on("stop-typing", ({ recipientId }) => {
      const roomId = getRoomId(socket.user._id.toString(), recipientId);
      socket.to(roomId).emit("user-stop-typing", { userId: socket.user._id });
    });

    // ─── DISCONNECT ──────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.user?.firstName} (${socket.id})`);
    });
  });

  return io;
}
