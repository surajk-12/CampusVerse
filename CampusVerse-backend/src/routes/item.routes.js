import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Item from "../models/Item.model.js";
import { protect } from "../middlewares/authMiddleware.js";
import asyncHandler from "express-async-handler";

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
    cb(null, `item-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per image
  fileFilter(req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed (jpeg, jpg, png, webp)!"), false);
    }
  },
});

// Multer handles up to 5 files for the field "images"
const itemUpload = upload.array("images", 5);

/**
 * @desc    Create marketplace listing
 * @route   POST /api/items
 * @access  Private
 */
router.post(
  "/",
  protect,
  (req, res, next) => {
    itemUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    const { title, description, price, category, condition, campusLocation } = req.body;

    if (!title || !description || !price || !category || !condition || !campusLocation) {
      // Clean up uploaded files if validation fails
      if (req.files) {
        req.files.forEach((f) => fs.unlinkSync(f.path));
      }
      res.status(400);
      throw new Error("Please fill in all required fields.");
    }

    if (!req.files || req.files.length === 0) {
      res.status(400);
      throw new Error("Please upload at least one image of the item.");
    }

    const images = req.files.map((file) => `/uploads/${file.filename}`);

    const item = await Item.create({
      title,
      description,
      price: Number(price),
      images,
      category,
      condition,
      campusLocation,
      seller: req.user._id,
      status: "Available",
    });

    const populated = await Item.findById(item._id).populate(
      "seller",
      "firstName lastName email photo friends"
    );

    res.status(201).json(populated);
  })
);

/**
 * @desc    Fetch marketplace listings with search & filter
 * @route   GET /api/items
 * @access  Private
 */
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { category, campusLocation, search, status } = req.query;
    const filter = {};

    // Filter by available/sold status (default to Available if not specified)
    if (status) {
      filter.status = status;
    } else {
      // Show available ones first, or show all
      // Filter can be omitted or let it return all items sorted by available first
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    if (campusLocation && campusLocation !== "All") {
      filter.campusLocation = campusLocation;
    }

    if (search) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    // Return items sorted by availability and then latest creation
    const items = await Item.find(filter)
      .populate("seller", "firstName lastName email photo friends")
      .sort({ status: 1, createdAt: -1 });

    res.json(items);
  })
);

/**
 * @desc    Update listing details (edit text or change status to Sold)
 * @route   PUT /api/items/:itemId
 * @access  Private
 */
router.put(
  "/:itemId",
  protect,
  asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.itemId);

    if (!item) {
      res.status(404);
      throw new Error("Listing not found.");
    }

    // Ensure user is uploader
    if (item.seller.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You are not authorized to edit this listing.");
    }

    const { title, description, price, category, condition, status, campusLocation } = req.body;

    item.title = title || item.title;
    item.description = description || item.description;
    item.price = price !== undefined ? Number(price) : item.price;
    item.category = category || item.category;
    item.condition = condition || item.condition;
    item.status = status || item.status;
    item.campusLocation = campusLocation || item.campusLocation;

    await item.save();

    const populated = await Item.findById(item._id).populate(
      "seller",
      "firstName lastName email photo friends"
    );

    res.json(populated);
  })
);

/**
 * @desc    Delete marketplace listing
 * @route   DELETE /api/items/:itemId
 * @access  Private
 */
router.delete(
  "/:itemId",
  protect,
  asyncHandler(async (req, res) => {
    const item = await Item.findById(req.params.itemId);

    if (!item) {
      res.status(404);
      throw new Error("Listing not found.");
    }

    // Ensure user is uploader
    if (item.seller.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You are not authorized to delete this listing.");
    }

    // Delete associated files locally
    if (item.images && item.images.length > 0) {
      item.images.forEach((imgUrl) => {
        const filename = imgUrl.replace("/uploads/", "");
        const filePath = path.resolve("uploads", filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error("Failed to delete image file:", filePath, e.message);
          }
        }
      });
    }

    await Item.findByIdAndDelete(req.params.itemId);
    res.json({ message: "Listing deleted successfully." });
  })
);

export default router;
