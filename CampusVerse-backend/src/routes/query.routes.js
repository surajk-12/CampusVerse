import express from "express";
import Query from "../models/Query.model.js";
import Answer from "../models/Answer.model.js";
import QueryComment from "../models/QueryComment.model.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Helper to handle upvoting/downvoting
function handleVote(votesArray, oppositeVotesArray, userId) {
  const userIdx = votesArray.indexOf(userId);
  const oppositeIdx = oppositeVotesArray.indexOf(userId);

  if (userIdx !== -1) {
    // Already voted, remove vote
    votesArray.splice(userIdx, 1);
  } else {
    // Not voted, add vote and remove from opposite vote if present
    votesArray.push(userId);
    if (oppositeIdx !== -1) {
      oppositeVotesArray.splice(oppositeIdx, 1);
    }
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

    // Filter by My College
    if (filter === "my-college") {
      mongoQuery.college = req.user.college;
    }

    // Filter by specific tag
    if (tag && tag !== "All") {
      mongoQuery.tags = tag;
    }

    // Filter by textual search query
    if (search) {
      const searchRegex = new RegExp(search, "i");
      mongoQuery.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const totalQueries = await Query.countDocuments(mongoQuery);
    const queries = await Query.find(mongoQuery)
      .populate("author", "firstName lastName photo course branch")
      .populate("college", "collegeName")
      .populate("acceptedAnswer")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalQueries / limit);

    res.status(200).json({
      queries,
      totalPages,
      currentPage: page,
      totalQueries,
    });
  } catch (error) {
    console.error("Error fetching queries:", error);
    res.status(500).json({ message: "Server error. Could not fetch queries." });
  }
});

// @route   GET /api/queries/:id
// @desc    Get single query detail with all populated answers and comments
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const query = await Query.findById(req.params.id)
      .populate("author", "firstName lastName photo course branch")
      .populate("college", "collegeName");

    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    // Fetch and populate all answers and their subcomments
    const answers = await Answer.find({ query: req.params.id })
      .populate("author", "firstName lastName photo course branch")
      .populate("college", "collegeName")
      .populate({
        path: "comments",
        populate: [
          { path: "author", select: "firstName lastName photo course branch" },
          { path: "college", select: "collegeName" }
        ]
      })
      .sort({ createdAt: 1 });

    res.status(200).json({ query, answers });
  } catch (error) {
    console.error("Error fetching query detail:", error);
    res.status(500).json({ message: "Server error. Could not fetch query detail." });
  }
});

// @route   POST /api/queries
// @desc    Create a new campus query/discussion
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { title, description, tags } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    // Format tags: ensure lowercased and strip spaces/hashes
    const formattedTags = Array.isArray(tags)
      ? tags.map((t) => t.trim().replace("#", "").toLowerCase()).filter(Boolean)
      : [];

    const newQuery = new Query({
      title,
      description,
      author: req.user._id,
      college: req.user.college,
      tags: formattedTags,
      upvotes: [],
      downvotes: [],
    });

    await newQuery.save();

    const populatedQuery = await Query.findById(newQuery._id)
      .populate("author", "firstName lastName photo course branch")
      .populate("college", "collegeName");

    res.status(201).json(populatedQuery);
  } catch (error) {
    console.error("Error creating query:", error);
    res.status(500).json({ message: "Server error. Could not create query." });
  }
});

// @route   POST /api/queries/:id/answers
// @desc    Answer a campus query
// @access  Private
router.post("/:id/answers", protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Answer content is required." });
    }

    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    const newAnswer = new Answer({
      query: req.params.id,
      content,
      author: req.user._id,
      college: req.user.college,
      upvotes: [],
      downvotes: [],
      comments: [],
    });

    await newAnswer.save();

    // Increment answers count on the query
    query.answersCount = (query.answersCount || 0) + 1;
    await query.save();

    const populatedAnswer = await Answer.findById(newAnswer._id)
      .populate("author", "firstName lastName photo course branch")
      .populate("college", "collegeName")
      .populate("comments");

    res.status(201).json(populatedAnswer);
  } catch (error) {
    console.error("Error creating answer:", error);
    res.status(500).json({ message: "Server error. Could not post answer." });
  }
});

// @route   POST /api/answers/:id/comments
// @desc    Add a sub-reply/comment to an answer
// @access  Private
router.post("/answers/:id/comments", protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Comment content is required." });
    }

    const answer = await Answer.findById(req.params.id);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    const newComment = new QueryComment({
      answer: req.params.id,
      content,
      author: req.user._id,
      college: req.user.college,
    });

    await newComment.save();

    answer.comments.push(newComment._id);
    await answer.save();

    const populatedComment = await QueryComment.findById(newComment._id)
      .populate("author", "firstName lastName photo course branch")
      .populate("college", "collegeName");

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Server error. Could not add comment." });
  }
});

// @route   PUT /api/queries/:id/upvote
// @desc    Upvote a query
// @access  Private
router.put("/:id/upvote", protect, async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found" });

    handleVote(query.upvotes, query.downvotes, req.user._id);
    await query.save();

    res.status(200).json({ upvotes: query.upvotes, downvotes: query.downvotes });
  } catch (error) {
    console.error("Error upvoting query:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/queries/:id/downvote
// @desc    Downvote a query
// @access  Private
router.put("/:id/downvote", protect, async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found" });

    handleVote(query.downvotes, query.upvotes, req.user._id);
    await query.save();

    res.status(200).json({ upvotes: query.upvotes, downvotes: query.downvotes });
  } catch (error) {
    console.error("Error downvoting query:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/answers/:id/upvote
// @desc    Upvote an answer
// @access  Private
router.put("/answers/:id/upvote", protect, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    handleVote(answer.upvotes, answer.downvotes, req.user._id);
    await answer.save();

    res.status(200).json({ upvotes: answer.upvotes, downvotes: answer.downvotes });
  } catch (error) {
    console.error("Error upvoting answer:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/answers/:id/downvote
// @desc    Downvote an answer
// @access  Private
router.put("/answers/:id/downvote", protect, async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: "Answer not found" });

    handleVote(answer.downvotes, answer.upvotes, req.user._id);
    await answer.save();

    res.status(200).json({ upvotes: answer.upvotes, downvotes: answer.downvotes });
  } catch (error) {
    console.error("Error downvoting answer:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/queries/:id/accept-answer/:answerId
// @desc    Mark one answer as the accepted / best solution
// @access  Private
router.put("/:id/accept-answer/:answerId", protect, async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    // Verify ownership
    if (query.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the author of this question can accept an answer." });
    }

    // Verify answer belongs to this query
    const answer = await Answer.findById(req.query.answerId || req.params.answerId);
    if (!answer || answer.query.toString() !== query._id.toString()) {
      return res.status(400).json({ message: "Answer is not associated with this question." });
    }

    // Set or toggle accepted solution
    if (query.acceptedAnswer && query.acceptedAnswer.toString() === answer._id.toString()) {
      query.acceptedAnswer = undefined;
    } else {
      query.acceptedAnswer = answer._id;
    }

    await query.save();

    const populatedQuery = await Query.findById(query._id)
      .populate("author", "firstName lastName photo course branch")
      .populate("college", "collegeName")
      .populate("acceptedAnswer");

    res.status(200).json(populatedQuery);
  } catch (error) {
    console.error("Error accepting answer:", error);
    res.status(500).json({ message: "Server error. Could not accept answer." });
  }
});

export default router;
