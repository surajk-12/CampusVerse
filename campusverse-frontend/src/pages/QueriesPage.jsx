import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  Avatar,
  IconButton,
  Divider,
  CircularProgress,
  Grid,
  Chip,
  Modal,
  FormControlLabel,
  Switch,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import {
  HelpOutline,
  ThumbUp,
  ThumbDown,
  Comment as CommentIcon,
  CheckCircle,
  CheckCircleOutline,
  Search,
  Close,
  ChevronLeft,
  ChevronRight,
  Add,
  ArrowBack,
  QuestionAnswer,
  School,
  AccessTime,
  Person,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../api/axios.js";
import AiCopilot from "../components/AiCopilot.jsx";

const PRESET_TAGS = ["All", "exams", "placements", "tech", "hostellife", "academics", "sports", "general"];

// Simple relative time helper
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  if (isNaN(diffMs) || diffMs < 0) return "Just now";
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDays}d ago`;
};

export default function QueriesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

  const [queries, setQueries] = useState([]);
  const [totalQueries, setTotalQueries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [myCollegeOnly, setMyCollegeOnly] = useState(false);
  const [aiFilteredIds, setAiFilteredIds] = useState(null);

  // Ask Question Modal State
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTags, setNewTags] = useState("");
  const [submittingQuery, setSubmittingQuery] = useState(false);

  // Detail View State (Single Query Detail)
  const [detailQuery, setDetailQuery] = useState(null);
  const [detailAnswers, setDetailAnswers] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Answer & Comment Form Inputs
  const [answerContent, setAnswerContent] = useState("");
  const [commentContents, setCommentContents] = useState({}); // mapping answerId -> commentText

  // Fetch queries list
  const fetchQueries = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get("/queries", {
        params: {
          page,
          limit: 10,
          search: searchQuery,
          tag: selectedTag !== "All" ? selectedTag : undefined,
          filter: myCollegeOnly ? "my-college" : undefined,
        },
      });
      setQueries(data.queries || []);
      setTotalPages(data.totalPages || 1);
      setTotalQueries(data.totalQueries || 0);
      setCurrentPage(data.currentPage || 1);
    } catch (err) {
      console.error("Error fetching queries:", err);
      showToast("Failed to load queries.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on filter updates
  useEffect(() => {
    fetchQueries(1);
  }, [selectedTag, myCollegeOnly, searchQuery]);

  // Fetch single query detail
  const fetchQueryDetail = async (queryId) => {
    setLoadingDetail(true);
    try {
      const { data } = await api.get(`/queries/${queryId}`);
      setDetailQuery(data.query);
      setDetailAnswers(data.answers || []);
    } catch (err) {
      console.error("Error fetching query detail:", err);
      showToast("Failed to load query details.", "error");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Upvote/Downvote query
  const handleQueryVote = async (queryId, isUpvote) => {
    try {
      const endpoint = `/queries/${queryId}/${isUpvote ? "upvote" : "downvote"}`;
      const { data } = await api.put(endpoint);

      // Update in queries list
      setQueries((prev) =>
        prev.map((q) => (q._id === queryId ? { ...q, upvotes: data.upvotes, downvotes: data.downvotes } : q))
      );

      // Update in detail view
      if (detailQuery && detailQuery._id === queryId) {
        setDetailQuery((prev) => ({ ...prev, upvotes: data.upvotes, downvotes: data.downvotes }));
      }
    } catch (err) {
      console.error("Error voting query:", err);
      showToast("Failed to register vote.", "error");
    }
  };

  // Upvote/Downvote answer
  const handleAnswerVote = async (answerId, isUpvote) => {
    try {
      const endpoint = `/queries/answers/${answerId}/${isUpvote ? "upvote" : "downvote"}`;
      const { data } = await api.put(endpoint);

      setDetailAnswers((prev) =>
        prev.map((ans) => (ans._id === answerId ? { ...ans, upvotes: data.upvotes, downvotes: data.downvotes } : ans))
      );
    } catch (err) {
      console.error("Error voting answer:", err);
      showToast("Failed to register vote.", "error");
    }
  };

  // Ask Question submit
  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      showToast("Please enter a title and description.", "warning");
      return;
    }

    setSubmittingQuery(true);
    try {
      const tagsArray = newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const { data } = await api.post("/queries", {
        title: newTitle,
        description: newDescription,
        tags: tagsArray,
      });

      setQueries((prev) => [data, ...prev]);
      showToast("Question posted successfully!", "success");
      setNewTitle("");
      setNewDescription("");
      setNewTags("");
      setAskModalOpen(false);
    } catch (err) {
      console.error("Error posting query:", err);
      showToast("Could not post question.", "error");
    } finally {
      setSubmittingQuery(false);
    }
  };

  // Submit Answer
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerContent.trim()) return;

    try {
      const { data } = await api.post(`/queries/${detailQuery._id}/answers`, {
        content: answerContent,
      });

      setDetailAnswers((prev) => [...prev, data]);
      setAnswerContent("");
      showToast("Answer posted successfully!", "success");

      // Increment locally
      setQueries((prev) =>
        prev.map((q) => (q._id === detailQuery._id ? { ...q, answersCount: (q.answersCount || 0) + 1 } : q))
      );
    } catch (err) {
      console.error("Error posting answer:", err);
      showToast("Could not post answer.", "error");
    }
  };

  // Submit Comment (nested reply to an answer)
  const handleCommentSubmit = async (answerId) => {
    const text = commentContents[answerId];
    if (!text || !text.trim()) return;

    try {
      const { data } = await api.post(`/queries/answers/${answerId}/comments`, {
        content: text,
      });

      setDetailAnswers((prev) =>
        prev.map((ans) => (ans._id === answerId ? { ...ans, comments: [...ans.comments, data] } : ans))
      );

      // Clear input
      setCommentContents((prev) => ({ ...prev, [answerId]: "" }));
      showToast("Reply comment added!", "success");
    } catch (err) {
      console.error("Error posting comment:", err);
      showToast("Could not post reply.", "error");
    }
  };

  // Mark answer as Accepted / Solution
  const handleAcceptAnswer = async (answerId) => {
    try {
      const { data } = await api.put(`/queries/${detailQuery._id}/accept-answer/${answerId}`);
      setDetailQuery(data);
      showToast(
        data.acceptedAnswer === answerId
          ? "Accepted this answer as the best solution!"
          : "Removed accepted status.",
        "success"
      );
    } catch (err) {
      console.error("Error accepting solution:", err);
      showToast(err.response?.data?.message || "Could not toggle accepted solution.", "error");
    }
  };

  const queriesToDisplay = aiFilteredIds
    ? queries.filter((q) => aiFilteredIds.includes(q._id))
    : queries;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      {detailQuery ? (
        /* ================== DETAIL VIEW ================== */
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => setDetailQuery(null)}
            sx={{ mb: 4, textTransform: "none", fontWeight: 700 }}
          >
            Back to Discussions
          </Button>

          {loadingDetail ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={45} />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Question Column */}
              <Grid item xs={12} md={9}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    background: "rgba(30, 41, 59, 0.25)",
                    backdropFilter: "blur(12px)",
                    mb: 4,
                  }}
                >
                  <Stack direction="row" spacing={3} alignItems="flex-start">
                    {/* Voting */}
                    <Stack alignItems="center" spacing={1} sx={{ bgcolor: "rgba(255,255,255,0.02)", p: 1.5, borderRadius: "12px", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <IconButton
                        size="small"
                        onClick={() => handleQueryVote(detailQuery._id, true)}
                        sx={{ color: detailQuery.upvotes?.includes(user._id) ? "primary.main" : "text.secondary" }}
                      >
                        <ThumbUp sx={{ fontSize: 18 }} />
                      </IconButton>
                      <Typography variant="subtitle2" fontWeight={850} color="text.primary">
                        {(detailQuery.upvotes?.length || 0) - (detailQuery.downvotes?.length || 0)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleQueryVote(detailQuery._id, false)}
                        sx={{ color: detailQuery.downvotes?.includes(user._id) ? "error.main" : "text.secondary" }}
                      >
                        <ThumbDown sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Stack>

                    {/* Content */}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" fontWeight={900} color="text.primary" sx={{ mb: 1.5 }}>
                        {detailQuery.title}
                      </Typography>

                      <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mb: 3 }}>
                        {detailQuery.tags?.map((t) => (
                          <Chip
                            key={t}
                            label={`#${t}`}
                            size="small"
                            sx={{
                              bgcolor: "rgba(79, 70, 229, 0.08)",
                              color: "primary.light",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                            }}
                          />
                        ))}
                      </Stack>

                      <Typography
                        variant="body1"
                        color="text.primary"
                        sx={{ fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-line", mb: 4 }}
                      >
                        {detailQuery.description}
                      </Typography>

                      <Divider sx={{ mb: 2, borderColor: "rgba(255,255,255,0.06)" }} />

                      {/* Author Attribution */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            src={
                              detailQuery.author?.photo
                                ? `${apiBase}/uploads/${detailQuery.author.photo}`
                                : undefined
                            }
                            sx={{ width: 34, height: 34, border: "1.5px solid rgba(255,255,255,0.06)" }}
                          >
                            {detailQuery.author?.firstName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ fontSize: "0.82rem" }}>
                              {detailQuery.author?.firstName} {detailQuery.author?.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem" }}>
                              {detailQuery.author?.course || "Student"} · {detailQuery.author?.branch || ""}
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            icon={<School sx={{ fontSize: "12px !important", color: "primary.main" }} />}
                            label={detailQuery.college?.collegeName}
                            size="small"
                            sx={{
                              height: 24,
                              bgcolor: "rgba(79, 70, 229, 0.08)",
                              color: "primary.light",
                              fontWeight: 800,
                              fontSize: "0.68rem",
                              border: "1px solid rgba(79,70,229,0.15)",
                            }}
                          />
                          <Chip
                            icon={<AccessTime sx={{ fontSize: "12px !important" }} />}
                            label={formatRelativeTime(detailQuery.createdAt)}
                            size="small"
                            sx={{
                              height: 24,
                              bgcolor: "rgba(255, 255, 255, 0.02)",
                              color: "text.secondary",
                              fontSize: "0.68rem",
                            }}
                          />
                        </Stack>
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>

                {/* Answers Section */}
                <Typography variant="h6" fontWeight={850} color="text.primary" sx={{ mb: 2.5 }}>
                  {detailAnswers.length} {detailAnswers.length === 1 ? "Answer" : "Answers"}
                </Typography>

                <Stack spacing={3} sx={{ mb: 5 }}>
                  {/* Sort: accepted answer first, then others */}
                  {[...detailAnswers]
                    .sort((a, b) => {
                      const isAAccepted = detailQuery.acceptedAnswer?._id === a._id || detailQuery.acceptedAnswer === a._id;
                      const isBAccepted = detailQuery.acceptedAnswer?._id === b._id || detailQuery.acceptedAnswer === b._id;
                      if (isAAccepted) return -1;
                      if (isBAccepted) return 1;
                      return 0;
                    })
                    .map((ans) => {
                      const isAccepted = detailQuery.acceptedAnswer === ans._id || detailQuery.acceptedAnswer?._id === ans._id;
                      const isQueryAuthor = detailQuery.author?._id === user._id;

                      return (
                        <Paper
                          key={ans._id}
                          elevation={0}
                          sx={{
                            p: 3,
                            border: isAccepted ? "1px solid #10B981" : "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "16px",
                            background: isAccepted
                              ? "rgba(16, 185, 129, 0.05)"
                              : "rgba(30, 41, 59, 0.15)",
                            backdropFilter: "blur(12px)",
                            position: "relative",
                          }}
                        >
                          {isAccepted && (
                            <Chip
                              icon={<CheckCircle sx={{ fontSize: "12px !important", color: "#10B981" }} />}
                              label="Best Solution"
                              size="small"
                              sx={{
                                position: "absolute",
                                top: 16,
                                right: 16,
                                height: 22,
                                bgcolor: "rgba(16, 185, 129, 0.12)",
                                color: "#10B981",
                                fontWeight: 800,
                                fontSize: "0.62rem",
                                textTransform: "uppercase",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                              }}
                            />
                          )}

                          <Stack direction="row" spacing={3} alignItems="flex-start">
                            {/* Vote columns */}
                            <Stack alignItems="center" spacing={0.5}>
                              <IconButton
                                size="small"
                                onClick={() => handleAnswerVote(ans._id, true)}
                                sx={{ color: ans.upvotes?.includes(user._id) ? "primary.main" : "text.secondary" }}
                              >
                                <ThumbUp sx={{ fontSize: 15 }} />
                              </IconButton>
                              <Typography variant="caption" fontWeight={800} color="text.secondary">
                                {(ans.upvotes?.length || 0) - (ans.downvotes?.length || 0)}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleAnswerVote(ans._id, false)}
                                sx={{ color: ans.downvotes?.includes(user._id) ? "error.main" : "text.secondary" }}
                              >
                                <ThumbDown sx={{ fontSize: 15 }} />
                              </IconButton>

                              {/* Best solution toggle button for Query Author */}
                              {isQueryAuthor && (
                                <Tooltip title={isAccepted ? "Remove Solution status" : "Mark as Best Solution"}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleAcceptAnswer(ans._id)}
                                    sx={{ mt: 1.5, color: isAccepted ? "#10B981" : "rgba(255,255,255,0.15)" }}
                                  >
                                    <CheckCircleOutline sx={{ fontSize: 20 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>

                            {/* Content & nested comments */}
                            <Box sx={{ flexGrow: 1, pr: isAccepted ? 10 : 0 }}>
                              <Typography variant="body2" color="text.primary" sx={{ fontSize: "0.88rem", lineHeight: 1.5, mb: 3 }}>
                                {ans.content}
                              </Typography>

                              {/* Answerer attribution */}
                              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5} sx={{ mb: 3 }}>
                                <Stack direction="row" spacing={1.2} alignItems="center">
                                  <Avatar
                                    src={ans.author?.photo ? `${apiBase}/uploads/${ans.author.photo}` : undefined}
                                    sx={{ width: 26, height: 26 }}
                                  >
                                    {ans.author?.firstName?.[0]}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="caption" fontWeight={800} color="text.primary" sx={{ fontSize: "0.78rem" }}>
                                      {ans.author?.firstName} {ans.author?.lastName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "0.62rem", mt: -0.2 }}>
                                      {ans.author?.course || ""} · {ans.author?.branch || ""}
                                    </Typography>
                                  </Box>
                                </Stack>

                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip
                                    label={ans.college?.collegeName}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      bgcolor: "rgba(255,255,255,0.03)",
                                      color: "text.secondary",
                                      fontWeight: 700,
                                      fontSize: "0.62rem",
                                    }}
                                  />
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                                    {formatRelativeTime(ans.createdAt)}
                                  </Typography>
                                </Stack>
                              </Stack>

                              {/* Nested replies / Comments */}
                              <Box sx={{ pl: 2, borderLeft: "1px solid rgba(255,255,255,0.06)", mt: 2 }}>
                                <Stack spacing={1.5} sx={{ mb: 2 }}>
                                  {ans.comments?.map((comment) => (
                                    <Box key={comment._id} sx={{ bgcolor: "rgba(255,255,255,0.01)", p: 1.5, borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                                      <Typography variant="caption" color="text.primary" sx={{ fontSize: "0.8rem", lineHeight: 1.4 }}>
                                        {comment.content}
                                      </Typography>
                                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ fontSize: "0.68rem" }}>
                                          {comment.author?.firstName} {comment.author?.lastName}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem" }}>
                                          ({comment.college?.collegeName})
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem" }}>
                                          · {formatRelativeTime(comment.createdAt)}
                                        </Typography>
                                      </Stack>
                                    </Box>
                                  ))}
                                </Stack>

                                {/* Post nested comment comment field */}
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <TextField
                                    placeholder="Add a reply comment..."
                                    size="small"
                                    value={commentContents[ans._id] || ""}
                                    onChange={(e) =>
                                      setCommentContents((prev) => ({ ...prev, [ans._id]: e.target.value }))
                                    }
                                    sx={{
                                      flexGrow: 1,
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: "20px",
                                        bgcolor: "rgba(255,255,255,0.01)",
                                        fontSize: "0.75rem",
                                      },
                                    }}
                                  />
                                  <IconButton
                                    onClick={() => handleCommentSubmit(ans._id)}
                                    color="primary"
                                    size="small"
                                    sx={{ bgcolor: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.12)" }}
                                  >
                                    <Send sx={{ fontSize: 13 }} />
                                  </IconButton>
                                </Stack>
                              </Box>
                            </Box>
                          </Stack>
                        </Paper>
                      );
                    })}
                </Stack>

                {/* Add Answer Form */}
                <Paper
                  elevation={0}
                  component="form"
                  onSubmit={handleAnswerSubmit}
                  sx={{
                    p: 3,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    background: "rgba(30, 41, 59, 0.25)",
                    mb: 5,
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 1.5 }}>
                    Your Solution
                  </Typography>
                  <TextField
                    placeholder="Provide a detailed solution or helpful feedback..."
                    multiline
                    rows={4}
                    fullWidth
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        bgcolor: "rgba(255, 255, 255, 0.01)",
                        fontSize: "0.85rem",
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!answerContent.trim()}
                    sx={{
                      borderRadius: "30px",
                      textTransform: "none",
                      fontWeight: 750,
                      px: 3,
                      background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                      fontSize: "0.78rem",
                    }}
                  >
                    Post Answer
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      ) : (
        /* ================== LIST VIEW ================== */
        <Box>
          {/* Header block */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
            sx={{ mb: 4 }}
          >
            <Box>
              <Typography variant="h5" fontWeight={900} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <QuestionAnswer sx={{ color: "primary.main" }} />
                Campus Q&A Discussions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Ask questions, share solutions, and discuss university life with classmates
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAskModalOpen(true)}
              sx={{
                borderRadius: "30px",
                height: 36,
                px: 3,
                fontWeight: 750,
                textTransform: "none",
                background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)",
                fontSize: "0.78rem",
              }}
            >
              Ask a Question
            </Button>
          </Stack>

          {/* AI Copilot Search Assistant */}
          <AiCopilot
            type="qna"
            data={queries}
            onAiFilter={(ids) => setAiFilteredIds(ids)}
          />

          {/* Filter Toolbar Panel */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(30, 41, 59, 0.15)",
              backdropFilter: "blur(12px)",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Top row: Search input & My College Switch */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
              sx={{ width: "100%" }}
            >
              <TextField
                placeholder="Search queries, descriptions, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{
                  flexGrow: 1,
                  width: "100%",
                  "& .MuiOutlinedInput-root": {
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "20px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    "& fieldset": { border: "none" },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary", fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ flexShrink: 0, bgcolor: "rgba(255,255,255,0.02)", px: 2, py: 0.6, borderRadius: "20px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={myCollegeOnly}
                      onChange={(e) => setMyCollegeOnly(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight={800} color="text.secondary" sx={{ fontSize: "0.78rem" }}>
                      My College Only
                    </Typography>
                  }
                  sx={{ mr: 0, display: "flex", alignItems: "center" }}
                />
              </Box>
            </Stack>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.04)" }} />

            {/* Bottom row: Filter by tag label and chips */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "flex-start", sm: "center" }}
              sx={{ width: "100%" }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={800}
                sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.65rem", flexShrink: 0 }}
              >
                Topics:
              </Typography>
              
              <Stack direction="row" spacing={1} overflow="auto" sx={{ py: 0.5, width: "100%" }}>
                {PRESET_TAGS.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag === "All" ? "All Tags" : `#${tag}`}
                    onClick={() => setSelectedTag(tag)}
                    size="small"
                    sx={{
                      cursor: "pointer",
                      height: 26,
                      fontWeight: 800,
                      bgcolor: selectedTag === tag ? "primary.main" : "rgba(255, 255, 255, 0.03)",
                      color: selectedTag === tag ? "#FFFFFF" : "text.secondary",
                      border: "1px solid rgba(255,255,255,0.04)",
                      borderRadius: "15px",
                      transition: "all 0.15s ease",
                      "&:hover": { bgcolor: selectedTag === tag ? "primary.dark" : "rgba(255,255,255,0.06)" },
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          </Paper>

          {/* List display */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={45} />
            </Box>
          ) : queries.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(30, 41, 59, 0.15)",
                borderRadius: "16px",
              }}
            >
              <HelpOutline sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
              <Typography variant="body1" fontWeight={750} color="text.secondary">
                No questions found in this discussion segment.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Got a doubt about exams, hostels, or tech? Ask your first question!
              </Typography>
            </Paper>
          ) : queriesToDisplay.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(30, 41, 59, 0.15)",
                borderRadius: "16px",
              }}
            >
              <HelpOutline sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
              <Typography variant="body1" fontWeight={750} color="text.secondary">
                No questions match the AI filters.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Try adjusting your search query or clear the AI filter.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2.5}>
              {queriesToDisplay.map((q) => {
                const votesCount = (q.upvotes?.length || 0) - (q.downvotes?.length || 0);
                const hasUpvoted = q.upvotes?.includes(user._id);
                const hasDownvoted = q.downvotes?.includes(user._id);

                return (
                  <Paper
                    key={q._id}
                    elevation={0}
                    onClick={() => fetchQueryDetail(q._id)}
                    sx={{
                      p: 3,
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "16px",
                      background: "rgba(30, 41, 59, 0.2)",
                      backdropFilter: "blur(8px)",
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        borderColor: "rgba(255,255,255,0.15)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
                      },
                    }}
                  >
                    <Stack direction="row" spacing={3} alignItems="center">
                      {/* Left: Voting indicators */}
                      <Stack
                        alignItems="center"
                        spacing={0.5}
                        onClick={(e) => e.stopPropagation()} // Stop clicking card trigger
                        sx={{ bgcolor: "rgba(255,255,255,0.01)", px: 1, py: 1.5, borderRadius: "10px" }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleQueryVote(q._id, true)}
                          sx={{ color: hasUpvoted ? "primary.main" : "text.secondary", p: 0.5 }}
                        >
                          <ThumbUp sx={{ fontSize: 14 }} />
                        </IconButton>
                        <Typography variant="caption" fontWeight={900} color="text.primary">
                          {votesCount}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleQueryVote(q._id, false)}
                          sx={{ color: hasDownvoted ? "error.main" : "text.secondary", p: 0.5 }}
                        >
                          <ThumbDown sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Stack>

                      {/* Main Title & body snippet */}
                      <Box sx={{ flexGrow: 1 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight={850} color="text.primary" sx={{ lineHeight: 1.3 }}>
                            {q.title}
                          </Typography>
                          {q.acceptedAnswer && (
                            <Chip
                              icon={<CheckCircle sx={{ fontSize: "11px !important", color: "#10B981" }} />}
                              label="Solved"
                              size="small"
                              sx={{
                                height: 20,
                                bgcolor: "rgba(16, 185, 129, 0.12)",
                                color: "#10B981",
                                fontWeight: 800,
                                fontSize: "0.6rem",
                              }}
                            />
                          )}
                        </Stack>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            fontSize: "0.82rem",
                            lineHeight: 1.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            mb: 2.5,
                          }}
                        >
                          {q.description}
                        </Typography>

                        {/* Card metadata bar */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
                          {/* Tags */}
                          <Stack direction="row" spacing={1}>
                            {q.tags?.slice(0, 3).map((tag) => (
                              <Chip
                                key={tag}
                                label={`#${tag}`}
                                size="small"
                                sx={{
                                  height: 20,
                                  bgcolor: "rgba(79, 70, 229, 0.05)",
                                  color: "primary.light",
                                  fontWeight: 700,
                                  fontSize: "0.65rem",
                                }}
                              />
                            ))}
                          </Stack>

                          {/* Author Attribution Card */}
                          <Stack direction="row" spacing={2.5} alignItems="center">
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar
                                src={q.author?.photo ? `${apiBase}/uploads/${q.author.photo}` : undefined}
                                sx={{ width: 22, height: 22 }}
                              >
                                {q.author?.firstName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="caption" fontWeight={800} color="text.primary" sx={{ fontSize: "0.75rem" }}>
                                  {q.author?.firstName} {q.author?.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "0.58rem", mt: -0.4 }}>
                                  {q.college?.collegeName}
                                </Typography>
                              </Box>
                            </Stack>

                            <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

                            <Stack direction="row" spacing={0.6} alignItems="center" sx={{ color: "text.secondary" }}>
                              <CommentIcon sx={{ fontSize: 13 }} />
                              <Typography variant="caption" fontWeight={750}>
                                {q.answersCount || 0}
                              </Typography>
                            </Stack>

                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                              {formatRelativeTime(q.createdAt)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} sx={{ mt: 5 }}>
              <IconButton
                disabled={currentPage === 1}
                onClick={() => fetchQueries(currentPage - 1)}
                sx={{ border: "1px solid rgba(255,255,255,0.06)", bgcolor: "rgba(255,255,255,0.01)" }}
              >
                <ChevronLeft />
              </IconButton>
              <Typography variant="caption" fontWeight={800} color="text.secondary">
                Page {currentPage} of {totalPages}
              </Typography>
              <IconButton
                disabled={currentPage === totalPages}
                onClick={() => fetchQueries(currentPage + 1)}
                sx={{ border: "1px solid rgba(255,255,255,0.06)", bgcolor: "rgba(255,255,255,0.01)" }}
              >
                <ChevronRight />
              </IconButton>
            </Stack>
          )}
        </Box>
      )}

      {/* Ask Question modal */}
      <Modal
        open={askModalOpen}
        onClose={() => setAskModalOpen(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}
      >
        <Paper
          elevation={24}
          sx={{
            width: "100%",
            maxWidth: 600,
            bgcolor: "#0F172A",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            p: 4,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={900} color="text.primary">
              Ask a Campus Question
            </Typography>
            <IconButton onClick={() => setAskModalOpen(false)} sx={{ color: "text.secondary" }}>
              <Close />
            </IconButton>
          </Stack>

          <Box component="form" onSubmit={handleAskSubmit}>
            <Typography variant="caption" color="text.secondary" fontWeight={750} sx={{ mb: 1, display: "block" }}>
              Question Title
            </Typography>
            <TextField
              placeholder="e.g. What is the weightage of End-Semester Exams in PH101?"
              fullWidth
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  bgcolor: "rgba(255, 255, 255, 0.01)",
                  fontSize: "0.85rem",
                },
              }}
            />

            <Typography variant="caption" color="text.secondary" fontWeight={750} sx={{ mb: 1, display: "block" }}>
              Detailed Description
            </Typography>
            <TextField
              placeholder="Provide context, links, or specific parts you need help with..."
              fullWidth
              multiline
              rows={6}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  bgcolor: "rgba(255, 255, 255, 0.01)",
                  fontSize: "0.85rem",
                },
              }}
            />

            <Typography variant="caption" color="text.secondary" fontWeight={750} sx={{ mb: 1, display: "block" }}>
              Categorization Tags (comma separated)
            </Typography>
            <TextField
              placeholder="e.g. exams, physics, IITDelhi"
              fullWidth
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              sx={{
                mb: 4,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  bgcolor: "rgba(255, 255, 255, 0.01)",
                  fontSize: "0.85rem",
                },
              }}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={() => setAskModalOpen(false)} sx={{ color: "text.secondary", textTransform: "none", fontWeight: 700 }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submittingQuery}
                sx={{
                  borderRadius: "30px",
                  textTransform: "none",
                  fontWeight: 750,
                  px: 4,
                  background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                }}
              >
                {submittingQuery ? "Posting..." : "Post Question"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Modal>
    </Box>
  );
}
