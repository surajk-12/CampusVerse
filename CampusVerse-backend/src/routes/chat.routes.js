import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `chat-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB file size
  fileFilter(req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|quicktime|mp3|wav|ogg|mpeg|m4a|aac|octet-stream/;
    const ext = path.extname(file.originalname).toLowerCase();
    const isExtAllowed = allowedTypes.test(ext);
    const isMimeAllowed = allowedTypes.test(file.mimetype) || file.mimetype.startsWith("audio/") || file.mimetype.startsWith("video/") || file.mimetype.startsWith("image/");

    if (isExtAllowed || isMimeAllowed) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type! Only images, videos, and audios are allowed."));
    }
  },
});

const chatUpload = upload.array("files", 10); // Allow up to 10 files per message

// @route   POST /api/chat/send
// @desc    Send a message (text and/or multiple file attachments) to a friend
// @access  Private
router.post("/send", protect, (req, res) => {
  chatUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { recipientId, content } = req.body;
      const senderId = req.user._id;

      if (!recipientId) {
        return res.status(400).json({ message: "Recipient ID is required" });
      }

      // Verify friendship exists before allowing messaging
      const sender = await User.findById(senderId);
      if (!sender.friends.includes(recipientId)) {
        return res.status(400).json({ message: "You can only message verified friends" });
      }

      const attachments = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          let fileType = "image";
          const ext = path.extname(file.originalname).toLowerCase();
          const mime = file.mimetype.toLowerCase();

          if (mime.startsWith("video/") || /\.(mp4|webm|mov|avi|quicktime)$/.test(ext)) {
            fileType = "video";
          } else if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac)$/.test(ext)) {
            fileType = "audio";
          }
          
          attachments.push({
            fileType,
            url: file.filename,
          });
        }
      }

      if (!content && attachments.length === 0) {
        return res.status(400).json({ message: "Message content or file attachments are required" });
      }

      const message = new Message({
        sender: senderId,
        recipient: recipientId,
        content: (content || "").trim(),
        attachments,
      });

      await message.save();
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// @route   GET /api/chat/history/:partnerId
// @desc    Get chronological chat history with a specific friend
// @access  Private
router.get("/history/:partnerId", protect, async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: partnerId },
        { sender: partnerId, recipient: userId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching message history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
