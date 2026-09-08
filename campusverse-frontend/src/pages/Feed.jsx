import React, { useEffect, useState, useRef } from "react";
import {
  Box, Typography, Paper, Stack, Button, TextField, Avatar,
  IconButton, Switch, FormControlLabel, Divider, CircularProgress,
  Grid, Card, CardContent, Collapse, Badge, Chip, AvatarGroup,
} from "@mui/material";
import {
  ArrowUpward, ArrowDownward, Comment as CommentIcon,
  Delete, Campaign, Security, Send, School, AccountCircle,
  AttachFile, Close, VideoLibrary, Image, PlayCircleOutline,
  Info, Shield, Star, TrendingUp, LocationOn, SmartToy, Flag,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useThemeContext } from "../context/CustomThemeContext.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import api from "../api/axios.js";
import useRole from "../hooks/useRole.js";

export default function Feed() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isDark, colors } = useThemeContext();
  const { isSuperAdmin, isCollegeAdmin, isModerator, canModerate, sameCollege } = useRole();
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

  const [posts, setPosts] = useState([]);
  const [collegeDetails, setCollegeDetails] = useState(null);

  // Confirmation Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const requestConfirmation = (title, message, onConfirmAction) => {
    setConfirmConfig({
      title,
      message,
      onConfirm: () => {
        onConfirmAction();
        setConfirmOpen(false);
      },
    });
    setConfirmOpen(true);
  };
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Post Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Post Attachments State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const fileInputRef = useRef(null);

  // Comments Section State per Post
  const [expandedComments, setExpandedComments] = useState({}); // { postId: boolean }
  const [commentsData, setCommentsData] = useState({}); // { postId: Array }
  const [loadingComments, setLoadingComments] = useState({}); // { postId: boolean }
  const [newCommentText, setNewCommentText] = useState({}); // { postId: string }
  const [commentIsAnonymous, setCommentIsAnonymous] = useState({}); // { postId: boolean }

  // Fetch college details & posts
  useEffect(() => {
    if (!user?.college) return;

    const fetchCollege = async () => {
      try {
        const { data } = await api.get(`/colleges/${user.college}`);
        setCollegeDetails(data);
      } catch (err) {
        console.error("Failed to fetch college details:", err);
      }
    };

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/feed/posts/${user.college}`);
        setPosts(data || []);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCollege();
    fetchPosts();
  }, [user?.college]);

  // Handle files selected for post attachments
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setSelectedFiles(prev => [...prev, ...files]);

    const newPreviews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image"
    }));
    setFilePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeAttachment = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Create post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("collegeId", user.college);
      formData.append("isAnonymous", isAnonymous);

      selectedFiles.forEach(file => {
        formData.append("attachments", file);
      });

      const { data } = await api.post("/feed/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPosts([data, ...posts]);
      setTitle("");
      setContent("");
      setIsAnonymous(false);
      setSelectedFiles([]);
      setFilePreviews([]);
      setIsExpanded(false);
      showToast("Post created successfully!", "success");
    } catch (err) {
      console.error("Failed to create post:", err);
      showToast(err.response?.data?.message || "Failed to create post.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    requestConfirmation(
      "Delete Post?",
      "Are you sure you want to delete this post? This action cannot be undone.",
      async () => {
        try {
          await api.delete(`/feed/posts/${postId}`);
          setPosts(posts.filter((p) => p._id !== postId));
          showToast("Post deleted successfully.", "success");
        } catch (err) {
          console.error("Failed to delete post:", err);
          showToast(err.response?.data?.message || "Failed to delete post.", "error");
        }
      }
    );
  };

  // Report post
  const handleReportPost = async (postId) => {
    requestConfirmation(
      "Report Post?",
      "Are you sure you want to report this post to the moderators?",
      async () => {
        try {
          await api.put(`/feed/posts/${postId}/report`);
          showToast("Post reported successfully. Our team will review it.", "success");
        } catch (err) {
          console.error("Failed to report post:", err);
          showToast(err.response?.data?.message || "Failed to report post.", "error");
        }
      }
    );
  };

  // Vote post
  const handleVote = async (postId, direction) => {
    try {
      const { data } = await api.post(`/feed/posts/${postId}/vote`, { direction });
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, upvotes: data.upvotes, downvotes: data.downvotes, votesCount: data.votesCount } : p))
      );
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  // Fetch comments
  const toggleComments = async (postId) => {
    const isCurrentlyExpanded = expandedComments[postId];

    // Toggle visually
    setExpandedComments((prev) => ({ ...prev, [postId]: !isCurrentlyExpanded }));

    if (isCurrentlyExpanded) return; // Closing, no need to fetch

    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const { data } = await api.get(`/feed/posts/${postId}/comments`);
      setCommentsData((prev) => ({ ...prev, [postId]: data }));
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Create comment
  const handleCreateComment = async (e, postId) => {
    e.preventDefault();
    const commentText = newCommentText[postId] || "";
    if (!commentText.trim()) return;

    const isAnon = commentIsAnonymous[postId] || false;

    try {
      const { data } = await api.post(`/feed/posts/${postId}/comments`, {
        content: commentText,
        isAnonymous: isAnon,
      });

      // Update state
      setCommentsData((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data],
      }));
      setNewCommentText((prev) => ({ ...prev, [postId]: "" }));
      setCommentIsAnonymous((prev) => ({ ...prev, [postId]: false }));
    } catch (err) {
      console.error("Failed to create comment:", err);
      showToast(err.response?.data?.message || "Failed to create comment.", "error");
    }
  };

  // Delete comment
  const handleDeleteComment = async (postId, commentId) => {
    requestConfirmation(
      "Delete Comment?",
      "Are you sure you want to delete this comment? This action cannot be undone.",
      async () => {
        try {
          await api.delete(`/feed/comments/${commentId}`);
          setCommentsData((prev) => ({
            ...prev,
            [postId]: prev[postId].filter((c) => c._id !== commentId),
          }));
          showToast("Comment deleted successfully.", "success");
        } catch (err) {
          console.error("Failed to delete comment:", err);
          showToast(err.response?.data?.message || "Failed to delete comment.", "error");
        }
      }
    );
  };

  if (!user) {
    return (
      <Box sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Grid container spacing={4}>
        {/* Left Column: Feed Content & Editor */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Header Banner */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              border: "1px solid",
              borderColor: colors.borderColor,
              bgcolor: colors.feedCardBg,
              backdropFilter: "blur(12px)",
              borderRadius: "24px",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Avatar sx={{ bgcolor: "rgba(79, 70, 229, 0.15)", color: "primary.main", width: 56, height: 56 }}>
              <Campaign sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="900" sx={{ color: colors.subVerseTitle }}>
                Campus Sub-Verse
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {collegeDetails?.collegeName || "Loading Campus..."} · Local Anonymous Community
              </Typography>
            </Box>
          </Paper>

          {/* Create Post Area */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              border: "1px solid",
              borderColor: colors.borderColor,
              bgcolor: colors.feedCardBg,
              backdropFilter: "blur(12px)",
              borderRadius: "24px",
              transition: "all 0.3s ease",
              "&:hover": { borderColor: colors.primary },
            }}
          >
            <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
              Share something with the campus
            </Typography>

            <Stack spacing={2} component="form" onSubmit={handleCreatePost}>
              {isExpanded && (
                <TextField
                  placeholder="Give your post a title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                  variant="outlined"
                  size="medium"
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "14px",
                      bgcolor: colors.bgInput,
                      border: `1px solid ${colors.borderColor}`,
                      color: colors.inputText,
                      "& fieldset": { border: "none" },
                    },
                  }}
                />
              )}

              <TextField
                placeholder="What's happening on campus? Rants, events, questions..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                fullWidth
                multiline
                rows={isExpanded ? 4 : 1}
                variant="outlined"
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                    bgcolor: colors.bgInput,
                    border: `1px solid ${colors.borderColor}`,
                    color: colors.inputText,
                    "& fieldset": { border: "none" },
                  },
                }}
              />

              {isExpanded && (
                <Box>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  
                  {filePreviews.length > 0 && (
                    <Box
                      sx={{
                        p: 2,
                        mb: 2,
                        border: `1px solid ${colors.borderColor}`,
                        borderRadius: "14px",
                        bgcolor: colors.commentBg,
                        display: "flex",
                        gap: 2,
                        overflowX: "auto",
                      }}
                    >
                      {filePreviews.map((preview, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: "relative",
                            width: 80,
                            height: 80,
                            borderRadius: "10px",
                            overflow: "hidden",
                            border: `1px solid ${colors.borderColor}`,
                            flexShrink: 0,
                          }}
                        >
                          {preview.type === "image" ? (
                            <Box
                              component="img"
                              src={preview.url}
                              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: "100%",
                                height: "100%",
                                bgcolor: colors.pillBg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <VideoLibrary sx={{ fontSize: 28, color: "text.secondary" }} />
                            </Box>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => removeAttachment(index)}
                            sx={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              bgcolor: "rgba(0, 0, 0, 0.6)",
                              color: "#fff",
                              p: 0.3,
                              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.8)" },
                            }}
                          >
                            <Close sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {isExpanded && (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Security sx={{ fontSize: 18, color: isAnonymous ? "primary.main" : "text.secondary" }} />
                          <Typography variant="body2" fontWeight={600} color={isAnonymous ? "primary.main" : "text.secondary"}>
                            Post Anonymously
                          </Typography>
                        </Stack>
                      }
                    />

                    <IconButton
                      color="primary"
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        p: 0.6,
                        bgcolor: colors.pillBg,
                        border: `1px solid ${colors.borderColor}`,
                        borderRadius: "30px",
                        "&:hover": { bgcolor: colors.pillHoverBg },
                      }}
                    >
                      <AttachFile sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>

                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="outlined"
                      size="medium"
                      onClick={() => {
                        setIsExpanded(false);
                        setTitle("");
                        setContent("");
                        setIsAnonymous(false);
                        setSelectedFiles([]);
                        setFilePreviews([]);
                      }}
                      sx={{ borderRadius: "30px", textTransform: "none", fontWeight: 700, px: 2, py: 0.5, fontSize: "0.75rem", height: 28 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={submitting}
                      sx={{
                        borderRadius: "30px",
                        textTransform: "none",
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                        boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)",
                        px: 2.2,
                        py: 0.5,
                        fontSize: "0.75rem",
                        height: 28,
                      }}
                    >
                      {submitting ? "Posting..." : "Post"}
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Stack>
          </Paper>

          {/* Main Feed List */}
          {loading ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <CircularProgress size={45} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading feed posts...
              </Typography>
            </Box>
          ) : posts.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                py: 10,
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "24px",
                bgcolor: "rgba(255, 255, 255, 0.01)",
              }}
            >
              <Campaign sx={{ fontSize: 60, color: "text.secondary", mb: 2, opacity: 0.15 }} />
              <Typography variant="h6" color="text.secondary" fontWeight="700">
                Feed is quiet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Be the first to share something with your campus!
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={4}>
              {posts.map((post) => {
                const hasUpvoted = post.upvotes?.includes(user._id);
                const hasDownvoted = post.downvotes?.includes(user._id);
                const isMyPost = post.isEditable;

                const postVotesCount = post.votesCount !== undefined ? post.votesCount : ((post.upvotes?.length || 0) - (post.downvotes?.length || 0));

                return (
                  <Paper
                    key={post._id}
                    elevation={0}
                    sx={{
                      p: 3,
                      border: "1px solid",
                      borderColor: colors.borderColor,
                      borderRadius: "24px",
                      bgcolor: colors.feedCardBg,
                      backdropFilter: "blur(8px)",
                      overflow: "hidden",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        borderColor: colors.primary,
                        transform: "translateY(-2px)",
                        boxShadow: colors.cardShadow,
                      },
                    }}
                  >
                    {/* Post Header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          src={post.author?.photo ? `${apiBase}/uploads/${post.author.photo}` : undefined}
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: post.isAnonymous ? colors.pillBg : "primary.light",
                          }}
                        >
                          {post.isAnonymous ? "?" : post.author?.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {post.isAnonymous ? "Anonymous Student" : `${post.author?.firstName || ""} ${post.author?.lastName || ""}`}
                            {post.isAnonymous && (
                              <Chip
                                icon={<Security sx={{ fontSize: "11px !important" }} />}
                                label="Anonymous"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.62rem",
                                  bgcolor: "rgba(236, 72, 153, 0.08)",
                                  color: "#EC4899",
                                  border: "1px solid rgba(236, 72, 153, 0.2)",
                                  fontWeight: 800,
                                }}
                              />
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {post.isAnonymous ? "Campus Community" : `${post.author?.course || ""} / ${post.author?.branch || ""}`} · {new Date(post.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Header Actions */}
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {/* Report Post */}
                        {!isMyPost && (
                          <Tooltip title="Report Post">
                            <IconButton
                              color="warning"
                              size="small"
                              onClick={() => handleReportPost(post._id)}
                              sx={{
                                opacity: 0.4,
                                "&:hover": { 
                                  opacity: 1, 
                                  bgcolor: "rgba(245, 158, 11, 0.08)" 
                                },
                                borderRadius: "10px",
                                p: 0.8,
                              }}
                            >
                              <Flag sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Delete Post */}
                        {(isMyPost ||
                          isSuperAdmin ||
                          (canModerate && sameCollege(post.college))) && (
                          <Tooltip title="Delete Post">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleDeletePost(post._id)}
                              sx={{
                                opacity: 0.4,
                                "&:hover": { 
                                  opacity: 1, 
                                  bgcolor: "rgba(239, 68, 68, 0.08)" 
                                },
                                borderRadius: "10px",
                                p: 0.8,
                              }}
                            >
                              <Delete sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>

                    {/* Post Content */}
                    <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mb: 1.2, fontSize: "1.1rem" }}>
                      {post.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6, whiteSpace: "pre-line", fontSize: "0.9rem" }}>
                      {post.content}
                    </Typography>

                    {/* Post Attachments */}
                    {post.attachments && post.attachments.length > 0 && (
                      <Grid container spacing={1.5} sx={{ mb: 3 }}>
                        {post.attachments.map((att, idx) => (
                          <Grid item xs={post.attachments.length > 1 ? 6 : 12} sm={post.attachments.length > 1 ? 4 : 12} key={idx}>
                            {att.fileType === "image" ? (
                              <Box
                                component="img"
                                src={`${apiBase}/uploads/${att.url}`}
                                alt="Post Attachment"
                                sx={{
                                  width: "100%",
                                  maxHeight: 280,
                                  objectFit: "cover",
                                  borderRadius: "14px",
                                  border: `1px solid ${colors.borderColor}`,
                                  cursor: "pointer",
                                  transition: "transform 0.2s",
                                  "&:hover": { transform: "scale(1.02)" },
                                }}
                                onClick={() => window.open(`${apiBase}/uploads/${att.url}`, "_blank")}
                              />
                            ) : (
                              <Box
                                sx={{
                                  position: "relative",
                                  width: "100%",
                                  maxHeight: 280,
                                  borderRadius: "14px",
                                  border: `1px solid ${colors.borderColor}`,
                                  overflow: "hidden",
                                  bgcolor: "#000",
                                }}
                              >
                                <Box
                                  component="video"
                                  src={`${apiBase}/uploads/${att.url}`}
                                  controls
                                  sx={{ width: "100%", maxHeight: 280, display: "block" }}
                                />
                              </Box>
                            )}
                          </Grid>
                        ))}
                      </Grid>
                    )}

                    <Divider sx={{ mb: 2.2, borderColor: colors.borderColor }} />

                    {/* Post Footer Action Bar */}
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      {/* Vote Pill */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          bgcolor: colors.pillBg,
                          border: `1px solid ${colors.borderColor}`,
                          borderRadius: "30px",
                          overflow: "hidden",
                          height: 28,
                        }}
                      >
                        <IconButton
                          onClick={() => handleVote(post._id, "up")}
                          size="small"
                          sx={{
                            color: hasUpvoted ? "#FF4500" : "text.secondary",
                            px: 1.2,
                            borderRadius: 0,
                            height: "100%",
                            "&:hover": { 
                              bgcolor: "rgba(255, 69, 0, 0.08)",
                              color: "#FF4500"
                            },
                          }}
                        >
                          <ArrowUpward sx={{ fontSize: 13 }} />
                        </IconButton>
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          sx={{
                            px: 0.2,
                            minWidth: 16,
                            textAlign: "center",
                            color: hasUpvoted ? "#FF4500" : hasDownvoted ? "#7193FF" : "text.primary",
                            fontSize: "0.72rem",
                          }}
                        >
                          {postVotesCount}
                        </Typography>
                        <IconButton
                          onClick={() => handleVote(post._id, "down")}
                          size="small"
                          sx={{
                            color: hasDownvoted ? "#7193FF" : "text.secondary",
                            px: 1.2,
                            borderRadius: 0,
                            height: "100%",
                            "&:hover": { 
                              bgcolor: "rgba(113, 147, 255, 0.08)",
                              color: "#7193FF"
                            },
                          }}
                        >
                          <ArrowDownward sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Box>

                      {/* Comment Button */}
                      <Button
                        startIcon={<CommentIcon sx={{ fontSize: 12 }} />}
                        onClick={() => toggleComments(post._id)}
                        size="small"
                        sx={{
                          color: expandedComments[post._id] ? "primary.main" : "text.secondary",
                          textTransform: "none",
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          borderRadius: "30px",
                          height: 28,
                          px: 1.8,
                          border: "1px solid",
                          borderColor: expandedComments[post._id] ? colors.primary : colors.borderColor,
                          bgcolor: expandedComments[post._id] ? (isDark ? "rgba(79, 70, 229, 0.15)" : "rgba(79, 70, 229, 0.1)") : colors.pillBg,
                          "&:hover": { 
                            bgcolor: colors.pillHoverBg,
                            borderColor: expandedComments[post._id] ? colors.primary : colors.borderHover,
                          },
                        }}
                      >
                        Comments
                      </Button>
                    </Stack>

                    {/* Expandable Comments Drawer Section */}
                    <Collapse in={expandedComments[post._id]} timeout="auto" unmountOnExit>
                      <Box
                        sx={{
                          mt: 3,
                          pt: 3,
                          borderTop: `1px solid ${colors.borderColor}`,
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 2 }}>
                          Discussion
                        </Typography>

                        {/* Add Comment Field */}
                        <Box component="form" onSubmit={(e) => handleCreateComment(e, post._id)} sx={{ mb: 3 }}>
                          <TextField
                            placeholder="Write a comment..."
                            value={newCommentText[post._id] || ""}
                            onChange={(e) =>
                              setNewCommentText((prev) => ({ ...prev, [post._id]: e.target.value }))
                            }
                            fullWidth
                            multiline
                            rows={2}
                            variant="outlined"
                            required
                            sx={{
                              mb: 2,
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "14px",
                                bgcolor: colors.bgInput,
                                border: `1px solid ${colors.borderColor}`,
                                color: colors.inputText,
                                "& fieldset": { border: "none" },
                              },
                            }}
                          />

                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={commentIsAnonymous[post._id] || false}
                                  onChange={(e) =>
                                    setCommentIsAnonymous((prev) => ({ ...prev, [post._id]: e.target.checked }))
                                  }
                                  size="small"
                                  color="primary"
                                />
                              }
                              label={
                                <Typography variant="caption" fontWeight={700} color="text.secondary">
                                  Anonymous Comment
                                </Typography>
                              }
                            />

                            <Button
                              type="submit"
                              variant="contained"
                              size="small"
                              endIcon={<Send sx={{ fontSize: 12 }} />}
                              sx={{
                                borderRadius: "30px",
                                fontWeight: 700,
                                textTransform: "none",
                                py: 0.5,
                                px: 1.8,
                                fontSize: "0.72rem",
                                bgcolor: "primary.main",
                              }}
                            >
                              Reply
                            </Button>
                          </Stack>
                        </Box>

                        {/* Comments List */}
                        {loadingComments[post._id] ? (
                          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                            <CircularProgress size={24} />
                          </Box>
                        ) : !commentsData[post._id] || commentsData[post._id].length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                            No comments yet. Start the conversation!
                          </Typography>
                        ) : (
                          <Stack spacing={2}>
                            {commentsData[post._id].map((comment) => {
                              const isMyComment = comment.isEditable;

                              return (
                                <Box
                                  key={comment._id}
                                  sx={{
                                    p: 2.2,
                                    borderRadius: "16px",
                                    bgcolor: colors.commentBg,
                                    border: `1px solid ${colors.borderColor}`,
                                    borderLeft: comment.isAnonymous ? "3px solid #EC4899" : "3px solid #4F46E5",
                                    position: "relative",
                                    transition: "all 0.2s ease-in-out",
                                    "&:hover": {
                                      bgcolor: colors.pillHoverBg,
                                      borderColor: colors.borderHover,
                                    },
                                  }}
                                >
                                  {/* Comment Header */}
                                  <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1 }}>
                                    <Avatar
                                      src={comment.author?.photo ? `${apiBase}/uploads/${comment.author.photo}` : undefined}
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        bgcolor: comment.isAnonymous ? colors.pillBg : "primary.light",
                                        fontSize: 12,
                                      }}
                                    >
                                      {comment.isAnonymous ? "?" : comment.author?.firstName?.[0]}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="caption" fontWeight={800} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                        {comment.isAnonymous ? "Anonymous Student" : `${comment.author?.firstName || ""} ${comment.author?.lastName || ""}`}
                                        {comment.isAnonymous && (
                                          <Chip
                                            icon={<Security sx={{ fontSize: "10px !important" }} />}
                                            label="Anonymous"
                                            size="small"
                                            sx={{
                                              height: 16,
                                              fontSize: "0.6rem",
                                              bgcolor: colors.pillBg,
                                              color: "text.secondary",
                                              fontWeight: 700,
                                            }}
                                          />
                                        )}
                                      </Typography>
                                      <Typography variant="caption" color="text.disabled" display="block" sx={{ fontSize: "0.65rem", mt: 0.1 }}>
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                      </Typography>
                                    </Box>
                                  </Stack>

                                  {/* Comment Text */}
                                  <Typography variant="body2" color="text.primary" sx={{ pl: 0.2, pr: 4, wordBreak: "break-word" }}>
                                    {comment.content}
                                  </Typography>

                                  {/* Delete Comment */}
                                  {isMyComment && (
                                    <IconButton
                                      color="error"
                                      size="small"
                                      onClick={() => handleDeleteComment(post._id, comment._id)}
                                      sx={{
                                        position: "absolute",
                                        top: 12,
                                        right: 12,
                                        opacity: 0.5,
                                        "&:hover": { opacity: 1 },
                                      }}
                                    >
                                      <Delete sx={{ fontSize: 15 }} />
                                    </IconButton>
                                  )}
                                </Box>
                              );
                            })}
                          </Stack>
                        )}
                      </Box>
                    </Collapse>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Grid>

        {/* Right Column: Widgets */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* College Profile widget */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: "1px solid",
              borderColor: colors.borderColor,
              bgcolor: colors.feedCardBg,
              backdropFilter: "blur(12px)",
              borderRadius: "24px",
            }}
          >
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: "rgba(79, 70, 229, 0.12)", width: 44, height: 44 }}>
                  <School sx={{ fontSize: 24, color: "primary.main" }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={900} color="text.primary">
                    {collegeDetails?.collegeName || "Loading..."}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <LocationOn sx={{ fontSize: 12, color: "primary.main" }} />
                    {collegeDetails?.city || "Local Campus"}
                  </Typography>
                </Box>
              </Stack>
              
              <Divider sx={{ borderColor: colors.borderColor }} />
              
              <Box>
                <Typography variant="caption" color="primary.main" fontWeight={800} display="block" sx={{ mb: 1, textTransform: "uppercase", letterSpacing: 1 }}>
                  Campus Space Description
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "0.85rem" }}>
                  This board serves as your college's localized hub. Only verified students from your domain can read, write, or upvote threads. Anonymity is securely protected by cryptographic checks.
                </Typography>
              </Box>

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ bgcolor: colors.commentBg, p: 2, borderRadius: "16px", border: "1px solid", borderColor: colors.borderColor }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={900} color="primary.main">
                    120+ Active Space
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                    Verified classmate profiles
                  </Typography>
                </Box>
                <AvatarGroup max={3} sx={{ "& .MuiAvatar-root": { width: 26, height: 26, fontSize: 10, border: "2px solid", borderColor: "background.paper" } }}>
                  <Avatar sx={{ bgcolor: "#F59E0B" }}>M</Avatar>
                  <Avatar sx={{ bgcolor: "#10B981" }}>H</Avatar>
                  <Avatar sx={{ bgcolor: "#EF4444" }}>D</Avatar>
                </AvatarGroup>
              </Stack>
            </Stack>
          </Paper>

          {/* Guidelines widget */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: "1px solid",
              borderColor: colors.borderColor,
              bgcolor: colors.feedCardBg,
              backdropFilter: "blur(12px)",
              borderRadius: "24px",
            }}
          >
            <Typography variant="subtitle2" fontWeight={900} color="text.primary" sx={{ mb: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
              <Shield sx={{ color: "primary.main", fontSize: 20 }} />
              Community Space Rules
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Typography variant="body2" fontWeight={800} color="primary.main">1.</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: "0.78rem" }}>
                  <strong>Secure Boundaries:</strong> Do not attempt to reveal the identity of anonymous authors. Respect their privacy.
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Typography variant="body2" fontWeight={800} color="primary.main">2.</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: "0.78rem" }}>
                  <strong>Academic Decorum:</strong> Treat classmates with respect. Avoid targeted harassment or offensive content.
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Typography variant="body2" fontWeight={800} color="primary.main">3.</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, fontSize: "0.78rem" }}>
                  <strong>Topic Moderation:</strong> Discussions must relate to campus events, coursework, rants, or student feedback.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <ConfirmationModal
        open={confirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
