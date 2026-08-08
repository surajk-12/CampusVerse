import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Drawer,
  IconButton,
  TextField,
  Button,
  Stack,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
  Chip,
  Grid,
  Tooltip,
} from "@mui/material";
import {
  SmartToy,
  Close,
  Send,
  Navigation,
  Search,
  Logout,
  Dashboard as DashboardIcon,
  Campaign as FeedIcon,
  School as NotesIcon,
  Storefront as MarketIcon,
  Forum as ChatIcon,
  People as PeopleIcon,
  Notifications as BellIcon,
  AccountCircle as ProfileIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

export default function GlobalAiCopilot() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your CampusVerse AI Agent. You can query notes, search cycles/items, log out, or navigate by telling me what you want to do!",
    },
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!user) return null; // Only show if logged in

  const handleSend = async (textToSend) => {
    const text = textToSend || query;
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    if (!textToSend) setQuery("");
    setLoading(true);

    try {
      const { data: result } = await api.post("/ai/global", { query: text });

      setMessages((prev) => [...prev, { sender: "ai", text: result.reply, action: result.action }]);

      // Process Action with subtle delay for readability
      if (result.action === "navigate" && result.path) {
        setTimeout(() => {
          navigate(result.path);
          setOpen(false);
        }, 1500);
      } else if (result.action === "logout") {
        setTimeout(() => {
          logout();
          navigate("/login");
          setOpen(false);
        }, 1500);
      } else if (result.action === "search" && result.path && result.searchQuery) {
        setTimeout(() => {
          navigate(`${result.path}?aiSearch=${encodeURIComponent(result.searchQuery)}`);
          setOpen(false);
        }, 1500);
      }
    } catch (err) {
      console.error("Global AI query error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Oops, I encountered a communication error with the campus brain. Try again in a second!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const navCards = [
    { label: "Dashboard", icon: DashboardIcon, cmd: "go to dashboard", color: "#6366F1" },
    { label: "Feed", icon: FeedIcon, cmd: "open campus feed", color: "#EC4899" },
    { label: "Notes", icon: NotesIcon, cmd: "show study notes", color: "#10B981" },
    { label: "Market", icon: MarketIcon, cmd: "go to marketplace", color: "#F59E0B" },
    { label: "Chats", icon: ChatIcon, cmd: "open messenger chats", color: "#3B82F6" },
    { label: "Friends", icon: PeopleIcon, cmd: "go to connections", color: "#8B5CF6" },
  ];

  return (
    <>
      {/* Floating Agent FAB */}
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          zIndex: 1200,
          background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
          color: "#FFFFFF",
          boxShadow: "0 8px 24px rgba(79, 70, 229, 0.45), 0 0 0 4px rgba(79, 70, 229, 0.15)",
          transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          "&:hover": {
            transform: "scale(1.1) translateY(-4px)",
            boxShadow: "0 12px 30px rgba(79, 70, 229, 0.6), 0 0 0 6px rgba(79, 70, 229, 0.25)",
          },
        }}
      >
        <SmartToy sx={{ fontSize: 30 }} />
      </IconButton>

      {/* Slide-out Control Center Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 420 },
            bgcolor: "rgba(15, 23, 42, 0.82)",
            backdropFilter: "blur(20px)",
            borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.7)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
      >
        {/* Header Block */}
        <Box
          sx={{
            p: 3,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(to bottom, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ position: "relative" }}>
              <Avatar
                sx={{
                  background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                  width: 42,
                  height: 42,
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.4)",
                }}
              >
                <SmartToy sx={{ fontSize: 22 }} />
              </Avatar>
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  bgcolor: "#10B981",
                  borderRadius: "50%",
                  border: "2px solid #0F172A",
                  boxShadow: "0 0 8px #10B981",
                }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={900} color="text.primary" sx={{ letterSpacing: "-0.01em" }}>
                CampusVerse Agent
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", opacity: 0.8 }}>
                AI Voice & Control Center
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={() => setOpen(false)} size="small" sx={{ color: "text.secondary", "&:hover": { color: "#FFFFFF" } }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Command Center Navigation Grid */}
        <Box sx={{ p: 2.5, borderBottom: "1px solid rgba(255,255,255,0.05)", bgcolor: "rgba(15, 23, 42, 0.3)" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={800}
            sx={{ display: "block", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.62rem" }}
          >
            Interactive Control Center
          </Typography>
          <Grid container spacing={1.5}>
            {navCards.map((card) => {
              const CardIcon = card.icon;
              return (
                <Grid item xs={4} key={card.label}>
                  <Paper
                    onClick={() => handleSend(card.cmd)}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      borderRadius: "12px",
                      background: "rgba(30, 41, 59, 0.2)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        background: "rgba(30, 41, 59, 0.35)",
                        borderColor: card.color,
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 12px ${card.color}15`,
                      },
                    }}
                  >
                    <CardIcon sx={{ color: card.color, fontSize: 20 }} />
                    <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.68rem", color: "text.primary" }}>
                      {card.label}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Conversation Logs */}
        <Box sx={{ flexGrow: 1, p: 2.5, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2.5 }}>
          {messages.map((msg, index) => {
            const isAi = msg.sender === "ai";
            return (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  alignSelf: isAi ? "flex-start" : "flex-end",
                  maxWidth: "85%",
                  flexDirection: isAi ? "row" : "row-reverse",
                }}
              >
                {isAi && (
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                      fontSize: 14,
                    }}
                  >
                    <SmartToy sx={{ fontSize: 16 }} />
                  </Avatar>
                )}
                <Box>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: isAi ? "0px 16px 16px 16px" : "16px 0px 16px 16px",
                      bgcolor: isAi ? "rgba(255, 255, 255, 0.03)" : "rgba(79, 70, 229, 0.16)",
                      border: isAi ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(79, 70, 229, 0.25)",
                      boxShadow: isAi ? "none" : "0 4px 12px rgba(79, 70, 229, 0.15)",
                    }}
                  >
                    <Typography variant="body2" color="text.primary" sx={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
                      {msg.text}
                    </Typography>
                  </Paper>

                  {/* Resolved Action Feedback Tag */}
                  {isAi && msg.action && msg.action !== "chat" && (
                    <Chip
                      icon={
                        msg.action === "navigate" ? (
                          <Navigation sx={{ fontSize: "11px !important" }} />
                        ) : msg.action === "logout" ? (
                          <Logout sx={{ fontSize: "11px !important" }} />
                        ) : (
                          <Search sx={{ fontSize: "11px !important" }} />
                        )
                      }
                      label={
                        msg.action === "navigate"
                          ? "Executing Route..."
                          : msg.action === "logout"
                          ? "Terminating Session..."
                          : "Executing Repository Search..."
                      }
                      size="small"
                      sx={{
                        mt: 1,
                        height: 20,
                        fontSize: "0.6rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        bgcolor: "rgba(236,72,153,0.12)",
                        color: "#F472B6",
                        border: "1px solid rgba(236,72,153,0.2)",
                      }}
                    />
                  )}
                </Box>
              </Box>
            );
          })}
          {loading && (
            <Box sx={{ alignSelf: "flex-start", ml: 5, display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={14} color="secondary" />
              <Typography variant="caption" color="text.secondary">
                Agent is thinking...
              </Typography>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Suggestion Quick Chips */}
        <Box sx={{ px: 2.5, pb: 2, pt: 1, borderTop: "1px solid rgba(255,255,255,0.03)" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={800}
            sx={{ mb: 1, display: "block", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.6rem" }}
          >
            Quick Suggestions
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ gap: 1 }}>
            <Chip
              label="Search Cycles Under $50"
              size="small"
              onClick={() => handleSend("search cycles under $50")}
              sx={{
                bgcolor: "rgba(255,255,255,0.02)",
                color: "text.secondary",
                fontSize: "0.68rem",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.05)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "#FFFFFF" },
              }}
            />
            <Chip
              label="Show CSE Study Notes"
              size="small"
              onClick={() => handleSend("search cse notes")}
              sx={{
                bgcolor: "rgba(255,255,255,0.02)",
                color: "text.secondary",
                fontSize: "0.68rem",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.05)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "#FFFFFF" },
              }}
            />
            <Chip
              label="Log Out Session"
              size="small"
              onClick={() => handleSend("logout")}
              sx={{
                bgcolor: "rgba(255,255,255,0.02)",
                color: "text.secondary",
                fontSize: "0.68rem",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.05)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "#EF4444" },
              }}
            />
          </Stack>
        </Box>

        {/* Input Footer Panel */}
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          sx={{
            p: 2.5,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            bgcolor: "rgba(15, 23, 42, 0.4)",
          }}
        >
          <Stack direction="row" spacing={1.5}>
            <TextField
              placeholder="Query notes, search items, or request screen..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontSize: "0.8rem",
                  "& fieldset": { border: "none" },
                  "&.Mui-focused": {
                    border: "1px solid rgba(79, 70, 229, 0.3)",
                    boxShadow: "0 0 10px rgba(79, 70, 229, 0.1)",
                  },
                },
              }}
            />
            <IconButton
              type="submit"
              disabled={loading || !query.trim()}
              sx={{
                bgcolor: "primary.main",
                color: "#FFFFFF",
                borderRadius: "12px",
                height: 38,
                width: 38,
                boxShadow: "0 2px 8px rgba(79, 70, 229, 0.2)",
                transition: "all 0.2s",
                "&:hover": { bgcolor: "primary.dark", transform: "scale(1.04)" },
                "&.Mui-disabled": {
                  bgcolor: "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.1)",
                  boxShadow: "none",
                },
              }}
            >
              <Send sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
}
