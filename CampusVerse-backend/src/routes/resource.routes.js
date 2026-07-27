import express from "express";
import path from "path";
import fs from "fs";
import Resource from "../models/Resource.model.js";
import documentUpload from "../middlewares/documentUpload.js";
import { protect } from "../middlewares/authMiddleware.js"; // assumes JWT authentication helper exists
import asyncHandler from "express-async-handler";

const router = express.Router();

/*
  =============================================================================
  💡 GUIDANCE FOR CLOUD STORAGE (AWS S3 or CLOUDINARY)
  =============================================================================
  To scale NotesVerse for production, you can replace the local file diskStorage
  with AWS S3 or Cloudinary using the following patterns:

  1. AWS S3 (using 'multer-s3' and '@aws-sdk/client-s3'):
     --------------------------------------------------
     import { S3Client } from "@aws-sdk/client-s3";
     import multerS3 from "multer-s3";

     const s3 = new S3Client({
       credentials: { accessKeyId: process.env.AWS_KEY, secretAccessKey: process.env.AWS_SECRET },
       region: process.env.AWS_REGION
     });

     const upload = multer({
       storage: multerS3({
         s3: s3,
         bucket: process.env.AWS_BUCKET_NAME,
         acl: "public-read",
         metadata: (req, file, cb) => { cb(null, { fieldName: file.fieldname }); },
         key: (req, file, cb) => { cb(null, `notes-${Date.now()}-${file.originalname}`); }
       })
     });

     In the controller, you would then save `req.file.location` as the `fileUrl` in MongoDB.

  2. Cloudinary (using 'multer-storage-cloudinary' and 'cloudinary'):
     ---------------------------------------------------------------
     import { v2 as cloudinary } from "cloudinary";
     import { CloudinaryStorage } from "multer-storage-cloudinary";

     cloudinary.config({
       cloud_name: process.env.CLOUDINARY_NAME,
       api_key: process.env.CLOUDINARY_API_KEY,
       api_secret: process.env.CLOUDINARY_API_SECRET
     });

     const storage = new CloudinaryStorage({
       cloudinary: cloudinary,
       params: {
         folder: "notesverse",
         resource_type: "raw", // important for non-image file types like PDF/Docx
         public_id: (req, file) => `notes-${Date.now()}-${file.originalname.split('.')[0]}`
       }
     });

     const upload = multer({ storage });
     
     In the controller, you would save `req.file.path` as the `fileUrl` in MongoDB.
  =============================================================================
*/

/**
 * @desc    Upload academic resource (Notes, syllabus, question paper)
 * @route   POST /api/resources
 * @access  Protected
 */
router.post(
  "/",
  protect,
  documentUpload.single("file"),
  asyncHandler(async (req, res) => {
    const { title, description, subjectCode, department, year, tags } = req.body;

    if (!req.file) {
      res.status(400);
      throw new Error("Please upload a file.");
    }

    if (!title || !subjectCode || !department || !year) {
      // Clean up uploaded file if validation failed
      fs.unlinkSync(req.file.path);
      res.status(400);
      throw new Error("Please fill in all required fields.");
    }

    // Process optional tags
    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === "string"
        ? tags.split(",").map((t) => t.trim()).filter(Boolean)
        : tags;
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const resource = await Resource.create({
      title,
      description,
      subjectCode,
      department,
      year,
      fileUrl,
      fileName: req.file.originalname,
      fileType: path.extname(req.file.originalname).substring(1),
      fileSize: req.file.size,
      tags: parsedTags,
      uploadedBy: req.user._id,
    });

    // Populate uploader detail
    const populated = await Resource.findById(resource._id).populate(
      "uploadedBy",
      "firstName lastName email photo"
    );

    res.status(201).json(populated);
  })
);

/**
 * @desc    Get resources with search queries and category filters
 * @route   GET /api/resources
 * @access  Protected
 */
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { search, department, year } = req.query;
    const filter = {};

    // Filter by department
    if (department && department !== "All") {
      filter.department = department;
    }

    // Filter by academic year
    if (year && year !== "All") {
      filter.year = year;
    }

    // Search query matches title, course code, or tags
    if (search) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { subjectCode: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ];
    }

    const resources = await Resource.find(filter)
      .populate("uploadedBy", "firstName lastName email photo")
      .sort({ createdAt: -1 });

    res.json(resources);
  })
);

/**
 * @desc    Download academic resource document securely
 * @route   GET /api/resources/:resourceId/download
 * @access  Protected
 */
router.get(
  "/:resourceId/download",
  protect,
  asyncHandler(async (req, res) => {
    const resource = await Resource.findById(req.params.resourceId);

    if (!resource) {
      res.status(404);
      throw new Error("Resource not found.");
    }

    // Get filename from local fileUrl (/uploads/notes-xxxx)
    const filename = resource.fileUrl.replace("/uploads/", "");
    const filePath = path.resolve("uploads", filename);

    if (!fs.existsSync(filePath)) {
      res.status(404);
      throw new Error("File does not exist on server.");
    }

    // Serve the document file stream as attachment download
    res.download(filePath, resource.fileName, (err) => {
      if (err) {
        console.error("File download error:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Could not download the file." });
        }
      }
    });
  })
);

export default router;
