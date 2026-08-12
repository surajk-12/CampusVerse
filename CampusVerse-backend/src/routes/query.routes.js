import express from "express";
import Query from "../models/Query.model.js";
import Answer from "../models/Answer.model.js";
import QueryComment from "../models/QueryComment.model.js";
import { protect, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Helper to handle upvoting/downvoting
function handleVote(votesArray, oppositeVotesArray, userId) {
  const userIdx = votesArray.indexOf(userId);
  const oppositeIdx = oppositeVotesArray.indexOf(userId);
  if (userIdx !== -1) {
    votesArray.splice(userIdx, 1);
  } else {
    votesArray.push(userId);
    if (oppositeIdx !== -1) oppositeVotesArray.splice(oppositeIdx, 1);
  }
}

// @route   GET /api/queries
// @desc    Get paginated queries with search, tags, and college filters
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search, tag, filter } = req.query;
    const mongoQuery = {};

    if (filter === "my-college") mongoQuery.college = req.user.college;
    if (tag && tag !== "All") mongoQuery.tags = tag;
    if (search) {
      const searchRegex = new RegExp(search, "i");
      mongoQuery.$or = [{ title: searchRegex }, { description: searchRegex }, { tags: searchRegex }];
    }

    const skip = (page - 1) * limit;
    const totalQueries = await Query.countDocuments(mongoQuery);
    const queries = await Query.find(mongoQuery)
      .populate("author", "firstName lastName photo course branch")
      .populate("college", "collegeName")
      .populate("acceptedAnswer")
      .sort({ isPinned: -1, createdAt: -1 }) // Pinned queries appear first
      .skip(skip)
      .limit(limit);

    res.status(200).json({ queries, totalPages: Math.ceil(totalQueries / limit), currentPage: page, totalQueries });
  } catch (error) {
    console.error("Error fetching queries:", error);
    res.status(500).json({ message: "Server error. Could not fetch queries." });
  }
});

// @route   GET /api/queries/:id
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const query = await Query.findById(req.params.id)
      .populate("author", "firstName lastName photo course branch")
      .populate("college", "collegeName");
    if (!query) return res.status(404).json({ message: "Query not found" });

    const answers = await Answer.find({ query: req.params.id })
      .populate("author", "firstName lastName photo course branch")
      .populate("college", "collegeName")
      .populate({ path: "comments", populate: [{ path: "author", select: "firstName lastName photo course branch" }, { path: "college", select: "collegeName" }] })
      .sort({ createdAt: 1 });

    res.status(200).json({ query, answers });
  } catch (error) {
    res.status(500).json({ message: "Server error. Could not fetch query detail." });
  }
});

// @route   POST /api/queries
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    if (!title || !description) return res.status(400).json({ message: "Title and description are required." });

    const formattedTags = Array.isArray(tags)
      ? tags.map((t) => t.trim().replace("#", "").toLowerCase()).filter(Boolean)
      : [];

    const newQuery = new Query({ title, description, author: req.user._id, college: req.user.college, tags: formattedTags, upvotes: [], downvotes: [] });
    await newQuery.save();

    const populatedQuery = await Query.findById(newQuery._id)
      .populate("author", "firstName lastName photo course branch")
      .populate("college", "collegeName");

    res.status(201).json(populatedQuery);
  } catch (error) {
    res.status(500).json({ message: "Server error. Could not create query." });
  }
});

// @route   DELETE /api/queries/:id
// @desc    Delete query — owner, college_admin/moderator (same college), or super_admin
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found" });

    const isOwner = query.author.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === "super_admin";
    const isCollegeScoped = ["college_admin", "moderator"].includes(req.user.role) && query.college.toString() === req.user.college?.toString();

    if (!isOwner && !isSuperAdmin && !isCollegeScoped) {
      return res.status(403).json({ message: "Access denied. Cannot delete this question." });
    }

    await Query.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Question deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// @route   DELETE /api/queries/answers/:answerId
// @desc    Delete answer — owner, college_admin/moderator (same college), or super_admin
// @access  Private
router.delete("/answers/:answerId", protect, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    const isOwner = answer.author.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === "super_admin";
    const isCollegeScoped = ["college_admin", "moderator"].includes(req.user.role) && answer.college.toString() === req.user.college?.toString();

    if (!isOwner && !isSuperAdmin && !isCollegeScoped) {
      return res.status(403).json({ message: "Access denied. Cannot delete this answer." });
    }

    await Answer.findByIdAndDelete(req.params.answerId);
    res.status(200).json({ message: "Answer deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// @route   POST /api/queries/:id/answers
// @access  Private
router.post("/:id/answers", protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Answer content is required." });

    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found" });

    const newAnswer = new Answer({ query: req.params.id, content, author: req.user._id, college: req.user.college, upvotes: [], downvotes: [], comments: [] });
    await newAnswer.save();

    query.answersCount = (query.answersCount || 0) + 1;
    await query.save();

    const populatedAnswer = await Answer.findById(newAnswer._id)
      .populate("author", "firstName lastName photo course branch")
      .populate("college", "collegeName")
      .populate("comments");

    res.status(201).json(populatedAnswer);
  } catch (error) {
    res.status(500).json({ message: "Server error. Could not post answer." });
  }
});

// @route   POST /api/queries/answers/:id/comments
// @access  Private
router.post("/answers/:id/comments", protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Comment content is required." });

    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    const newComment = new QueryComment({ answer: req.params.id, content, author: req.user._id, college: req.user.college });
    await newComment.save();

    answer.comments.push(newComment._id);
    await answer.save();

    const populatedComment = await QueryComment.findById(newComment._id)
      .populate("author", "firstName lastName photo course branch")
      .populate("college", "collegeName");

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: "Server error. Could not add comment." });
  }
});

// Vote endpoints
router.put("/:id/upvote", protect, async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found" });
    handleVote(query.upvotes, query.downvotes, req.user._id);
    await query.save();
    res.status(200).json({ upvotes: query.upvotes, downvotes: query.downvotes });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

router.put("/:id/downvote", protect, async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found" });
    handleVote(query.downvotes, query.upvotes, req.user._id);
    await query.save();
    res.status(200).json({ upvotes: query.upvotes, downvotes: query.downvotes });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

router.put("/answers/:id/upvote", protect, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: "Answer not found" });
    handleVote(answer.upvotes, answer.downvotes, req.user._id);
    await answer.save();
    res.status(200).json({ upvotes: answer.upvotes, downvotes: answer.downvotes });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

router.put("/answers/:id/downvote", protect, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: "Answer not found" });
    handleVote(answer.downvotes, answer.upvotes, req.user._id);
    await answer.save();
    res.status(200).json({ upvotes: answer.upvotes, downvotes: answer.downvotes });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

// @route   PUT /api/queries/:id/accept-answer/:answerId
// @access  Private (query author only)
router.put("/:id/accept-answer/:answerId", protect, async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found" });
    if (query.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the author of this question can accept an answer." });
    }
    const answer = await Answer.findById(req.query.answerId || req.params.answerId);
    if (!answer || answer.query.toString() !== query._id.toString()) {
      return res.status(400).json({ message: "Answer is not associated with this question." });
    }
    query.acceptedAnswer = (query.acceptedAnswer?.toString() === answer._id.toString()) ? undefined : answer._id;
    await query.save();
    const populatedQuery = await Query.findById(query._id)
      .populate("author", "firstName lastName photo course branch")
      .populate("college", "collegeName")
      .populate("acceptedAnswer");
    res.status(200).json(populatedQuery);
  } catch (error) {
    res.status(500).json({ message: "Server error. Could not accept answer." });
  }
});

// @route   PUT /api/queries/:id/pin
// @desc    Toggle pin — moderator, college_admin, super_admin only
// @access  Private
router.put("/:id/pin", protect, requireRole(["super_admin", "college_admin", "moderator"]), async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found" });

    if (req.user.role !== "super_admin" && query.college.toString() !== req.user.college?.toString()) {
      return res.status(403).json({ message: "You can only pin questions from your college." });
    }

    query.isPinned = !query.isPinned;
    await query.save();
    res.status(200).json({ isPinned: query.isPinned, message: query.isPinned ? "Question pinned." : "Question unpinned." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// @route   POST /api/queries/:id/report
// @desc    Report a query — any authenticated user
// @access  Private
router.post("/:id/report", protect, async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found" });
    if (query.reports.includes(req.user._id)) {
      return res.status(400).json({ message: "You have already reported this question." });
    }
    query.reports.push(req.user._id);
    await query.save();
    res.status(200).json({ message: "Question reported. Our team will review it.", reportCount: query.reports.length });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// @route   POST /api/queries/answers/:id/report
// @desc    Report an answer — any authenticated user
// @access  Private
router.post("/answers/:id/report", protect, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: "Answer not found" });
    if (answer.reports.includes(req.user._id)) {
      return res.status(400).json({ message: "You have already reported this answer." });
    }
    answer.reports.push(req.user._id);
    await answer.save();
    res.status(200).json({ message: "Answer reported. Our team will review it.", reportCount: answer.reports.length });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

export default router;
