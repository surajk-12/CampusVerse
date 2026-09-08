import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  IconButton,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Avatar,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Divider,
} from "@mui/material";
import {
  SmartToy as RobotIcon,
  Close as CloseIcon,
  Send as SendIcon,
  CompassCalibration as CompassIcon,
  ChatBubbleOutline as ChatIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";

export default function AIAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("chat"); // "chat" | "nav"
  const [chatInput, setChatInput] = useState("");
  const [navInput, setNavInput] = useState("");
  const [chatLog, setChatLog] = useState([
    { sender: "ai", text: "Hey! I am your CampusVerse AI Assistant. How can I help you today?" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const [navFeedback, setNavFeedback] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, chatLoading]);

  // Handle chat submission
  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userText = chatInput.trim();
    setChatLog(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const { data } = await api.post("/ai/chat", { 
        message: userText,
        currentPath: location.pathname
      });
      setChatLog(prev => [...prev, { sender: "ai", text: data.reply }]);

      // Check if AI instructed a page search filter
      if (data.filter) {
        const filterEvent = new CustomEvent("ai-filter", { detail: { searchString: data.filter } });
        window.dispatchEvent(filterEvent);
      }

      // Check if AI instructed a navigation redirect
      if (data.route) {
        setTimeout(() => {
          navigate(data.route);
        }, 1000);
      }
    } catch (error) {
      setChatLog(prev => [...prev, { sender: "ai", text: "Sorry, I had trouble connecting. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle smart navigation action
  const handleNavigate = async () => {
    if (!navInput.trim() || navLoading) return;
    const commandText = navInput.trim();
    setNavLoading(true);
    setNavFeedback("Interpreting navigation command...");

    try {
      const { data } = await api.post("/ai/navigate", { command: commandText });
      if (data.route) {
        setNavFeedback(`Redirecting you to ${data.route}... (${data.explanation})`);
        setTimeout(() => {
          navigate(data.route);
          setOpen(false);
          setNavInput("");
          setNavFeedback("");
        }, 1500);
      } else {
        setNavFeedback("Sorry, I could not map that request to any platform routes.");
      }
    } catch (error) {
      setNavFeedback("Error mapping route. Please try a simpler navigation command.");
    } finally {
      setNavLoading(false);
    }
  };

  return (
    <Box sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 1300 }}>
      {/* ── Chat Widget Panel ── */}
      {open && (
        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            bottom: 64,
            right: 0,
            width: { xs: 320, sm: 360 },
            height: 480,
            borderRadius: "20px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeInUp 0.25s ease-out",
          }}
        >
          {/* Header Panel */}
          <Box sx={{ p: 2, bgcolor: "background.paper", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <RobotIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="text.primary">Sub-Verse AI</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.65rem" }}>Powered by OpenRouter</Typography>
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "text.secondary" }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Mode Switch Tabs */}
          <Stack direction="row" sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
            <Button
              fullWidth
              startIcon={<ChatIcon sx={{ fontSize: 15 }} />}
              onClick={() => setMode("chat")}
              sx={{
                textTransform: "none",
                fontSize: "0.78rem",
                fontWeight: mode === "chat" ? 800 : 500,
                color: mode === "chat" ? "primary.main" : "text.secondary",
                borderBottom: mode === "chat" ? "2px solid" : "none",
                borderColor: "primary.main",
                py: 1,
                borderRadius: 0,
              }}
            >
              Ask AI Helper
            </Button>
            <Button
              fullWidth
              startIcon={<CompassIcon sx={{ fontSize: 15 }} />}
              onClick={() => setMode("nav")}
              sx={{
                textTransform: "none",
                fontSize: "0.78rem",
                fontWeight: mode === "nav" ? 800 : 500,
                color: mode === "nav" ? "primary.main" : "text.secondary",
                borderBottom: mode === "nav" ? "2px solid" : "none",
                borderColor: "primary.main",
                py: 1,
                borderRadius: 0,
              }}
            >
              Smart Navigate
            </Button>
          </Stack>

          {/* Body Section */}
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column" }}>
            {mode === "chat" ? (
              // Chat Log List
              <Stack spacing={1.5}>
                {chatLog.map((msg, idx) => (
                  <Box key={idx} sx={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: msg.sender === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                        background: msg.sender === "user" ? "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" : "action.hover",
                        border: msg.sender === "user" ? "none" : "1px solid",
                        borderColor: "divider",
                        color: msg.sender === "user" ? "#fff" : "text.primary",
                      }}
                    >
                      <Typography variant="body2" sx={{ fontSize: "0.82rem", lineHeight: 1.45 }}>{msg.text}</Typography>
                    </Paper>
                  </Box>
                ))}
                {chatLoading && (
                  <Box sx={{ alignSelf: "flex-start", display: "flex", gap: 1, alignItems: "center" }}>
                    <CircularProgress size={14} color="primary" />
                    <Typography variant="caption" color="text.secondary">Thinking...</Typography>
                  </Box>
                )}
                <div ref={chatEndRef} />
              </Stack>
            ) : (
              // AI Smart Navigation Panel
              <Box sx={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 2, px: 1 }}>
                <CompassIcon sx={{ fontSize: 42, color: "primary.main", opacity: 0.8 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="text.primary">Where do you want to go?</Typography>
                  <Typography variant="caption" color="text.secondary">Type in natural language where you want to navigate inside CampusVerse</Typography>
                </Box>

                <TextField
                  fullWidth
                  placeholder="e.g. 'take me to my messages', 'buy textbooks'..."
                  size="small"
                  value={navInput}
                  onChange={e => setNavInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleNavigate()}
                  disabled={navLoading}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={handleNavigate} disabled={navLoading || !navInput.trim()} sx={{ color: "primary.main" }}>
                          <SendIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {navFeedback && (
                  <Typography variant="caption" color="primary.main" sx={{ mt: 1, fontStyle: "italic" }}>
                    {navFeedback}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Footer Input Area for Chat mode */}
          {mode === "chat" && (
            <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask AI anything..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendChat()}
                disabled={chatLoading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "10px",
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()} size="small" sx={{ color: "primary.main" }}>
                        <SendIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
          )}
        </Paper>
      )}

      {/* ── Floating Action Button (FAB) ── */}
      <Tooltip title="Campus AI Assistant" placement="left">
        <IconButton
          onClick={() => setOpen(!open)}
          sx={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
            color: "#fff",
            boxShadow: "0 6px 20px rgba(79, 70, 229, 0.4)",
            "&:hover": {
              background: "linear-gradient(135deg, #4338CA 0%, #D0176D 100%)",
              transform: "scale(1.05)",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          {open ? <CloseIcon /> : <RobotIcon />}
        </IconButton>
      </Tooltip>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
}
