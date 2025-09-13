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
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

export default function NotificationsPage({ setFriends }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

        if (setFriends) setFriends((prev) => [...prev, notification.from._id]);
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

  if (loading)
    return (
      <Box sx={{ mt: 5, textAlign: "center" }}>
        <CircularProgress size={50} />
      </Box>
    );

  if (error)
    return (
      <Typography color="error" textAlign="center" mt={5}>
        {error}
      </Typography>
    );

  if (notifications.length === 0)
    return (
      <Typography textAlign="center" mt={5} fontSize={18}>
        No notifications at the moment
      </Typography>
    );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" mb={3} color="primary.main">
        Notifications
      </Typography>

      <Stack spacing={2}>
        {notifications.map((notif) => (
          <Paper
            key={notif._id}
            elevation={3}
            sx={{
              p: 2,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: notif.status === "accepted" ? "success.light" : notif.status === "rejected" ? "error.light" : "#fff",
              transition: "all 0.3s",
              "&:hover": { boxShadow: 6 },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" flex={1}>
              <Avatar
                src={notif.from.photo || ""}
                alt={notif.from.firstName}
                sx={{ width: 50, height: 50 }}
              />
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {notif.from.firstName} {notif.from.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {notif.message || "Sent you a friend request"}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1}>
              {notif.status === "pending" ? (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => handleAction(notif, "accepted")}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleAction(notif, "rejected")}
                  >
                    Reject
                  </Button>
                </>
              ) : (
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color={notif.status === "accepted" ? "success.main" : "error.main"}
                >
                  {notif.status === "accepted" ? "Accepted" : "Rejected"}
                </Typography>
              )}
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
