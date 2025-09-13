import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Avatar,
  Stack,
  CircularProgress,
  IconButton,
  Badge,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";

export default function MySidebar() {
  const { user, notifications } = useAuth();
  const navigate = useNavigate();

  const [collegeDetails, setCollegeDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch college details
  useEffect(() => {
    if (!user?.college) return;

    const fetchCollege = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/colleges/${user.college}`);
        setCollegeDetails(data);
      } catch (err) {
        console.error("Failed to fetch college details", err);
        setError("Could not fetch college details");
      } finally {
        setLoading(false);
      }
    };
    fetchCollege();
  }, [user?.college]);

  return (
    <Box>
      {/* User Profile */}
      <Box
        sx={{
          textAlign: "center",
          mb: 4,
          p: 2,
          bgcolor: "background.default",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Avatar
          src={user?.photo || undefined}
          sx={{ width: 80, height: 80, mx: "auto", mb: 1 }}
        >
          {user?.firstName?.[0]}
        </Avatar>

        <Typography variant="h6" fontWeight="bold">
          {user?.firstName} {user?.lastName}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {user?.email}
        </Typography>

        <Divider sx={{ mx: "auto", mb: 2, mt: 1, width: "60%" }} />

        {loading ? (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography color="error" textAlign="center">
            {error}
          </Typography>
        ) : (
          <Stack spacing={1} sx={{ textAlign: "left", maxWidth: 220, mx: "auto" }}>
            <Box>
              <Typography variant="body2" fontWeight="600">
                Course / Branch:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.course ? `${user.course} / ${user.branch || "N/A"}` : "N/A"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" fontWeight="600">
                College Name:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {collegeDetails?.collegeName || "N/A"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" fontWeight="600">
                College Location:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {collegeDetails
                  ? `${collegeDetails.city || "—"}, ${collegeDetails.state || "—"}`
                  : "N/A"}
              </Typography>
            </Box>
          </Stack>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Notifications */}
      <Stack spacing={3}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            color="primary"
            onClick={() => navigate("/notifications")}
          >
            <Badge
              badgeContent={notifications.filter(n => n.status === "pending").length || null}
              color="error"
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
        </Box>

        <Box>
          <Typography variant="subtitle1" fontWeight="bold" mb={1}>
            Upcoming Events
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No upcoming events.
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
