import express from "express";
import Post from "../models/Post.model.js";
import Comment from "../models/Comment.model.js";
import { protect } from "../middlewares/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Helper to anonymize author information and tag editable ownership
const anonymizeAuthor = (item, requestingUserId) => {
  if (!item) return null;
  const obj = typeof item.toObject === "function" ? item.toObject({ virtuals: true }) : { ...item };
  
  // Safely extract author ID string (populated or raw ObjectId)
  const authorIdStr = obj.author && (obj.author._id ? obj.author._id.toString() : obj.author.toString());
  obj.isEditable = !!(authorIdStr && requestingUserId && authorIdStr === requestingUserId.toString());

  if (obj.isAnonymous) {
    obj.author = {
      _id: "anonymous",
      firstName: "Anonymous",
      lastName: "Student",
      photo: null,
      course: "Campus",
      branch: "Community",
    };
  }
  return obj;
};

const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(null, `feed-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB file size
  fileFilter(req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|quicktime/;
    const ext = path.extname(file.originalname).toLowerCase();
    const isExtAllowed = allowedTypes.test(ext);
    const isMimeAllowed = allowedTypes.test(file.mimetype) || file.mimetype.startsWith("video/") || file.mimetype.startsWith("image/");

    if (isExtAllowed || isMimeAllowed) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type! Only images and videos are allowed."));
    }
  },
});

const feedUpload = upload.array("files", 5); // Allow up to 5 attachments per post

// @route   POST /api/feed/posts
// @desc    Create a new post with optional attachments
// @access  Private
router.post("/posts", protect, (req, res) => {
  feedUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { title, content, isAnonymous } = req.body;
      const author = req.user._id;
      const college = req.user.college; // Auto-link to logged-in user's college

      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required." });
      }

      const attachments = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          let fileType = "image";
          const ext = path.extname(file.originalname).toLowerCase();
          const mime = file.mimetype.toLowerCase();

          if (mime.startsWith("video/") || /\.(mp4|webm|mov|avi|quicktime)$/.test(ext)) {
            fileType = "video";
          }

          attachments.push({
            fileType,
            url: file.filename,
          });
        }
      }

      const post = new Post({
        title,
        content,
        college,
        author,
        isAnonymous: isAnonymous === "true" || isAnonymous === true,
        upvotes: [author], // Auto upvote by creator
        downvotes: [],
        attachments,
      });

      await post.save();
      
      // Populate before returning
      const populated = await Post.findById(post._id).populate("author", "firstName lastName photo course branch");
      res.status(201).json(anonymizeAuthor(populated, req.user._id));
    } catch (err) {
      console.error("Error creating post:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// @route   GET /api/feed/posts/:collegeId
// @desc    Get all posts for a specific college
// @access  Private
router.get("/posts/:collegeId", protect, async (req, res) => {
  try {
    const { collegeId } = req.params;
    const posts = await Post.find({ college: collegeId })
      .populate("author", "firstName lastName photo course branch")
      .sort({ createdAt: -1 });

    const securedPosts = posts.map(post => anonymizeAuthor(post, req.user._id));
    res.status(200).json(securedPosts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/feed/posts/:postId
// @desc    Delete a post (only creator can delete)
// @access  Private
router.delete("/posts/:postId", protect, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Verify creator
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    // Delete associated comments
    await Comment.deleteMany({ post: postId });
    await post.deleteOne();

    res.status(200).json({ message: "Post and comments deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/feed/posts/:postId/vote
// @desc    Upvote or downvote a post
// @access  Private
router.post("/posts/:postId/vote", protect, async (req, res) => {
  try {
    const { postId } = req.params;
    const { direction } = req.body; // 'up' or 'down'
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const upvoteIndex = post.upvotes.findIndex(id => id.toString() === userId.toString());
    const downvoteIndex = post.downvotes.findIndex(id => id.toString() === userId.toString());

    if (direction === "up") {
      if (upvoteIndex > -1) {
        // Toggle off
        post.upvotes.splice(upvoteIndex, 1);
      } else {
        // Add upvote, remove downvote if exists
        post.upvotes.push(userId);
        if (downvoteIndex > -1) post.downvotes.splice(downvoteIndex, 1);
      }
    } else if (direction === "down") {
      if (downvoteIndex > -1) {
        // Toggle off
        post.downvotes.splice(downvoteIndex, 1);
      } else {
        // Add downvote, remove upvote if exists
        post.downvotes.push(userId);
        if (upvoteIndex > -1) post.upvotes.splice(upvoteIndex, 1);
      }
    }

    await post.save();
    
    // Repopulate and return
    const updated = await Post.findById(postId).populate("author", "firstName lastName photo course branch");
    res.status(200).json(anonymizeAuthor(updated, req.user._id));
  } catch (err) {
    console.error("Error voting:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/feed/posts/:postId/comments
// @desc    Add a comment to a post
// @access  Private
router.post("/posts/:postId/comments", protect, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, isAnonymous } = req.body;
    const author = req.user._id;

    if (!content) return res.status(400).json({ message: "Comment content is required" });

    const postExists = await Post.findById(postId);
    if (!postExists) return res.status(404).json({ message: "Post not found" });

    const comment = new Comment({
      post: postId,
      author,
      content,
      isAnonymous: !!isAnonymous,
    });

    await comment.save();

    const populated = await Comment.findById(comment._id).populate("author", "firstName lastName photo course branch");
    res.status(201).json(anonymizeAuthor(populated, req.user._id));
  } catch (err) {
    console.error("Error creating comment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/feed/posts/:postId/comments
// @desc    Get comments for a post
// @access  Private
router.get("/posts/:postId/comments", protect, async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate("author", "firstName lastName photo course branch")
      .sort({ createdAt: 1 });

    const securedComments = comments.map(c => anonymizeAuthor(c, req.user._id));
    res.status(200).json(securedComments);
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/feed/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete("/comments/:commentId", protect, async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await comment.deleteOne();
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
