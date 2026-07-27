import express from "express";
import Event from "../models/Event.model.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// @route   POST /api/events
// @desc    Create a new event (restricted to authorized Organizer profiles)
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, dateTime, location, category, registrationLink } = req.body;

    // Check if the user is an Organizer
    if (req.user.role !== "Organizer") {
      return res.status(403).json({ message: "Access denied. Only authorized Organizer accounts can create events." });
    }

    // Validate required fields
    if (!title || !description || !dateTime || !location || !category) {
      return res.status(400).json({ message: "All fields except registration link are required." });
    }

    const event = new Event({
      title,
      description,
      dateTime,
      location,
      category,
      registrationLink,
      organizingCollege: req.user.college,
      createdBy: req.user._id,
      registrations: [],
    });

    await event.save();
    
    // Populate organizingCollege info before returning
    const populatedEvent = await Event.findById(event._id)
      .populate("organizingCollege", "collegeName city")
      .populate("createdBy", "firstName lastName");

    res.status(201).json(populatedEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Server error. Could not create event." });
  }
});

// @route   GET /api/events
// @desc    Get all events with filters (date, category, college)
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const { category, timeFilter, collegeId } = req.query;
    const query = {};

    // Filter by Category
    if (category && category !== "All") {
      query.category = category;
    }

    // Filter by College
    if (collegeId) {
      query.organizingCollege = collegeId;
    }

    // Filter by Date (upcoming vs past vs all)
    const now = new Date();
    if (timeFilter === "upcoming") {
      query.dateTime = { $gte: now };
    } else if (timeFilter === "past") {
      query.dateTime = { $lt: now };
    }

    const events = await Event.find(query)
      .populate("organizingCollege", "collegeName city state")
      .populate("createdBy", "firstName lastName photo course branch")
      .sort({ dateTime: 1 }); // Sort chronologically (closest first)

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Server error. Could not fetch events." });
  }
});

// @route   POST /api/events/:eventId/register
// @desc    Register a student internally for an event
// @access  Private
router.post("/:eventId/register", protect, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is already registered
    if (event.registrations.includes(userId)) {
      return res.status(400).json({ message: "You are already registered for this event." });
    }

    // Add user ID to registrations list
    event.registrations.push(userId);
    await event.save();

    res.status(200).json({ message: "Successfully registered for the event!", registrations: event.registrations });
  } catch (error) {
    console.error("Error registering for event:", error);
    res.status(500).json({ message: "Server error. Could not complete registration." });
  }
});

// @route   POST /api/events/:eventId/unregister
// @desc    Unregister a student internally from an event
// @access  Private
router.post("/:eventId/unregister", protect, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Remove user ID from registrations list
    event.registrations = event.registrations.filter((id) => id.toString() !== userId.toString());
    await event.save();

    res.status(200).json({ message: "Successfully cancelled event registration.", registrations: event.registrations });
  } catch (error) {
    console.error("Error cancelling registration:", error);
    res.status(500).json({ message: "Server error. Could not cancel registration." });
  }
});

export default router;
