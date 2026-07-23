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
} from "@mui/material";
import { Check, Close, Group } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

export default function NotificationsPage() {
  const { user, setFriends } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

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

        setFriends((prev) => [...prev, notification.from._id]);
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
      }
    } catch (err) {
      console.error("Failed to update notification", err);
      alert(err.response?.data?.message || "Action failed");
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
      <Paper
        elevation={1}
        sx={{
          p: 3,
          mb: 4,
          border: "1px solid rgba(226, 232, 240, 0.8)",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Typography variant="h5" fontWeight="800" color="primary.main">
          Friend Requests
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage incoming requests and expand your campus network
        </Typography>
      </Paper>

      {notifications.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            py: 8,
            textAlign: "center",
            borderColor: "rgba(226, 232, 240, 0.8)",
            borderRadius: "20px",
          }}
        >
          <Group sx={{ fontSize: 60, color: "text.secondary", mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" color="text.secondary" fontWeight="600">
            No notifications at the moment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When peers send you requests, they will show up here.
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
                elevation={1}
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
                    ? "rgba(16, 185, 129, 0.15)" 
                    : isRejected 
                    ? "rgba(239, 68, 68, 0.15)" 
                    : "rgba(226, 232, 240, 0.8)",
                  bgcolor: isAccepted 
                    ? "rgba(16, 185, 129, 0.02)" 
                    : isRejected 
                    ? "rgba(239, 68, 68, 0.02)" 
                    : "#fff",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": { 
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.03)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Stack direction="row" spacing={2.5} alignItems="center" flex={1}>
                  <Avatar
                    src={notif.from.photo ? `${apiBase}/uploads/${notif.from.photo}` : undefined}
                    alt={notif.from.firstName}
                    sx={{ width: 56, height: 56, bgcolor: "primary.light" }}
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

                <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center">
                  {isPending ? (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        size="medium"
                        startIcon={<Check />}
                        onClick={() => handleAction(notif, "accepted")}
                        sx={{ borderRadius: "10px", py: 1 }}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="medium"
                        startIcon={<Close />}
                        onClick={() => handleAction(notif, "rejected")}
                        sx={{ borderRadius: "10px", py: 1 }}
                      >
                        Reject
                      </Button>
                    </>
                  ) : (
                    <Chip
                      icon={isAccepted ? <Check /> : <Close />}
                      label={isAccepted ? "Accepted" : "Rejected"}
                      color={isAccepted ? "success" : "error"}
                      variant="outlined"
                      sx={{ fontWeight: "bold", px: 1 }}
                    />
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
