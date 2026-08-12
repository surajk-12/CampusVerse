import React, { useState, useEffect } from "react";
import AISearchInput from "../components/AISearchInput.jsx";
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
  Select,
  MenuItem,
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
  Send,
  ArrowUpward,
  ArrowDownward,
  PushPin,
  Delete,
  Flag,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../api/axios.js";
import useRole from "../hooks/useRole.js";

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
  const { isSuperAdmin, isCollegeAdmin, isModerator, canModerate, sameCollege } = useRole();
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

  // Ask Question Modal State
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTags, setNewTags] = useState("general");
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

  useEffect(() => {
    const handleAIFilter = (e) => {
      if (e.detail?.searchString) {
        setSearchQuery(e.detail.searchString);
        setCurrentPage(1);
      }
    };
    window.addEventListener("ai-filter", handleAIFilter);
    return () => window.removeEventListener("ai-filter", handleAIFilter);
  }, []);

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
      const tagsArray = [newTags].filter(Boolean);

      const { data } = await api.post("/queries", {
        title: newTitle,
        description: newDescription,
        tags: tagsArray,
      });

      setQueries((prev) => [data, ...prev]);
      showToast("Question posted successfully!", "success");
      setNewTitle("");
      setNewDescription("");
      setNewTags("general");
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

  // Delete Question
  const handleDeleteQuery = async (queryId) => {
    if (!window.confirm("Are you sure you want to delete this question? This cannot be undone.")) return;
    try {
      await api.delete(`/queries/${queryId}`);
      showToast("Question deleted successfully.", "success");
      setQueries((prev) => prev.filter((q) => q._id !== queryId));
      if (detailQuery?._id === queryId) {
        setDetailQuery(null);
      }
    } catch (err) {
      console.error("Error deleting query:", err);
      showToast(err.response?.data?.message || "Failed to delete question.", "error");
    }
  };

  // Delete Answer
  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm("Are you sure you want to delete this answer? This cannot be undone.")) return;
    try {
      await api.delete(`/queries/answers/${answerId}`);
      showToast("Answer deleted successfully.", "success");
      setDetailAnswers((prev) => prev.filter((ans) => ans._id !== answerId));
    } catch (err) {
      console.error("Error deleting answer:", err);
      showToast(err.response?.data?.message || "Failed to delete answer.", "error");
    }
  };

  // Toggle Pin Query
  const handlePinQuery = async (queryId) => {
    try {
      const { data } = await api.put(`/queries/${queryId}/pin`);
      showToast(data.message, "success");
      
      // Update in queries list
      setQueries((prev) =>
        prev.map((q) => (q._id === queryId ? { ...q, isPinned: data.isPinned } : q))
      );

      // Update in detail view
      if (detailQuery && detailQuery._id === queryId) {
        setDetailQuery((prev) => ({ ...prev, isPinned: data.isPinned }));
      }
    } catch (err) {
      console.error("Error pinning query:", err);
      showToast(err.response?.data?.message || "Failed to pin question.", "error");
    }
  };

  // Report Query
  const handleReportQuery = async (queryId) => {
    try {
      await api.post(`/queries/${queryId}/report`);
      showToast("Question reported for moderation review.", "success");
    } catch (err) {
      console.error("Error reporting query:", err);
      showToast(err.response?.data?.message || "You have already reported this question.", "info");
    }
  };

  // Report Answer
  const handleReportAnswer = async (answerId) => {
    try {
      await api.post(`/queries/answers/${answerId}/report`);
      showToast("Answer reported for moderation review.", "success");
    } catch (err) {
      console.error("Error reporting answer:", err);
      showToast(err.response?.data?.message || "You have already reported this answer.", "info");
    }
  };

  // --- Detail view answer filter state ---
  const [answerFilter, setAnswerFilter] = useState("all");

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?";
  };

  // Unique participants list from answers
  const participants = detailQuery
    ? [
        detailQuery.author,
        ...(detailAnswers || []).map((a) => a.author),
      ].filter(
        (p, idx, self) =>
          p && self.findIndex((x) => x?._id === p?._id) === idx
      )
    : [];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {detailQuery ? (
        /* ================== DETAIL VIEW ================== */
        <Box>
          {/* Sub-header bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
              mb: 4,
              pb: 2,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
                onClick={() => setDetailQuery(null)}
                size="small"
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  color: "text.secondary",
                  bgcolor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  px: 2,
                  "&:hover": { color: "text.primary", bgcolor: "rgba(255,255,255,0.06)" },
                }}
              >
                Back to Discussions
              </Button>
              <Typography variant="caption" color="text.disabled" sx={{ display: { xs: "none", sm: "block" } }}>
                |
              </Typography>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
                Academic Questions
              </Typography>
            </Stack>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                const el = document.getElementById("answerComposer");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.75rem",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #4F46E5 0%, #A855F7 100%)",
                px: 2,
              }}
            >
              Write Response
            </Button>
          </Box>

          {loadingDetail ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={45} />
            </Box>
          ) : (
            <Grid container spacing={3} sx={{ width: "100%", mx: 0 }}>
              {/* ── LEFT MAIN COLUMN (8 cols) ── */}
              <Grid size={{ xs: 12, md: 8 }} sx={{ pl: { xs: 0, md: 3 } }}>

                {/* ── QUESTION CARD ── */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 3, sm: 4 },
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    background: "rgba(30, 41, 59, 0.25)",
                    backdropFilter: "blur(12px)",
                    mb: 3,
                  }}
                >
                  {/* Title */}
                  <Typography variant="h5" fontWeight={900} color="text.primary" sx={{ mb: 2, lineHeight: 1.35 }}>
                    {detailQuery.title}
                  </Typography>

                  {/* Tags & time row */}
                  <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1} sx={{ mb: 3 }}>
                    {detailQuery.tags?.map((t) => (
                      <Chip
                        key={t}
                        label={`#${t}`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.05)",
                          color: "text.secondary",
                          fontWeight: 700,
                          fontSize: "0.68rem",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "6px",
                          height: 22,
                          fontFamily: "monospace",
                        }}
                      />
                    ))}
                    <Typography variant="caption" color="text.disabled" sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.5 }}>
                      <AccessTime sx={{ fontSize: 11 }} /> Asked {formatRelativeTime(detailQuery.createdAt)}
                    </Typography>
                  </Stack>

                  {/* Description body */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.9rem", lineHeight: 1.7, whiteSpace: "pre-line", mb: 3, pb: 3, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {detailQuery.description}
                  </Typography>

                  {/* Author bar + vote actions */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    {/* Author */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        src={detailQuery.author?.photo ? `${apiBase}/uploads/${detailQuery.author.photo}` : undefined}
                        sx={{ width: 36, height: 36, border: "1.5px solid rgba(255,255,255,0.08)" }}
                      >
                        {detailQuery.author?.firstName?.[0]}
                      </Avatar>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" fontWeight={800} color="text.primary" sx={{ fontSize: "0.8rem" }}>
                            {detailQuery.author?.firstName} {detailQuery.author?.lastName}
                          </Typography>
                          <Box sx={{ px: 1, py: 0.2, bgcolor: "rgba(255,255,255,0.05)", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <Typography variant="caption" sx={{ fontSize: "0.6rem", color: "text.secondary", fontFamily: "monospace" }}>Author</Typography>
                          </Box>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem" }}>
                          {detailQuery.author?.course} · {detailQuery.author?.branch}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Vote pill + bookmark */}
                    <Stack direction="row" spacing={1} alignItems="center">
                      {/* Pin Question */}
                      {canModerate && sameCollege(detailQuery.college) && (
                        <Tooltip title={detailQuery.isPinned ? "Unpin Question" : "Pin Question"}>
                          <IconButton
                            size="small"
                            onClick={() => handlePinQuery(detailQuery._id)}
                            sx={{
                              color: detailQuery.isPinned ? "primary.main" : "text.secondary",
                              bgcolor: detailQuery.isPinned ? "rgba(99, 102, 241, 0.1)" : "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              "&:hover": { bgcolor: "rgba(99, 102, 241, 0.15)" },
                            }}
                          >
                            <PushPin sx={{ fontSize: 16, transform: detailQuery.isPinned ? "rotate(45deg)" : "none" }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* Delete Question */}
                      {(detailQuery.author?._id === user._id ||
                        isSuperAdmin ||
                        (isCollegeAdmin && sameCollege(detailQuery.college)) ||
                        (isModerator && sameCollege(detailQuery.college))) && (
                        <Tooltip title="Delete Question">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteQuery(detailQuery._id)}
                            sx={{
                              color: "error.main",
                              bgcolor: "rgba(244, 63, 94, 0.05)",
                              border: "1px solid rgba(244, 63, 94, 0.15)",
                              "&:hover": { bgcolor: "rgba(244, 63, 94, 0.15)" },
                            }}
                          >
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* Report Question */}
                      {detailQuery.author?._id !== user._id && (
                        <Tooltip title="Report Question">
                          <IconButton
                            size="small"
                            onClick={() => handleReportQuery(detailQuery._id)}
                            sx={{
                              color: "warning.main",
                              bgcolor: "rgba(245, 158, 11, 0.05)",
                              border: "1px solid rgba(245, 158, 11, 0.15)",
                              "&:hover": { bgcolor: "rgba(245, 158, 11, 0.15)" },
                            }}
                          >
                            <Flag sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Stack
                        direction="row"
                        alignItems="center"
                        sx={{
                          bgcolor: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          borderRadius: "30px",
                          px: 0.6,
                          py: 0.3,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleQueryVote(detailQuery._id, true)}
                          sx={{
                            color: detailQuery.upvotes?.includes(user._id) ? "primary.main" : "text.secondary",
                            "&:hover": { color: "primary.main", bgcolor: "rgba(129, 140, 248, 0.1)" },
                            p: 0.5,
                          }}
                        >
                          <ArrowUpward sx={{ fontSize: 16 }} />
                        </IconButton>
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          sx={{
                            mx: 1,
                            fontSize: "0.78rem",
                            color: detailQuery.upvotes?.includes(user._id)
                              ? "primary.main"
                              : detailQuery.downvotes?.includes(user._id)
                              ? "error.main"
                              : "text.primary",
                          }}
                        >
                          {(detailQuery.upvotes?.length || 0) - (detailQuery.downvotes?.length || 0)}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleQueryVote(detailQuery._id, false)}
                          sx={{
                            color: detailQuery.downvotes?.includes(user._id) ? "error.main" : "text.secondary",
                            "&:hover": { color: "error.main", bgcolor: "rgba(244, 63, 94, 0.1)" },
                            p: 0.5,
                          }}
                        >
                          <ArrowDownward sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Stack>
                </Paper>

                {/* ── RESPONSES HEADER + FILTER ── */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} sx={{ mb: 2.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="subtitle1" fontWeight={850} color="text.primary">
                      Responses
                    </Typography>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.3,
                        bgcolor: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "20px",
                        minWidth: 28,
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="caption" fontWeight={700} sx={{ fontFamily: "monospace" }}>
                        {detailAnswers.length}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Filter tabs */}
                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "10px",
                      p: 0.5,
                    }}
                  >
                    {[
                      { key: "all", label: "All" },
                      { key: "official", label: "Verified Staff" },
                      { key: "student", label: "Community" },
                    ].map(({ key, label }) => (
                      <Button
                        key={key}
                        size="small"
                        onClick={() => setAnswerFilter(key)}
                        sx={{
                          textTransform: "none",
                          fontSize: "0.72rem",
                          fontWeight: answerFilter === key ? 800 : 600,
                          color: answerFilter === key ? "text.primary" : "text.secondary",
                          bgcolor: answerFilter === key ? "rgba(255,255,255,0.07)" : "transparent",
                          borderRadius: "7px",
                          px: 1.5,
                          py: 0.6,
                          minWidth: "unset",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.05)", color: "text.primary" },
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </Stack>
                </Stack>

                {/* ── ANSWERS LIST ── */}
                <Stack spacing={2.5} sx={{ mb: 4 }}>
                  {[...detailAnswers]
                    .sort((a, b) => {
                      const isAAccepted = detailQuery.acceptedAnswer?._id === a._id || detailQuery.acceptedAnswer === a._id;
                      const isBAccepted = detailQuery.acceptedAnswer?._id === b._id || detailQuery.acceptedAnswer === b._id;
                      if (isAAccepted) return -1;
                      if (isBAccepted) return 1;
                      return 0;
                    })
                    .map((ans) => {
                      const isAccepted =
                        detailQuery.acceptedAnswer === ans._id ||
                        detailQuery.acceptedAnswer?._id === ans._id;
                      const isQueryAuthor = detailQuery.author?._id === user._id;

                      return (
                        <Paper
                          key={ans._id}
                          elevation={0}
                          sx={{
                            p: 3,
                            border: isAccepted
                              ? "1.5px solid #059669"
                              : "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "14px",
                            background: isAccepted
                              ? "rgba(5,150,105,0.04)"
                              : "rgba(30, 41, 59, 0.25)",
                            boxShadow: isAccepted ? "0 4px 24px rgba(5,150,105,0.1)" : "none",
                            transition: "all 0.25s ease",
                            "&:hover": {
                              borderColor: isAccepted ? "#059669" : "rgba(255,255,255,0.14)",
                            },
                          }}
                        >
                          {/* Card header: verified badge */}
                          {isAccepted && (
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              sx={{
                                mb: 2.5,
                                pb: 2,
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                              }}
                            >
                              <Stack direction="row" spacing={1} alignItems="center">
                                <CheckCircle sx={{ fontSize: 14, color: "#10B981" }} />
                                <Typography
                                  variant="caption"
                                  fontWeight={700}
                                  sx={{ color: "#10B981", fontSize: "0.72rem" }}
                                >
                                  Accepted Official Solution
                                </Typography>
                              </Stack>
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                                {formatRelativeTime(ans.createdAt)}
                              </Typography>
                            </Stack>
                          )}

                          {/* Answer body */}
                          <Typography
                            variant="body2"
                            color="text.primary"
                            sx={{ fontSize: "0.88rem", lineHeight: 1.7, mb: 3 }}
                          >
                            {ans.content}
                          </Typography>

                          {/* Author + Actions row */}
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            flexWrap="wrap"
                            gap={2}
                            sx={{ pt: 2.5, borderTop: "1px solid rgba(255,255,255,0.06)" }}
                          >
                            {/* Author info */}
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar
                                src={ans.author?.photo ? `${apiBase}/uploads/${ans.author.photo}` : undefined}
                                sx={{ width: 32, height: 32, border: "1px solid rgba(255,255,255,0.08)" }}
                              >
                                {ans.author?.firstName?.[0]}
                              </Avatar>
                              <Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="caption" fontWeight={800} color="text.primary" sx={{ fontSize: "0.78rem" }}>
                                    {ans.author?.firstName} {ans.author?.lastName}
                                  </Typography>
                                  {isAccepted && (
                                    <Box
                                      sx={{
                                        px: 1,
                                        py: 0.2,
                                        bgcolor: "rgba(5,150,105,0.1)",
                                        border: "1px solid rgba(5,150,105,0.2)",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      <Typography variant="caption" sx={{ fontSize: "0.58rem", color: "#10B981", fontWeight: 700 }}>
                                        Verified
                                      </Typography>
                                    </Box>
                                  )}
                                </Stack>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                                  {ans.author?.course || ""} · {ans.college?.collegeName || ""}
                                </Typography>
                              </Box>
                            </Stack>

                             {/* Vote + Accept actions */}
                             <Stack direction="row" spacing={1} alignItems="center">
                               <Stack
                                 direction="row"
                                 alignItems="center"
                                 sx={{
                                   bgcolor: "rgba(255, 255, 255, 0.03)",
                                   border: "1px solid rgba(255, 255, 255, 0.06)",
                                   borderRadius: "30px",
                                   px: 0.5,
                                   py: 0.2,
                                 }}
                               >
                                 <IconButton
                                   size="small"
                                   onClick={() => handleAnswerVote(ans._id, true)}
                                   sx={{
                                     color: ans.upvotes?.includes(user._id) ? "primary.main" : "text.secondary",
                                     "&:hover": { color: "primary.main", bgcolor: "rgba(129, 140, 248, 0.1)" },
                                     p: 0.4,
                                   }}
                                 >
                                   <ArrowUpward sx={{ fontSize: 15 }} />
                                 </IconButton>
                                 <Typography
                                   variant="caption"
                                   fontWeight={800}
                                   sx={{
                                     mx: 0.8,
                                     fontSize: "0.74rem",
                                     color: ans.upvotes?.includes(user._id)
                                       ? "primary.main"
                                       : ans.downvotes?.includes(user._id)
                                       ? "error.main"
                                       : "text.primary",
                                   }}
                                 >
                                   {(ans.upvotes?.length || 0) - (ans.downvotes?.length || 0)}
                                 </Typography>
                                 <IconButton
                                   size="small"
                                   onClick={() => handleAnswerVote(ans._id, false)}
                                   sx={{
                                     color: ans.downvotes?.includes(user._id) ? "error.main" : "text.secondary",
                                     "&:hover": { color: "error.main", bgcolor: "rgba(244, 63, 94, 0.1)" },
                                     p: 0.4,
                                   }}
                                 >
                                   <ArrowDownward sx={{ fontSize: 15 }} />
                                 </IconButton>
                               </Stack>
 
                               {/* Accept Answer (Solution badge) */}
                               {(isQueryAuthor || isSuperAdmin || (isCollegeAdmin && sameCollege(detailQuery.college))) && (
                                 <Button
                                   size="small"
                                   variant="outlined"
                                   onClick={() => handleAcceptAnswer(ans._id)}
                                   startIcon={
                                     isAccepted ? (
                                       <CheckCircle sx={{ fontSize: 12 }} />
                                     ) : (
                                       <CheckCircleOutline sx={{ fontSize: 12 }} />
                                     )
                                   }
                                   sx={{
                                     borderRadius: "8px",
                                     textTransform: "none",
                                     fontSize: "0.68rem",
                                     fontWeight: 800,
                                     borderColor: isAccepted ? "#10B981" : "rgba(255,255,255,0.12)",
                                     color: isAccepted ? "#10B981" : "text.secondary",
                                     bgcolor: isAccepted ? "rgba(16,185,129,0.05)" : "transparent",
                                     "&:hover": {
                                       borderColor: "#10B981",
                                       bgcolor: "rgba(16,185,129,0.08)",
                                     },
                                     px: 1.5,
                                     py: 0.5,
                                   }}
                                 >
                                   {isAccepted ? "Accepted" : "Accept"}
                                 </Button>
                               )}

                               {/* Delete Answer */}
                               {(ans.author?._id === user._id ||
                                 isSuperAdmin ||
                                 (isCollegeAdmin && sameCollege(ans.college)) ||
                                 (isModerator && sameCollege(ans.college))) && (
                                 <Tooltip title="Delete Answer">
                                   <IconButton
                                     size="small"
                                     onClick={() => handleDeleteAnswer(ans._id)}
                                     sx={{
                                       color: "error.main",
                                       bgcolor: "rgba(244, 63, 94, 0.05)",
                                       border: "1px solid rgba(244, 63, 94, 0.15)",
                                       "&:hover": { bgcolor: "rgba(244, 63, 94, 0.15)" },
                                     }}
                                   >
                                     <Delete sx={{ fontSize: 14 }} />
                                   </IconButton>
                                 </Tooltip>
                               )}

                               {/* Report Answer */}
                               {ans.author?._id !== user._id && (
                                 <Tooltip title="Report Answer">
                                   <IconButton
                                     size="small"
                                     onClick={() => handleReportAnswer(ans._id)}
                                     sx={{
                                       color: "warning.main",
                                       bgcolor: "rgba(245, 158, 11, 0.05)",
                                       border: "1px solid rgba(245, 158, 11, 0.15)",
                                       "&:hover": { bgcolor: "rgba(245, 158, 11, 0.15)" },
                                     }}
                                   >
                                     <Flag sx={{ fontSize: 14 }} />
                                   </IconButton>
                                 </Tooltip>
                               )}
                             </Stack>
                          </Stack>

                          {/* Nested comments */}
                          {(ans.comments?.length > 0 || true) && (
                            <Box sx={{ mt: 2.5, pl: 2.5, borderLeft: "2px solid rgba(255,255,255,0.06)" }}>
                              <Stack spacing={1.8} sx={{ mb: 2 }}>
                                {ans.comments?.map((comment) => (
                                  <Stack direction="row" spacing={1.5} key={comment._id} alignItems="flex-start">
                                    <Avatar
                                      src={comment.author?.photo ? `${apiBase}/uploads/${comment.author.photo}` : undefined}
                                      sx={{ width: 24, height: 24, border: "1px solid rgba(255,255,255,0.08)" }}
                                    >
                                      {comment.author?.firstName?.[0]}
                                    </Avatar>
                                    <Box
                                      sx={{
                                        flexGrow: 1,
                                        bgcolor: "rgba(255, 255, 255, 0.03)",
                                        p: 1.5,
                                        borderRadius: "12px",
                                        border: "1px solid rgba(255, 255, 255, 0.04)",
                                      }}
                                    >
                                      <Typography variant="body2" color="text.primary" sx={{ fontSize: "0.8rem", lineHeight: 1.5, mb: 0.5 }}>
                                        {comment.content}
                                      </Typography>
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="caption" fontWeight={800} color="primary.light" sx={{ fontSize: "0.68rem" }}>
                                          {comment.author?.firstName} {comment.author?.lastName}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem" }}>
                                          · {formatRelativeTime(comment.createdAt)}
                                        </Typography>
                                      </Stack>
                                    </Box>
                                  </Stack>
                                ))}
                              </Stack>

                              {/* Reply input */}
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
                                      borderRadius: "30px",
                                      bgcolor: "rgba(255,255,255,0.03)",
                                      fontSize: "0.78rem",
                                      px: 2,
                                      border: "1px solid rgba(255,255,255,0.05)",
                                      "& fieldset": { border: "none" },
                                    },
                                  }}
                                />
                                <IconButton
                                  onClick={() => handleCommentSubmit(ans._id)}
                                  disabled={!(commentContents[ans._id] || "").trim()}
                                  sx={{
                                    p: 1,
                                    background: !(commentContents[ans._id] || "").trim()
                                      ? "rgba(255,255,255,0.02)"
                                      : "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
                                    color: "#fff",
                                    borderRadius: "50%",
                                    "&:hover": { background: "linear-gradient(135deg, #4F46E5 0%, #9333EA 100%)" },
                                    "&.Mui-disabled": { background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.2)" },
                                  }}
                                >
                                  <Send sx={{ fontSize: 12 }} />
                                </IconButton>
                              </Stack>
                            </Box>
                          )}
                        </Paper>
                      );
                    })}
                </Stack>

                {/* ── WRITE RESPONSE COMPOSER ── */}
                <Paper
                  id="answerComposer"
                  elevation={0}
                  component="form"
                  onSubmit={handleAnswerSubmit}
                  sx={{
                    p: 3,
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "14px",
                    background: "rgba(30, 41, 59, 0.25)",
                    mb: 5,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="caption" fontWeight={800} color="text.primary" sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.68rem" }}>
                      Your Response
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                      Keep answers factual and clear
                    </Typography>
                  </Stack>

                  <Box
                    sx={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      overflow: "hidden",
                      bgcolor: "rgba(255,255,255,0.015)",
                      "&:focus-within": { borderColor: "rgba(255,255,255,0.18)" },
                      transition: "border-color 0.2s",
                      mb: 2,
                    }}
                  >
                    {/* Formatting toolbar */}
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{
                        px: 1.5,
                        py: 1,
                        bgcolor: "rgba(0,0,0,0.2)",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {["B", "I", "</>", "—", "≡", "🔗"].map((icon) => (
                        <IconButton
                          key={icon}
                          size="small"
                          sx={{
                            color: "text.disabled",
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            p: 0.5,
                            borderRadius: "4px",
                            "&:hover": { color: "text.primary", bgcolor: "rgba(255,255,255,0.06)" },
                          }}
                        >
                          {icon}
                        </IconButton>
                      ))}
                    </Stack>
                    <TextField
                      placeholder="Type your response or details here..."
                      multiline
                      rows={4}
                      fullWidth
                      value={answerContent}
                      onChange={(e) => setAnswerContent(e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 0,
                          bgcolor: "transparent",
                          fontSize: "0.85rem",
                          "& fieldset": { border: "none" },
                        },
                      }}
                    />
                  </Box>

                  <Stack direction="row" justifyContent="flex-end">
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!answerContent.trim()}
                      endIcon={<Send sx={{ fontSize: 13 }} />}
                      sx={{
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 750,
                        px: 3,
                        background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                        fontSize: "0.78rem",
                        "&.Mui-disabled": { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" },
                      }}
                    >
                      Publish Response
                    </Button>
                  </Stack>
                </Paper>
              </Grid>

              {/* ── RIGHT SIDEBAR (4 cols) ── */}
              <Grid size={{ xs: 12, md: 4 }} sx={{ pl: { xs: 0, md: 3 } }}>
                <Stack spacing={2.5}>

                  {/* Thread Details Card */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "14px",
                      background: "rgba(30, 41, 59, 0.25)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={800}
                      color="text.secondary"
                      sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem", display: "block", mb: 2 }}
                    >
                      Thread Details
                    </Typography>

                    <Stack spacing={0}>
                      {[
                        {
                          label: "Status",
                          value: detailQuery.acceptedAnswer ? "Solved" : "Open",
                          color: detailQuery.acceptedAnswer ? "#10B981" : "#F59E0B",
                          dot: true,
                        },
                        { label: "Total Responses", value: detailAnswers.length },
                        { label: "Category", value: detailQuery.tags?.[0] || "General" },
                        {
                          label: "Asked by",
                          value: `${detailQuery.author?.firstName} ${detailQuery.author?.lastName}`,
                        },
                        {
                          label: "College",
                          value: detailQuery.college?.collegeName || "—",
                        },
                      ].map(({ label, value, color, dot }, i, arr) => (
                        <Stack
                          key={label}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{
                            py: 1.2,
                            borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
                            {label}
                          </Typography>
                          <Stack direction="row" spacing={0.6} alignItems="center">
                            {dot && (
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  bgcolor: color,
                                }}
                              />
                            )}
                            <Typography
                              variant="caption"
                              fontWeight={700}
                              sx={{
                                fontSize: "0.72rem",
                                color: color || "text.primary",
                                fontFamily: typeof value === "number" ? "monospace" : "inherit",
                                textAlign: "right",
                                maxWidth: 130,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {value}
                            </Typography>
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  </Paper>

                  {/* Participants Card */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "14px",
                      background: "rgba(30, 41, 59, 0.25)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={800}
                      color="text.secondary"
                      sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem", display: "block", mb: 2 }}
                    >
                      Participants
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.8}>
                      {participants.slice(0, 8).map((p, idx) => (
                        <Tooltip key={p?._id || idx} title={`${p?.firstName} ${p?.lastName}`} placement="top">
                          <Avatar
                            src={p?.photo ? `${apiBase}/uploads/${p.photo}` : undefined}
                            sx={{
                              width: 30,
                              height: 30,
                              fontSize: "0.62rem",
                              fontWeight: 800,
                              border: idx === 0 ? "1.5px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.1)",
                              cursor: "pointer",
                            }}
                          >
                            {getInitials(p?.firstName, p?.lastName)}
                          </Avatar>
                        </Tooltip>
                      ))}
                      {participants.length > 8 && (
                        <Box
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            bgcolor: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography variant="caption" sx={{ fontSize: "0.6rem", fontWeight: 700, color: "text.secondary" }}>
                            +{participants.length - 8}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Paper>

                  {/* Related Questions */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "14px",
                      background: "rgba(30, 41, 59, 0.25)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={800}
                      color="text.secondary"
                      sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem", display: "block", mb: 2 }}
                    >
                      Related Questions
                    </Typography>
                    <Stack spacing={0.5}>
                      {queries
                        .filter((q) => q._id !== detailQuery._id)
                        .slice(0, 4)
                        .map((q) => (
                          <Box
                            key={q._id}
                            onClick={() => fetchQueryDetail(q._id)}
                            sx={{
                              p: 1.5,
                              borderRadius: "8px",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              "&:hover": {
                                bgcolor: "rgba(255,255,255,0.04)",
                                "& .related-title": { color: "primary.light" },
                              },
                            }}
                          >
                            <Typography
                              className="related-title"
                              variant="caption"
                              fontWeight={600}
                              color="text.secondary"
                              sx={{
                                fontSize: "0.74rem",
                                lineHeight: 1.4,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                transition: "color 0.15s",
                              }}
                            >
                              {q.title}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.62rem", mt: 0.5, display: "block" }}>
                              {q.answersCount || 0} responses
                            </Typography>
                          </Box>
                        ))}
                      {queries.filter((q) => q._id !== detailQuery._id).length === 0 && (
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.72rem" }}>
                          No related questions found
                        </Typography>
                      )}
                    </Stack>
                  </Paper>

                </Stack>
              </Grid>
            </Grid>
          )}
        </Box>
      ) : (
        /* ================== LIST VIEW ================== */
        <Box>
          {/* Welcome Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              mb: 4,
              borderRadius: "20px",
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)",
              color: "#ffffff",
              boxShadow: "0 8px 30px rgba(79, 70, 229, 0.25)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={3} sx={{ position: "relative", zIndex: 1 }}>
              <Box>
                <Typography variant="h5" fontWeight="900" gutterBottom sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" } }}>
                  Campus Q&A Discussions 💬
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: "600px", fontWeight: 500, fontSize: "0.85rem", lineHeight: 1.45 }}>
                  Ask questions, share verified solutions, and engage in discussions about university courses, exams, placements, and campus life.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add sx={{ fontSize: 16 }} />}
                onClick={() => setAskModalOpen(true)}
                sx={{
                  bgcolor: "#ffffff",
                  color: "#4F46E5",
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  px: 3,
                  py: 1,
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  textTransform: "none",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.9)",
                    color: "#3730A3",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                Ask a Question
              </Button>
            </Stack>
            <Box sx={{ position: "absolute", bottom: "-40px", right: "-30px", opacity: 0.08, zIndex: 0, transform: "rotate(-15deg)" }}>
              <QuestionAnswer sx={{ fontSize: 200 }} />
            </Box>
          </Paper>

          {/* Filter Toolbar Panel */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              border: "1px solid rgba(255, 255, 255, 0.06)",
              background: "rgba(30, 41, 59, 0.2)",
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
              <AISearchInput
                placeholder="Ask AI or search queries..."
                context="queries"
                onFilterApply={(res) => {
                  setSearchQuery(res.search || "");
                  if (res.tag) {
                    const exists = PRESET_TAGS.some(t => t.toLowerCase() === res.tag.toLowerCase());
                    if (exists) {
                      setSelectedTag(PRESET_TAGS.find(t => t.toLowerCase() === res.tag.toLowerCase()));
                    }
                  }
                  if (res.myCollegeOnly !== undefined) {
                    setMyCollegeOnly(res.myCollegeOnly);
                  }
                  setCurrentPage(1);
                }}
                sx={{ flexGrow: 1, width: "100%" }}
              />

              <Box sx={{ flexShrink: 0, bgcolor: "rgba(255,255,255,0.02)", px: 2, py: 0.5, borderRadius: "10px", border: "1px solid rgba(255,255,255,0.04)" }}>
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
                    <Typography variant="body2" fontWeight={800} color="text.secondary" sx={{ fontSize: "0.75rem" }}>
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
                      height: 24,
                      fontWeight: 800,
                      fontSize: "0.68rem",
                      bgcolor: selectedTag === tag ? "primary.main" : "rgba(255, 255, 255, 0.03)",
                      color: selectedTag === tag ? "#FFFFFF" : "text.secondary",
                      border: "1px solid rgba(255,255,255,0.04)",
                      borderRadius: "6px",
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
                border: "1px solid rgba(255, 255, 255, 0.06)",
                background: "rgba(30, 41, 59, 0.2)",
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
          ) : (
            <Stack spacing={2.5}>
              {queries.map((q) => {
                const votesCount = (q.upvotes?.length || 0) - (q.downvotes?.length || 0);
                const hasUpvoted = q.upvotes?.includes(user._id);
                const hasDownvoted = q.downvotes?.includes(user._id);
                const isSolved = !!q.acceptedAnswer;

                return (
                  <Paper
                    key={q._id}
                    elevation={0}
                    onClick={() => fetchQueryDetail(q._id)}
                    sx={{
                      p: 3,
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderLeft: isSolved
                        ? "4px solid #10B981"
                        : "4px solid #6366F1",
                      borderRadius: "14px",
                      background: "rgba(30, 41, 59, 0.25)",
                      backdropFilter: "blur(12px)",
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        borderColor: isSolved ? "#10B981" : "rgba(255,255,255,0.15)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
                      },
                    }}
                  >
                    {/* Main Title & body snippet */}
                    <Box sx={{ width: "100%" }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight={850} color="text.primary" sx={{ lineHeight: 1.3 }}>
                            {q.title}
                          </Typography>
                          {isSolved && (
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
                          {q.isPinned && (
                            <Chip
                              icon={<PushPin sx={{ fontSize: "11px !important", color: "#6366F1", transform: "rotate(45deg)" }} />}
                              label="Pinned"
                              size="small"
                              sx={{
                                height: 20,
                                bgcolor: "rgba(99, 102, 241, 0.12)",
                                color: "#818CF8",
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

                        {/* Verified Answer Highlight Box */}
                        {q.acceptedAnswer && typeof q.acceptedAnswer === "object" && q.acceptedAnswer.content && (
                          <Box
                            sx={{
                              mb: 2.5,
                              p: 2,
                              borderRadius: "12px",
                              bgcolor: "rgba(16, 185, 129, 0.03)",
                              border: "1px solid rgba(16, 185, 129, 0.12)",
                              display: "flex",
                              gap: 1.5,
                              alignItems: "flex-start",
                            }}
                          >
                            <School sx={{ fontSize: 16, color: "#10B981", mt: 0.2 }} />
                            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                                <Typography variant="caption" fontWeight={800} color="#10B981" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.58rem" }}>
                                  Verified Solution
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", fontFamily: "monospace" }}>
                                  {q.acceptedAnswer.author?.firstName} {q.acceptedAnswer.author?.lastName}
                                </Typography>
                              </Stack>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {q.acceptedAnswer.content}
                              </Typography>
                            </Box>
                          </Box>
                        )}

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
                                  bgcolor: "rgba(255, 255, 255, 0.04)",
                                  color: "text.secondary",
                                  fontWeight: 700,
                                  fontSize: "0.65rem",
                                  border: "1px solid rgba(255, 255, 255, 0.06)",
                                  borderRadius: "4px",
                                }}
                              />
                            ))}
                          </Stack>

                          {/* Author Attribution Card */}
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar
                                src={q.author?.photo ? `${apiBase}/uploads/${q.author.photo}` : undefined}
                                sx={{ width: 24, height: 24, border: "1px solid rgba(255,255,255,0.06)" }}
                              >
                                {q.author?.firstName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="caption" fontWeight={850} color="text.primary" sx={{ fontSize: "0.72rem" }}>
                                  {q.author?.firstName} {q.author?.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "0.58rem", mt: -0.4 }}>
                                  {q.college?.collegeName}
                                </Typography>
                              </Box>
                            </Stack>

                            <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

                            {/* EXPLICIT LIKE / DISLIKE BUTTONS */}
                            <Stack
                              direction="row"
                              alignItems="center"
                              onClick={(e) => e.stopPropagation()} // stop click card detail navigation
                              sx={{
                                bgcolor: "rgba(255, 255, 255, 0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: "8px",
                                p: 0.3,
                              }}
                            >
                              <Button
                                size="small"
                                onClick={() => handleQueryVote(q._id, true)}
                                startIcon={<ThumbUp sx={{ fontSize: 11 }} />}
                                sx={{
                                  textTransform: "none",
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  color: hasUpvoted ? "#10B981" : "text.secondary",
                                  bgcolor: hasUpvoted ? "rgba(16, 185, 129, 0.15)" : "transparent",
                                  border: "1px solid",
                                  borderColor: hasUpvoted ? "rgba(16, 185, 129, 0.3)" : "transparent",
                                  borderRadius: "6px",
                                  minWidth: "unset",
                                  px: 1.5,
                                  py: 0.2,
                                  "&:hover": {
                                    bgcolor: "rgba(16, 185, 129, 0.1)",
                                    color: "#10B981",
                                  },
                                }}
                              >
                                {q.upvotes?.length || 0}
                              </Button>
                              <Box sx={{ width: "1px", height: 12, bgcolor: "rgba(255,255,255,0.08)", mx: 0.5 }} />
                              <Button
                                size="small"
                                onClick={() => handleQueryVote(q._id, false)}
                                startIcon={<ThumbDown sx={{ fontSize: 11 }} />}
                                sx={{
                                  textTransform: "none",
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  color: hasDownvoted ? "#F43F5E" : "text.secondary",
                                  bgcolor: hasDownvoted ? "rgba(244, 63, 94, 0.15)" : "transparent",
                                  border: "1px solid",
                                  borderColor: hasDownvoted ? "rgba(244, 63, 94, 0.3)" : "transparent",
                                  borderRadius: "6px",
                                  minWidth: "unset",
                                  px: 1.5,
                                  py: 0.2,
                                  "&:hover": {
                                    bgcolor: "rgba(244, 63, 94, 0.1)",
                                    color: "#F43F5E",
                                  },
                                }}
                              >
                                {q.downvotes?.length || 0}
                              </Button>
                            </Stack>

                            <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

                            <Stack
                              direction="row"
                              spacing={0.8}
                              alignItems="center"
                              sx={{
                                color: "text.secondary",
                                bgcolor: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: "8px",
                                px: 1.5,
                                py: 0.5,
                              }}
                            >
                              <CommentIcon sx={{ fontSize: 12 }} />
                              <Typography variant="caption" fontWeight={750} sx={{ fontSize: "0.68rem" }}>
                                {q.answersCount || 0} answers
                              </Typography>
                            </Stack>

                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                              {formatRelativeTime(q.createdAt)}
                            </Typography>

                            {/* Pin Query Button (list view) */}
                            {canModerate && sameCollege(q.college) && (
                              <Box onClick={(e) => e.stopPropagation()}>
                                <Tooltip title={q.isPinned ? "Unpin Question" : "Pin Question"}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handlePinQuery(q._id)}
                                    sx={{
                                      color: q.isPinned ? "primary.main" : "text.secondary",
                                      bgcolor: q.isPinned ? "rgba(99, 102, 241, 0.1)" : "rgba(255,255,255,0.03)",
                                      border: "1px solid rgba(255,255,255,0.06)",
                                      p: 0.5,
                                      "&:hover": { bgcolor: "rgba(99, 102, 241, 0.15)" },
                                    }}
                                  >
                                    <PushPin sx={{ fontSize: 13, transform: q.isPinned ? "rotate(45deg)" : "none" }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}

                            {/* Delete Query Button (list view) */}
                            {(q.author?._id === user._id ||
                              isSuperAdmin ||
                              (isCollegeAdmin && sameCollege(q.college)) ||
                              (isModerator && sameCollege(q.college))) && (
                              <Box onClick={(e) => e.stopPropagation()}>
                                <Tooltip title="Delete Question">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteQuery(q._id)}
                                    sx={{
                                      color: "error.main",
                                      bgcolor: "rgba(244, 63, 94, 0.05)",
                                      border: "1px solid rgba(244, 63, 94, 0.15)",
                                      p: 0.5,
                                      "&:hover": { bgcolor: "rgba(244, 63, 94, 0.15)" },
                                    }}
                                  >
                                    <Delete sx={{ fontSize: 13 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}

                            {/* Report Query Button (list view) */}
                            {q.author?._id !== user._id && (
                              <Box onClick={(e) => e.stopPropagation()}>
                                <Tooltip title="Report Question">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleReportQuery(q._id)}
                                    sx={{
                                      color: "warning.main",
                                      bgcolor: "rgba(245, 158, 11, 0.05)",
                                      border: "1px solid rgba(245, 158, 11, 0.15)",
                                      p: 0.5,
                                      "&:hover": { bgcolor: "rgba(245, 158, 11, 0.15)" },
                                    }}
                                  >
                                    <Flag sx={{ fontSize: 13 }} />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </Stack>
                        </Stack>
                      </Box>
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
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 620,
            bgcolor: "#0B1120",
            border: "1px solid rgba(255, 255, 255, 0.10)",
            borderRadius: "20px",
            overflow: "hidden",
            maxHeight: "92vh",
            overflowY: "auto",
          }}
        >
          {/* Modal Header */}
          <Box
            sx={{
              px: 4,
              pt: 4,
              pb: 3,
              background: "linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(236, 72, 153, 0.06) 100%)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
                  }}
                >
                  <HelpOutline sx={{ fontSize: 18, color: "#fff" }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
                    Ask a Campus Question
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
                    Get verified answers from peers & faculty
                  </Typography>
                </Box>
              </Stack>
              <IconButton
                onClick={() => setAskModalOpen(false)}
                size="small"
                sx={{
                  color: "text.secondary",
                  bgcolor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                }}
              >
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          </Box>

          {/* Modal Body */}
          <Box component="form" onSubmit={handleAskSubmit} sx={{ px: 4, py: 3.5 }}>

            {/* Question Title */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ fontSize: "0.78rem" }}>
                  Question Title <Box component="span" sx={{ color: "error.main" }}>*</Box>
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                  Be specific and clear
                </Typography>
              </Stack>
              <TextField
                placeholder="e.g. What is the B.Tech CSE semester fee installment schedule?"
                fullWidth
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    bgcolor: "rgba(255, 255, 255, 0.03)",
                    fontSize: "0.88rem",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.14)" },
                    "&.Mui-focused fieldset": { borderColor: "#6366F1" },
                  },
                  "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.25)", opacity: 1 },
                }}
              />
            </Box>

            {/* Description */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ fontSize: "0.78rem" }}>
                  Detailed Description <Box component="span" sx={{ color: "error.main" }}>*</Box>
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                  Include context, course codes, or docs
                </Typography>
              </Stack>
              <TextField
                placeholder="Describe your question in detail. What have you already tried? Any relevant info like semester, course code, or department..."
                fullWidth
                required
                multiline
                rows={5}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    bgcolor: "rgba(255, 255, 255, 0.03)",
                    fontSize: "0.85rem",
                    alignItems: "flex-start",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.14)" },
                    "&.Mui-focused fieldset": { borderColor: "#6366F1" },
                  },
                  "& .MuiInputBase-input::placeholder": { color: "rgba(255,255,255,0.25)", opacity: 1 },
                }}
              />
            </Box>

            {/* Category Tag */}
            <Box sx={{ mb: 4 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ fontSize: "0.78rem" }}>
                  Category / Topic Tag
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                  Helps others find your question faster
                </Typography>
              </Stack>
              <Select
                fullWidth
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                sx={{
                  borderRadius: "10px",
                  bgcolor: "rgba(255, 255, 255, 0.03)",
                  fontSize: "0.85rem",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.08)" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.14)" },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#6366F1" },
                  "& .MuiSelect-icon": { color: "text.secondary" },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: "#0F172A",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      mt: 0.5,
                    },
                  },
                }}
              >
                {[
                  { value: "general", label: "💬 General", desc: "General questions & discussions" },
                  { value: "fees", label: "💰 Fees & Finance", desc: "Fee structure, scholarships, payments" },
                  { value: "exams", label: "📝 Exams & Academics", desc: "Exam schedules, syllabus, results" },
                  { value: "placements", label: "💼 Placements & Careers", desc: "Campus placements, internships" },
                  { value: "tech", label: "💻 Technology & Projects", desc: "Coding, tech stacks, projects" },
                  { value: "hostellife", label: "🏠 Hostel & Campus Life", desc: "Hostel, mess, events, sports" },
                  { value: "academics", label: "🎓 Courses & Faculty", desc: "Subject queries, faculty info" },
                ].map((opt) => (
                  <MenuItem key={opt.value} value={opt.value} sx={{ py: 1.5 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.82rem" }}>{opt.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem" }}>{opt.desc}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* Footer Actions */}
            <Box
              sx={{
                pt: 3,
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.68rem" }}>
                Your question will be visible to your campus community.
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button
                  onClick={() => setAskModalOpen(false)}
                  sx={{
                    color: "text.secondary",
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "8px",
                    px: 2,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submittingQuery || !newTitle.trim() || !newDescription.trim()}
                  startIcon={submittingQuery ? null : <Send sx={{ fontSize: 14 }} />}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                    px: 3,
                    py: 1,
                    fontSize: "0.82rem",
                    background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
                    "&:hover": { boxShadow: "0 6px 20px rgba(79, 70, 229, 0.5)" },
                    "&.Mui-disabled": { opacity: 0.45, background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", color: "#fff" },
                  }}
                >
                  {submittingQuery ? "Posting..." : "Post Question"}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Modal>
    </Box>
  );
}
