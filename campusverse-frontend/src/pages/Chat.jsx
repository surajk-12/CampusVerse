import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  IconButton,
  Modal,
  Grid,
} from "@mui/material";
import {
  Send,
  Forum,
  School,
  AccountCircle,
  AttachFile,
  Close,
  Call,
  Videocam,
  Mic,
  MicOff,
  VideocamOff,
  CallEnd,
  VolumeUp,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useLocation } from "react-router-dom";
import api from "../api/axios.js";
import { io } from "socket.io-client";

export default function Chat() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");
  const location = useLocation();
  const preSelectedFriend = location.state?.friend;

  const [friendsList, setFriendsList] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(preSelectedFriend || null);

  // Sync selected friend from navigation state (if redirected from dashboard/other pages)
  useEffect(() => {
    if (location.state?.friend) {
      setSelectedFriend(location.state.friend);
    }
  }, [location.state]);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sending, setSending] = useState(false);

  // Typing indicator state
  const [partnerTyping, setPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Attachment state variables
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const fileInputRef = useRef(null);

  // Socket.io ref — persists across renders without causing re-renders
  const socketRef = useRef(null);

  // Call state variables
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState(""); // "voice" or "video"
  const [callStatus, setCallStatus] = useState("ringing"); // "ringing", "connected", "ended"
  const [callDuration, setCallDuration] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);

  // Fetch populated friends list from user details
  useEffect(() => {
    if (!user?._id) return;
    const fetchFriends = async () => {
      setLoadingFriends(true);
      try {
        const { data } = await api.get(`/users/${user._id}`);
        setFriendsList(data.friends || []);
      } catch (err) {
        console.error("Failed to fetch friends list", err);
      } finally {
        setLoadingFriends(false);
      }
    };
    fetchFriends();
  }, [user?._id]);

  // ─── Socket.io Lifecycle ───────────────────────────────────────────────────
  // Connect socket once when user is available, disconnect on unmount.
  useEffect(() => {
    if (!user?._id) return;

    const token = localStorage.getItem("cv_token");
    if (!token) return;

    const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

    const socket = io(SOCKET_URL, {
      auth: { token }, // JWT sent in handshake — validated by server middleware
      transports: ["websocket"],
    });

    socketRef.current = socket;

    // Listen for incoming real-time messages
    socket.on("receive-message", (msg) => {
      setMessages((prev) => {
        // Prevent duplicates (in case REST call already added the message)
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    // Typing indicator events
    socket.on("user-typing", () => setPartnerTyping(true));
    socket.on("user-stop-typing", () => setPartnerTyping(false));

    socket.on("error", (err) => console.error("Socket error:", err.message));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id]);

  // ─── Load Chat History + Join Room ──────────────────────────────────────────
  // Whenever the selected friend changes, load history from REST + join the socket room.
  useEffect(() => {
    if (!selectedFriend?._id) return;
    setPartnerTyping(false);

    const fetchHistory = async () => {
      try {
        const { data } = await api.get(`/chat/history/${selectedFriend._id}`);
        setMessages(data || []);
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };

    fetchHistory();

    // Tell the server to join our private room
    if (socketRef.current) {
      socketRef.current.emit("join-room", { partnerId: selectedFriend._id });
    }
  }, [selectedFriend]);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Call Timer Hook
  useEffect(() => {
    if (callStatus === "connected") {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [callStatus]);

  // Format Duration
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Handle files selected for attachments
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Check count limit
    if (selectedFiles.length + files.length > 10) {
      showToast("You can upload a maximum of 10 attachments per message.", "warning");
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);

    // Create file previews
    const newPreviews = files.map((file) => {
      let type = "image";
      if (file.type.startsWith("video/")) type = "video";
      else if (file.type.startsWith("audio/")) type = "audio";

      return {
        name: file.name,
        type,
        url: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      };
    });

    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  // Remove a selected attachment
  const removeAttachment = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => {
      const target = prev[index];
      if (target.type === "image" && target.url) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Handle input change — emit typing events
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (socketRef.current && selectedFriend?._id) {
      socketRef.current.emit("typing", { recipientId: selectedFriend._id });

      // Debounce: stop typing after 1.5s of inactivity
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("stop-typing", { recipientId: selectedFriend._id });
      }, 1500);
    }
  };

  // Handle message send
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && selectedFiles.length === 0) return;
    if (!selectedFriend?._id || sending) return;

    // Stop typing indicator
    if (socketRef.current) {
      socketRef.current.emit("stop-typing", { recipientId: selectedFriend._id });
    }
    clearTimeout(typingTimeoutRef.current);

    const hasFiles = selectedFiles.length > 0;
    const text = inputMessage.trim();

    // Clear inputs immediately for responsive feedback
    setInputMessage("");
    setSelectedFiles([]);
    setFilePreviews([]);
    setSending(true);

    try {
      if (hasFiles) {
        // Files: must go through REST API (multipart upload)
        const formData = new FormData();
        formData.append("recipientId", selectedFriend._id);
        formData.append("content", text);
        selectedFiles.forEach((file) => formData.append("files", file));

        const { data } = await api.post("/chat/send", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        // REST response has the saved message with attachments;
        // broadcast it via socket so recipient gets it in real-time too
        if (socketRef.current) {
          socketRef.current.emit("broadcast-message", { message: data, recipientId: selectedFriend._id });
        }
        setMessages((prev) => [...prev, data]);
      } else {
        // Text-only: send via socket (server saves + broadcasts to room)
        if (socketRef.current) {
          socketRef.current.emit("send-message", {
            recipientId: selectedFriend._id,
            content: text,
          });
          // Message will arrive back via "receive-message" event for both sender and recipient
        }
      }
    } catch (err) {
      console.error("Failed to send message", err);
      showToast(err.response?.data?.message || "Failed to send message", "error");
      // Restore on error
      setInputMessage(text);
    } finally {
      setSending(false);
    }
  };

  // Initialize camera and voice stream for calls
  const startCall = async (type) => {
    setCallType(type);
    setCallActive(true);
    setCallStatus("ringing");
    setMicEnabled(true);
    setVideoEnabled(true);

    try {
      const constraints = {
        audio: true,
        video: type === "video",
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      // Bind stream to video element
      if (type === "video" && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Could not capture webcam/mic stream directly:", err.message);
      // Fail silently and use mock avatar overlays
    }

    // Simulate connection after 3 seconds
    setTimeout(() => {
      setCallStatus("connected");
    }, 3000);
  };

  // End voice/video call
  const endCall = () => {
    setCallStatus("ended");
    setTimeout(() => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      localStreamRef.current = null;
      setCallActive(false);
    }, 1000);
  };

  // Toggle Mic Track
  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !micEnabled;
      });
    }
    setMicEnabled(!micEnabled);
  };

  // Toggle Video Track
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
    }
    setVideoEnabled(!videoEnabled);
  };

  if (!user) {
    return (
      <Box sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        height: "80vh",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "24px",
        overflow: "hidden",
        bgcolor: "rgba(30, 41, 59, 0.25)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35)",
      }}
    >
      {/* Left Pane: Friends List */}
      <Box
        sx={{
          width: { xs: 80, sm: 280 },
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          bgcolor: "rgba(15, 23, 42, 0.35)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: 2.5, display: { xs: "none", sm: "block" } }}>
          <Typography variant="subtitle1" fontWeight="800" color="text.primary">
            Conversations
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Chat with your verified classmates
          </Typography>
        </Box>
        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />

        <Box sx={{ flex: 1, overflowY: "auto", py: 1 }}>
          {loadingFriends ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : friendsList.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4, px: 2, display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" color="text.secondary" fontWeight="500">
                No active friends yet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Add classmates from your college directory to start chatting.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={0.5}>
              {friendsList.map((friend) => {
                const isSelected = selectedFriend?._id === friend._id;
                return (
                  <Box
                    key={friend._id}
                    onClick={() => {
                      setSelectedFriend(friend);
                      setMessages([]);
                      setSelectedFiles([]);
                      setFilePreviews([]);
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.8,
                      mx: 1,
                      borderRadius: "14px",
                      cursor: "pointer",
                      bgcolor: isSelected ? "rgba(79, 70, 229, 0.15)" : "transparent",
                      border: isSelected ? "1px solid rgba(79, 70, 229, 0.25)" : "1px solid transparent",
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: isSelected ? "rgba(79, 70, 229, 0.15)" : "rgba(255, 255, 255, 0.03)",
                        borderColor: isSelected ? "rgba(79, 70, 229, 0.25)" : "rgba(255, 255, 255, 0.06)",
                      },
                      justifyContent: { xs: "center", sm: "flex-start" },
                    }}
                  >
                    <Avatar
                      src={friend.photo ? `${apiBase}/uploads/${friend.photo}` : undefined}
                      sx={{ width: 44, height: 44, bgcolor: "primary.light" }}
                    >
                      {friend.firstName?.[0]}
                    </Avatar>
                    <Box sx={{ display: { xs: "none", sm: "block" }, overflow: "hidden" }}>
                      <Typography variant="body2" fontWeight="700" color={isSelected ? "primary.main" : "text.primary"} noWrap>
                        {friend.firstName} {friend.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        {friend.course} / {friend.branch}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>

      {/* Right Pane: Active Chat Conversation */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", bgcolor: "rgba(15, 23, 42, 0.1)" }}>
        {selectedFriend ? (
          <>
            {/* Chat header */}
            <Box
              sx={{
                p: 2,
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "rgba(30, 41, 59, 0.4)",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  src={selectedFriend.photo ? `${apiBase}/uploads/${selectedFriend.photo}` : undefined}
                  sx={{ width: 44, height: 44, bgcolor: "primary.light" }}
                />
                <Box>
                  <Typography variant="subtitle2" fontWeight="700">
                    {selectedFriend.firstName} {selectedFriend.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedFriend.course} | {selectedFriend.branch} | Class of {selectedFriend.passingYear}
                  </Typography>
                </Box>
              </Stack>
              
              {/* Voice and Video Call Shortcuts */}
              <Stack direction="row" spacing={1}>
                <IconButton color="primary" onClick={() => startCall("voice")} sx={{ bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", "&:hover": { bgcolor: "rgba(255,255,255,0.07)" } }}>
                  <Call />
                </IconButton>
                <IconButton color="primary" onClick={() => startCall("video")} sx={{ bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", "&:hover": { bgcolor: "rgba(255,255,255,0.07)" } }}>
                  <Videocam />
                </IconButton>
              </Stack>
            </Box>

            {/* Chat message bubbles */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 3, bgcolor: "rgba(15, 23, 42, 0.15)" }}>
              {messages.length === 0 ? (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                  }}
                >
                  <Forum sx={{ fontSize: 44, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body2" fontWeight="500">No messages yet</Typography>
                  <Typography variant="caption">Start the conversation by typing below.</Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {messages.map((msg) => {
                    const isMe = msg.sender === user._id;
                    return (
                      <Box
                        key={msg._id}
                        sx={{
                          display: "flex",
                          justifyContent: isMe ? "flex-end" : "flex-start",
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: "70%",
                            p: 1.8,
                            borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                            bgcolor: isMe ? "primary.main" : "rgba(255, 255, 255, 0.03)",
                            color: isMe ? "#ffffff" : "#F1F5F9",
                            boxShadow: isMe 
                              ? "0 4px 15px rgba(79, 70, 229, 0.25)" 
                              : "none",
                            border: isMe ? "none" : "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                        >
                          {/* Text Message Content */}
                          {msg.content && (
                            <Typography variant="body2" sx={{ lineHeight: 1.5, wordBreak: "break-word" }}>
                              {msg.content}
                            </Typography>
                          )}

                          {/* Message Attachments Grid */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <Stack spacing={1.5} sx={{ mt: msg.content ? 1.5 : 0 }}>
                              {/* Group Images together */}
                              {msg.attachments.filter(a => a.fileType === "image").length > 0 && (
                                <Grid container spacing={1}>
                                  {msg.attachments
                                    .filter(a => a.fileType === "image")
                                    .map((att, idx) => (
                                      <Grid item xs={msg.attachments.length > 1 ? 6 : 12} key={idx}>
                                        <Box
                                          component="img"
                                          src={`${apiBase}/uploads/${att.url}`}
                                          alt="Attachment Image"
                                          sx={{
                                            width: "100%",
                                            maxHeight: 180,
                                            objectFit: "cover",
                                            borderRadius: "12px",
                                            cursor: "pointer",
                                            border: "1px solid rgba(255, 255, 255, 0.08)",
                                            transition: "transform 0.2s",
                                            "&:hover": { transform: "scale(1.02)" },
                                          }}
                                          onClick={() => window.open(`${apiBase}/uploads/${att.url}`, "_blank")}
                                        />
                                      </Grid>
                                    ))}
                                </Grid>
                              )}

                              {/* Render Videos */}
                              {msg.attachments
                                .filter(a => a.fileType === "video")
                                .map((att, idx) => (
                                  <Box key={idx} sx={{ width: "100%", maxWidth: 300, mt: 1 }}>
                                    <video
                                      controls
                                      src={`${apiBase}/uploads/${att.url}`}
                                      style={{
                                        width: "100%",
                                        borderRadius: "12px",
                                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                                      }}
                                    />
                                  </Box>
                                ))}

                              {/* Render Audio */}
                              {msg.attachments
                                .filter(a => a.fileType === "audio")
                                .map((att, idx) => (
                                  <Box key={idx} sx={{ mt: 1, width: "100%", minWidth: 220 }}>
                                    <audio
                                      controls
                                      src={`${apiBase}/uploads/${att.url}`}
                                      style={{ width: "100%" }}
                                    />
                                  </Box>
                                ))}
                            </Stack>
                          )}

                          <Typography
                            variant="caption"
                            display="block"
                            textAlign="right"
                            sx={{
                              mt: 0.8,
                              fontSize: "0.65rem",
                              color: isMe ? "rgba(255, 255, 255, 0.7)" : "text.secondary",
                              fontWeight: 500,
                            }}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                  {/* Typing indicator bubble */}
                  {partnerTyping && (
                    <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: "20px 20px 20px 4px",
                          bgcolor: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        {[0, 1, 2].map((i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              bgcolor: "text.secondary",
                              animation: "bounce 1.2s infinite",
                              animationDelay: `${i * 0.2}s`,
                              "@keyframes bounce": {
                                "0%, 80%, 100%": { transform: "scale(0.6)", opacity: 0.5 },
                                "40%": { transform: "scale(1)", opacity: 1 },
                              },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </Stack>
              )}
            </Box>

            {/* Selected Attachment previews banner */}
            {filePreviews.length > 0 && (
              <Box
                sx={{
                  p: 2,
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  bgcolor: "rgba(15, 23, 42, 0.4)",
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
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      bgcolor: "rgba(255,255,255,0.02)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {preview.type === "image" ? (
                      <Box
                        component="img"
                        src={preview.url}
                        sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }}
                      />
                    ) : (
                      <Stack spacing={0.5} alignItems="center" sx={{ px: 1, textAlign: "center" }}>
                        <AttachFile sx={{ color: "primary.main", fontSize: 20 }} />
                        <Typography variant="caption" sx={{ fontSize: "0.6rem" }} noWrap width={68}>
                          {preview.name}
                        </Typography>
                      </Stack>
                    )}
                    
                    <IconButton
                      size="small"
                      onClick={() => removeAttachment(index)}
                      sx={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        bgcolor: "grey.900",
                        color: "#ffffff",
                        p: 0.3,
                        "&:hover": { bgcolor: "grey.700" },
                      }}
                    >
                      <Close sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            {/* Input Message Area */}
            <Box
              component="form"
              onSubmit={handleSend}
              sx={{
                p: 2,
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                gap: 1.5,
                alignItems: "center",
                bgcolor: "rgba(30, 41, 59, 0.4)",
              }}
            >
              {/* Paperclip Attach Button */}
              <input
                type="file"
                multiple
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
                accept="image/*,video/*,audio/*"
              />
              <IconButton
                color="primary"
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  p: 1.8,
                  bgcolor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.07)" },
                }}
              >
                <AttachFile sx={{ transform: "rotate(45deg)" }} />
              </IconButton>

              <TextField
                placeholder="Type your message..."
                variant="outlined"
                size="medium"
                fullWidth
                value={inputMessage}
                onChange={handleInputChange}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                    bgcolor: "rgba(255,255,255,0.01)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    "& fieldset": { border: "none" }
                  }
                }}
              />
              
              <IconButton
                type="submit"
                color="primary"
                disabled={(!inputMessage.trim() && selectedFiles.length === 0) || sending}
                sx={{
                  p: 1.8,
                  bgcolor: "primary.main",
                  color: "#ffffff",
                  borderRadius: "14px",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                  "&.Mui-disabled": {
                    bgcolor: "rgba(255,255,255,0.02)",
                    color: "rgba(255,255,255,0.2)",
                  }
                }}
              >
                <Send sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
              p: 4,
              textAlign: "center",
            }}
          >
            <Box sx={{ p: 2.5, borderRadius: "50%", bgcolor: "rgba(79, 70, 229, 0.08)", color: "primary.main", mb: 2 }}>
              <Forum sx={{ fontSize: 48 }} />
            </Box>
            <Typography variant="h6" fontWeight="800" color="text.primary">
              Your Campus Chats
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mt: 0.5, lineHeight: 1.5 }}>
              Select a verified friend from the left sidebar to start messaging. Share study resources, arrange group study, or chat.
            </Typography>
          </Box>
        )}
      </Box>

      {/* 4. Fullscreen Video / Voice Calling Overlay Modal */}
      <Modal
        open={callActive}
        onClose={() => {}} // Block clicking backdrop to dismiss
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: "100vw",
            height: "100vh",
            background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            p: { xs: 4, md: 6 },
            color: "#ffffff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Main Ringing / Caller Screen */}
          <Box
            sx={{
              mt: "10vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 1,
            }}
          >
            <Box sx={{ position: "relative", mb: 3 }}>
              {/* Pulsing ring animation in ringing state */}
              {callStatus === "ringing" && (
                <Box
                  sx={{
                    position: "absolute",
                    top: -10,
                    left: -10,
                    right: -10,
                    bottom: -10,
                    borderRadius: "50%",
                    border: "3px solid rgba(79, 70, 229, 0.6)",
                    animation: "pulse 1.8s infinite ease-in-out",
                    "@keyframes pulse": {
                      "0%": { transform: "scale(0.95)", opacity: 0.8 },
                      "50%": { transform: "scale(1.25)", opacity: 0.3 },
                      "100%": { transform: "scale(1.4)", opacity: 0 },
                    },
                  }}
                />
              )}
              <Avatar
                src={selectedFriend?.photo ? `${apiBase}/uploads/${selectedFriend.photo}` : undefined}
                sx={{
                  width: 140,
                  height: 140,
                  border: "4px solid #ffffff",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                }}
              />
            </Box>
            
            <Typography variant="h4" fontWeight="800">
              {selectedFriend?.firstName} {selectedFriend?.lastName}
            </Typography>
            
            <Typography variant="subtitle1" color="grey.400" sx={{ mt: 1, fontWeight: 500 }}>
              {callStatus === "ringing" ? `Ringing (${callType} call)...` : formatTime(callDuration)}
            </Typography>
          </Box>

          {/* Video Stream Rendering container (for video call type only) */}
          {callType === "video" && callStatus === "connected" && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                bgcolor: "#0F172A",
              }}
            >
              {/* Simulated camera feed representation of friend */}
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "grey.900",
                }}
              >
                <Avatar
                  src={selectedFriend?.photo ? `${apiBase}/uploads/${selectedFriend.photo}` : undefined}
                  sx={{ width: 180, height: 180, border: "3px solid grey" }}
                />
              </Box>

              {/* Floating Local Camera preview window */}
              <Card
                sx={{
                  position: "absolute",
                  bottom: "16vh",
                  right: 24,
                  width: { xs: 120, sm: 180 },
                  height: { xs: 160, sm: 240 },
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
                  border: "2px solid #ffffff",
                  bgcolor: "grey.800",
                }}
              >
                {videoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "grey.400" }}>
                    <VideocamOff sx={{ fontSize: 32 }} />
                  </Box>
                )}
              </Card>
            </Box>
          )}

          {/* Voice Waveform visualizer representation (for voice call type only) */}
          {callType === "voice" && callStatus === "connected" && (
            <Stack direction="row" spacing={1} sx={{ position: "absolute", top: "50%", zIndex: 0, transform: "translateY(-50%)" }}>
              {[...Array(6)].map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 6,
                    height: 40 + Math.random() * 60,
                    bgcolor: "primary.main",
                    borderRadius: "3px",
                    animation: `bounce 1s infinite alternate ease-in-out`,
                    animationDelay: `${i * 0.15}s`,
                    "@keyframes bounce": {
                      "0%": { transform: "scaleY(0.4)" },
                      "100%": { transform: "scaleY(1.2)" },
                    },
                  }}
                />
              ))}
            </Stack>
          )}

          {/* Calling Controls Actions panel */}
          <Stack
            direction="row"
            spacing={3}
            alignItems="center"
            sx={{
              mb: "6vh",
              zIndex: 1,
              bgcolor: "rgba(255, 255, 255, 0.08)",
              px: 4,
              py: 2.5,
              borderRadius: "28px",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Mic Toggle */}
            <IconButton
              onClick={toggleMic}
              sx={{
                bgcolor: micEnabled ? "rgba(255, 255, 255, 0.15)" : "#EF4444",
                color: "#ffffff",
                p: 2,
                "&:hover": {
                  bgcolor: micEnabled ? "rgba(255, 255, 255, 0.25)" : "#DC2626",
                },
              }}
            >
              {micEnabled ? <Mic /> : <MicOff />}
            </IconButton>

            {/* Video Camera Toggle (Video call only) */}
            {callType === "video" && (
              <IconButton
                onClick={toggleVideo}
                sx={{
                  bgcolor: videoEnabled ? "rgba(255, 255, 255, 0.15)" : "#EF4444",
                  color: "#ffffff",
                  p: 2,
                  "&:hover": {
                    bgcolor: videoEnabled ? "rgba(255, 255, 255, 0.25)" : "#DC2626",
                  },
                }}
              >
                {videoEnabled ? <Videocam /> : <VideocamOff />}
              </IconButton>
            )}

            {/* End Call Hangup */}
            <IconButton
              onClick={endCall}
              sx={{
                bgcolor: "#EF4444",
                color: "#ffffff",
                p: 2,
                transform: "rotate(135deg)",
                "&:hover": {
                  bgcolor: "#DC2626",
                },
              }}
            >
              <CallEnd />
            </IconButton>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}
