import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";
import User from "../models/User.js";
import College from "../models/College.model.js";
import generateToken from "../utils/generateToken.js";

// Utility: delete files uploaded during this request in case of failure
const deleteRequestFiles = (req) => {
  const photoPath = req.files?.photo?.[0]?.path;
  const cardPath = req.files?.collegeIdCard?.[0]?.path;
  if (photoPath && fs.existsSync(photoPath)) fs.unlink(photoPath, () => {});
  if (cardPath && fs.existsSync(cardPath)) fs.unlink(cardPath, () => {});
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, gender, course, branch, passingYear, college } = req.body;

  // File uploads (multer stores them in req.files)
  const photo = req.files?.photo?.[0]?.filename; // use filename instead of full path
  const collegeIdCard = req.files?.collegeIdCard?.[0]?.filename;

  try {
    // Check required fields
    if (!firstName || !email || !password || !gender || !course || !branch || !passingYear || !college) {
      res.status(400);
      throw new Error("Please fill all required fields");
    }
    if (!photo || !collegeIdCard) {
      res.status(400);
      throw new Error("Photo and College ID card are required");
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error("Email already registered");
    }

    // ✅ Ensure the college exists
    const collegeDoc = await College.findById(college);
    if (!collegeDoc) {
      res.status(400);
      throw new Error("College not found");
    }

    // ✅ Create student
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      gender,
      course,
      branch,
      passingYear,
      college: collegeDoc._id,
      photo,
      collegeIdCard,
    });

    // ✅ Push student into college's students array
    if (collegeDoc.students) {
      collegeDoc.students.push(user._id);
      await collegeDoc.save();
    }

    if (user) {
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        course: user.course,
        branch: user.branch,
        passingYear: user.passingYear,
        college: user.college,
        photo: user.photo,
        collegeIdCard: user.collegeIdCard,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error("Invalid student data");
    }
  } catch (error) {
    deleteRequestFiles(req);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(400);
    }
    throw error;
  }
});

// @desc    Login student
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Get logged-in student profile
// @route   GET /api/auth/me
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export { registerUser, loginUser, getProfile };
