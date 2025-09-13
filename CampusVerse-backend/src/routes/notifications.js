import express from "express";
import Notification from "../models/Notification.model.js";
import User from "../models/User.js";

const router = express.Router();

// Get all notifications sent by a user
router.get("/sent-by/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const sentNotifications = await Notification.find({ from: userId })
      .populate("to", "firstName lastName email course branch")
      .sort({ createdAt: -1 });

    res.status(200).json(sentNotifications);
  } catch (err) {
    console.error("Error fetching sent notifications:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Create a new notification (send request)
router.post("/", async (req, res) => {
  try {
    const { from, to } = req.body;
    if (!from || !to) return res.status(400).json({ message: "From and To are required" });

    // Check if request already exists and is pending
    const existing = await Notification.findOne({ from, to, status: "pending" });
    if (existing) return res.status(400).json({ message: "Request already sent" });

    const notification = new Notification({ from, to });
    await notification.save();

    res.status(201).json(notification);
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all notifications for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ to: userId })
      .populate("from", "firstName lastName email course branch")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update notification status (accept/reject)
router.patch("/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { status } = req.body; // accepted | rejected

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { status },
      { new: true }
    );

    if (!notification) return res.status(404).json({ message: "Notification not found" });

    res.status(200).json(notification);
  } catch (err) {
    console.error("Error updating notification:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Send friend request
router.post("/send-request", async (req, res) => {
  const { from, to } = req.body;

  try {
    const fromUser = await User.findById(from);

    if (fromUser.friends.includes(to)) {
      return res.status(400).json({ message: "You are already friends!" });
    }

    const existingRequest = await Notification.findOne({ from, to, type: "request" });
    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent!" });
    }

    const notification = await Notification.create({ from, to, type: "request" });
    res.status(200).json(notification);
  } catch (err) {
    res.status(500).json({ message: "Error sending request", error: err });
  }
});

// Accept friend request
router.post("/accept", async (req, res) => {
  const { from, to } = req.body; // 'from' sent request, 'to' accepting

  try {
    const fromUser = await User.findById(from);
    const toUser = await User.findById(to);

    if (!fromUser.friends.includes(to)) fromUser.friends.push(to);
    if (!toUser.friends.includes(from)) toUser.friends.push(from);

    await fromUser.save();
    await toUser.save();

    await Notification.findOneAndUpdate(
      { from, to, type: "request" },
      { type: "request_accepted", status: "accepted", message: "You are now friends!" }
    );

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    res.status(500).json({ message: "Error accepting request", error: err });
  }
});

export default router;
