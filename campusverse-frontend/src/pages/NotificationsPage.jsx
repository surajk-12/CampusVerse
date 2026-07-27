import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  CircularProgress,
  Divider,
  Avatar,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import { Check, Close, Group, Forum } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function NotificationsPage() {
  const { user, setFriends, markNotificationsAsSeen, refreshFriends } = useAuth();
  const nav = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

  // Mark notifications as seen immediately on page mount — clears sidebar badge
  useEffect(() => {
    markNotificationsAsSeen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!user?._id) return;

    const fetchNotifications = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/notifications/${user._id}`);
        setNotifications(data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user?._id]);

  // Handle accept/reject
  const handleAction = async (notification, action) => {
    try {
      if (action === "accepted") {
        await api.post("/notifications/accept", {
          from: notification.from._id,
          to: user._id,
        });

        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, status: "accepted" } : n
          )
        );

        setFriends((prev) => [...prev, notification.from]);

        // Sync friends count in sidebar immediately
        if (refreshFriends) refreshFriends(user._id);

        // Show success snackbar then redirect to chat
        setSnackbar({
          open: true,
          message: `🎉 You are now connected with ${notification.from.firstName}! Redirecting to chat...`,
          severity: "success",
        });

        // Redirect to chat with this friend pre-selected after 2 seconds
        setTimeout(() => {
          nav("/chat", { state: { friend: notification.from } });
        }, 2000);

      } else if (action === "rejected") {
        await api.post("/notifications/reject", {
          from: notification.from._id,
          to: user._id,
        });

        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, status: "rejected" } : n
          )
        );

        setSnackbar({
          open: true,
          message: "Request declined.",
          severity: "info",
        });
      }
    } catch (err) {
      console.error("Failed to update notification", err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Action failed. Please try again.",
        severity: "error",
      });
    }
  };

  if (loading || !user)
    return (
      <Box sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress size={50} />
      </Box>
    );

  if (error)
    return (
      <Typography color="error" textAlign="center" mt={5}>
        {error}
      </Typography>
    );

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={900}
          sx={{
            background: "linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.7) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Friend Requests
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage incoming requests and expand your campus network
        </Typography>
      </Box>

      {notifications.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 10,
            textAlign: "center",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "24px",
            bgcolor: "rgba(255, 255, 255, 0.01)",
          }}
        >
          <Group sx={{ fontSize: 60, color: "text.secondary", mb: 2, opacity: 0.2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight="600">
            No notifications at the moment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When peers send you friend requests, they will show up here.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          {notifications.map((notif) => {
            const isAccepted = notif.status === "accepted";
            const isRejected = notif.status === "rejected";
            const isPending = notif.status === "pending";

            return (
              <Paper
                key={notif._id}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "20px",
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: "space-between",
                  gap: 2,
                  border: "1px solid",
                  borderColor: isAccepted
                    ? "rgba(16, 185, 129, 0.2)"
                    : isRejected
                    ? "rgba(239, 68, 68, 0.15)"
                    : "rgba(255, 255, 255, 0.08)",
                  bgcolor: isAccepted
                    ? "rgba(16, 185, 129, 0.04)"
                    : isRejected
                    ? "rgba(239, 68, 68, 0.03)"
                    : "rgba(255, 255, 255, 0.015)",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
                  },
                }}
              >
                {/* Left: Sender Info */}
                <Stack direction="row" spacing={2.5} alignItems="center" flex={1}>
                  <Avatar
                    src={notif.from.photo ? `${apiBase}/uploads/${notif.from.photo}` : undefined}
                    alt={notif.from.firstName}
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: "primary.light",
                      boxShadow: isAccepted
                        ? "0 0 12px rgba(16, 185, 129, 0.3)"
                        : "0 0 12px rgba(99, 102, 241, 0.2)",
                    }}
                  >
                    {notif.from.firstName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="700" color="text.primary">
                      {notif.from.firstName} {notif.from.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {notif.from.course} / {notif.from.branch}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      Sent you a friend request
                    </Typography>
                  </Box>
                </Stack>

                {/* Right: Actions or Status */}
                <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center">
                  {isPending ? (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        size="medium"
                        startIcon={<Check />}
                        onClick={() => handleAction(notif, "accepted")}
                        sx={{
                          borderRadius: "12px",
                          py: 1,
                          fontWeight: 700,
                          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="medium"
                        startIcon={<Close />}
                        onClick={() => handleAction(notif, "rejected")}
                        sx={{
                          borderRadius: "12px",
                          py: 1,
                          fontWeight: 700,
                          borderColor: "rgba(239, 68, 68, 0.4)",
                          "&:hover": { borderColor: "error.main", bgcolor: "rgba(239,68,68,0.04)" },
                        }}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip
                        icon={isAccepted ? <Check /> : <Close />}
                        label={isAccepted ? "Connected" : "Rejected"}
                        color={isAccepted ? "success" : "error"}
                        variant="outlined"
                        sx={{ fontWeight: 700, px: 1 }}
                      />
                      {isAccepted && (
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<Forum sx={{ fontSize: 16 }} />}
                          onClick={() => nav("/chat", { state: { friend: notif.from } })}
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            color: "primary.main",
                            "&:hover": { bgcolor: "rgba(79, 70, 229, 0.08)" },
                          }}
                        >
                          Open Chat
                        </Button>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Success / Info / Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: "12px", fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
