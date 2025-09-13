import express from "express";
import College from "../models/College.model.js";
import User from "../models/User.js"

const router = express.Router();

// @route   POST /api/colleges/register
// @desc    Register a new college
// @access  Public (or Admin if you want to restrict)

/**
 * @swagger
 * tags:
 *   name: Colleges
 *   description: College management APIs
 */

/**
 * @swagger
 * /api/colleges/register:
 *   post:
 *     summary: Register a new college
 *     tags: [Colleges]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - collegeName
 *               - country
 *               - state
 *               - city
 *               - pincode
 *               - address
 *             properties:
 *               collegeName:
 *                 type: string
 *                 example: Delhi University
 *               country:
 *                 type: string
 *                 example: India
 *               state:
 *                 type: string
 *                 example: Delhi
 *               city:
 *                 type: string
 *                 example: New Delhi
 *               pincode:
 *                 type: string
 *                 example: 110007
 *               address:
 *                 type: string
 *                 example: North Campus, Delhi
 *     responses:
 *       201:
 *         description: College registered successfully
 *       400:
 *         description: College already exists or missing fields
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/colleges/{collegeId}/students:
 *   get:
 *     summary: Get all students of a college
 *     tags: [Colleges]
 *     parameters:
 *       - in: path
 *         name: collegeId
 *         required: true
 *         schema:
 *           type: string
 *         description: College ObjectId
 *     responses:
 *       200:
 *         description: List of students in the given college
 *       404:
 *         description: College not found
 *       500:
 *         description: Server error
 */

router.get("/:collegeId/students", async (req, res) => {
  try {
    const { collegeId } = req.params;

    // Check if college exists
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }

    // Find students linked to this college
    const students = await User.find({ college: collegeId }).select(
      "firstName lastName email gender course branch passingYear"
    );

    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single college details by ID
router.get("/:collegeId", async (req, res) => {
  try {
    const { collegeId } = req.params;
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ message: "College not found" });
    }
    res.status(200).json(college);
  } catch (error) {
    console.error("Error fetching college:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/", async (req, res) => {
  try {
    const colleges = await College.find().sort({ collegeName: 1 });
    res.status(200).json(colleges);
  } catch (error) {
    console.error("Error fetching colleges:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { collegeName, country, state, city, pincode, address } = req.body;

    // Validate required fields
    if (!collegeName || !country || !state || !city || !pincode || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if college already exists
    const existingCollege = await College.findOne({ collegeName });
    if (existingCollege) {
      return res.status(400).json({ message: "College already registered" });
    }

    // Save new college
    const newCollege = new College({
      collegeName: collegeName.trim(),
      country,
      state,
      city,
      pincode,
      address,
      students: [],
    });

    await newCollege.save();

    res.status(201).json({
      message: "College registered successfully",
      college: newCollege,
    });
  } catch (error) {
    console.error("Error registering college:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
