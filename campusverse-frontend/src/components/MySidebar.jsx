import React, { useEffect, useState } from "react";
import { Box, Typography, Divider, Avatar, Stack, CircularProgress, Badge, Paper, Tooltip } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import { useNavigate, useLocation } from "react-router-dom";

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ForumIcon from "@mui/icons-material/Forum";
import SchoolIcon from "@mui/icons-material/School";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import BoltIcon from "@mui/icons-material/Bolt";

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", icon: DashboardIcon, path: "/dashboard", badge: null },
      { label: "Quick Actions", icon: BoltIcon, path: "/quick-actions", badge: null },
    ],
  },
  {
    label: "My Profile",
    items: [
      { label: "Student Profile", icon: AccountCircleIcon, path: "/profile", badge: null },
      { label: "My Connections", icon: PeopleAltIcon, path: "/connections", badgeKey: "friends" },
    ],
  },
  {
    label: "Social",
    items: [
      { label: "Friend Requests", icon: NotificationsIcon, path: "/notifications", badgeKey: "pending" },
      { label: "Campus Messenger", icon: ForumIcon, path: "/chat", badge: null },
    ],
  },
  {
    label: "Campus",
    items: [
      { label: "My College", icon: SchoolIcon, path: "my-college", badge: null },
      { label: "Browse Students", icon: PersonSearchIcon, path: "browse-students", badge: null },
    ],
  },
];

export default function MySidebar() {
  const { user, notifications, friends } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

  const [collegeDetails, setCollegeDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.college) return;
    setLoading(true);
    api.get(`/colleges/${user.college}`)
      .then(({ data }) => setCollegeDetails(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user?.college]);

  const avatarUrl = user?.photo ? `${apiBase}/uploads/${user.photo}` : undefined;
  const pendingCount = notifications.filter((n) => n.status === "pending").length;

  const getBadge = (item) => {
    if (item.badgeKey === "pending") return pendingCount || null;
    if (item.badgeKey === "friends") return friends?.length || null;
    return item.badge;
  };

  const handleNav = (path) => {
    if (path === "my-college") {
      navigate(`/colleges/${user.college}/students`, { state: { collegeId: user.college, collegeName: collegeDetails?.collegeName } });
    } else if (path === "browse-students") {
      navigate("/dashboard");
    } else {
      navigate(path);
    }
  };

  return (
    <Box>
      {/* User Profile Card */}
      <Paper elevation={0} sx={{ textAlign: "center", mb: 3, p: 2.5, bgcolor: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "20px" }}>
        <Avatar src={avatarUrl} sx={{ width: 72, height: 72, mx: "auto", mb: 1.5, boxShadow: "0 4px 10px rgba(0,0,0,0.3)", border: "2px solid rgba(255,255,255,0.08)" }}>
          {user?.firstName?.[0]}
        </Avatar>
        <Typography variant="subtitle2" fontWeight={800} color="text.primary">{user?.firstName} {user?.lastName}</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>{user?.email}</Typography>
        <Divider sx={{ mx: "auto", mb: 1.5, width: "60%", borderColor: "rgba(255,255,255,0.08)" }} />
        {loading ? (
          <CircularProgress size={18} />
        ) : (
          <Stack spacing={0.8} sx={{ textAlign: "left" }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", fontSize: "0.6rem" }}>Course / Branch</Typography>
              <Typography variant="caption" color="text.primary" fontWeight={700} display="block">{user?.course || "—"} / {user?.branch || "—"}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", fontSize: "0.6rem" }}>College</Typography>
              <Typography variant="caption" color="text.primary" fontWeight={700} display="block" sx={{ lineHeight: 1.3 }}>{collegeDetails?.collegeName || "—"}</Typography>
            </Box>
          </Stack>
        )}
      </Paper>

      {/* Navigation Sections */}
      <Stack spacing={2.5}>
        {NAV_SECTIONS.map((section) => (
          <Box key={section.label}>
            <Typography variant="caption" fontWeight={800} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.62rem", px: 1, display: "block", mb: 0.8 }}>
              {section.label}
            </Typography>
            <Stack spacing={0.5}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const badge = getBadge(item);
                const isActive = location.pathname === item.path || (item.path === "/dashboard" && location.pathname === "/dashboard");
                return (
                  <Box
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1.1,
                      borderRadius: "12px", cursor: "pointer", transition: "all 0.15s ease",
                      bgcolor: isActive ? "rgba(79,70,229,0.1)" : "transparent",
                      border: isActive ? "1px solid rgba(79,70,229,0.2)" : "1px solid transparent",
                      "&:hover": { bgcolor: "rgba(79,70,229,0.07)", borderColor: "rgba(79,70,229,0.15)" },
                    }}
                  >
                    <Badge badgeContent={badge} color="error" max={99} sx={{ "& .MuiBadge-badge": { fontSize: "0.6rem", height: 16, minWidth: 16, px: 0.5 } }}>
                      <Icon sx={{ fontSize: 20, color: isActive ? "primary.main" : "text.secondary" }} />
                    </Badge>
                    <Typography variant="body2" fontWeight={isActive ? 800 : 600} color={isActive ? "primary.main" : "text.primary"} sx={{ flex: 1 }}>
                      {item.label}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
