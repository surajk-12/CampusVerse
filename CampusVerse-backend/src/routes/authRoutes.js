import express from "express";
import { registerUser, loginUser, getProfile } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { uploadFields } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs for CampusVerse
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new student
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - gender
 *               - course
 *               - branch
 *               - passingYear
 *               - college
 *               - photo
 *               - collegeIdCard
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Suraj
 *               lastName:
 *                 type: string
 *                 example: Kumar
 *               email:
 *                 type: string
 *                 example: suraj@example.com
 *               password:
 *                 type: string
 *                 example: mypassword123
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *                 example: Male
 *               course:
 *                 type: string
 *                 example: B.Tech
 *               branch:
 *                 type: string
 *                 example: Computer Science
 *               passingYear:
 *                 type: Number
 *                 example: 2026
 *               college:
 *                 type: string
 *                 description: College ObjectId from registered colleges
 *                 example: 6500bcd123abc4567890def1
 *               photo:
 *                 type: string
 *                 format: binary
 *               collegeIdCard:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Student registered successfully
 *       400:
 *         description: Email already exists or missing fields
 */
router.post("/register", uploadFields, registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login student
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: suraj@example.com
 *               password:
 *                 type: string
 *                 example: mypassword123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get logged-in student profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched profile
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get("/me", protect, getProfile);

export default router;
