import React, { useEffect, useState } from "react";
import { Box, Typography, Divider, Avatar, Stack, CircularProgress, Badge, Paper, Tooltip } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import { useNavigate, useLocation } from "react-router-dom";
import useRole from "../hooks/useRole.js";

const NAV_SECTIONS = []; // Deprecated, using dynamic sections instead

// Icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ForumIcon from "@mui/icons-material/Forum";
import SchoolIcon from "@mui/icons-material/School";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import BoltIcon from "@mui/icons-material/Bolt";
import CampaignIcon from "@mui/icons-material/Campaign";
import EventIcon from "@mui/icons-material/Event";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";



export default function MySidebar() {
  const { isSuperAdmin } = useRole();
  const {
    user,
    notifications,
    friends,
    refreshNotifications,
    refreshFriends,
    seenNotificationsCount,
    seenFriendsCount,
    markNotificationsAsSeen,
    markConnectionsAsSeen
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

  const [collegeDetails, setCollegeDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const sections = [
    {
      label: "Main",
      items: [
        { label: "Quick Actions", icon: BoltIcon, path: "/quick-actions", badge: null },
      ],
    },
    {
      label: "Campus",
      items: [
        ...(user?.college ? [{ label: "My College", icon: SchoolIcon, path: "my-college", badge: null }] : []),
        { label: "Browse Students", icon: PersonSearchIcon, path: "browse-students", badge: null },
      ],
    },
    ...(isSuperAdmin ? [
      {
        label: "Admin",
        items: [
          { label: "Register College", icon: SchoolIcon, path: "/college-register", badge: null },
        ],
      }
    ] : []),
  ];

  useEffect(() => {
    if (!user?.college) return;
    setLoading(true);
    api.get(`/colleges/${user.college}`)
      .then(({ data }) => setCollegeDetails(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user?.college]);

  // Auto-refresh badge counts on every route change
  useEffect(() => {
    if (!user?._id) return;

    // Always refresh notifications to keep badge accurate
    refreshNotifications(user._id);

    // Refresh friends list when visiting /connections or /chat
    if (
      location.pathname === "/connections" ||
      location.pathname === "/chat" ||
      location.pathname === "/notifications"
    ) {
      refreshFriends(user._id);
    }

    // Clear notification badge immediately when user is on the notifications page
    if (location.pathname === "/notifications") {
      markNotificationsAsSeen();
    }

    // Clear connections badge immediately when user is on the connections page
    if (location.pathname === "/connections") {
      markConnectionsAsSeen();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, user?._id]);

  const avatarUrl = user?.photo ? `${apiBase}/uploads/${user.photo}` : undefined;

  // Calculate unseen counts
  const pendingCount = notifications.filter((n) => n.status === "pending").length;
  const unseenNotificationsCount = seenNotificationsCount !== null && pendingCount > seenNotificationsCount
    ? pendingCount - seenNotificationsCount
    : 0;

  const unseenFriendsCount = seenFriendsCount !== null && friends.length > seenFriendsCount
    ? friends.length - seenFriendsCount
    : 0;

  const getBadge = (item) => {
    if (item.badgeKey === "pending") return unseenNotificationsCount || null;
    if (item.badgeKey === "friends") return unseenFriendsCount || null;
    return item.badge;
  };

  const handleNav = (path) => {
    if (path === "my-college") {
      if (!user?.college) return; // super_admin has no college
      navigate(`/colleges/${user.college}/students`, { state: { collegeId: user.college, collegeName: collegeDetails?.collegeName } });
    } else if (path === "browse-students") {
      navigate("/dashboard");
    } else if (path === "/profile") {
      navigate(`/profile/${user._id}`);
    } else {
      navigate(path);
    }
  };

  const isItemActive = (item) => {
    if (location.pathname === item.path) return true;

    if (item.path === "my-college") {
      return user?.college && location.pathname === `/colleges/${user.college}/students`;
    }

    if (item.path === "browse-students") {
      return (
        location.pathname.startsWith("/colleges/") &&
        (!user?.college || location.pathname !== `/colleges/${user.college}/students`)
      );
    }

    if (item.path === "/dashboard") {
      return (
        location.pathname === "/dashboard" ||
        (location.pathname.startsWith("/colleges/") && !location.pathname.endsWith("/students"))
      );
    }

    return false;
  };

  return (
    <Box>
      {/* User Profile Card */}
      <Paper elevation={0} sx={{ display: { xs: "none", md: "block" }, textAlign: "center", mb: 3, p: 2.5, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: "20px" }}>
        <Avatar src={avatarUrl} sx={{ width: 72, height: 72, mx: "auto", mb: 1.5, boxShadow: "0 4px 10px rgba(0,0,0,0.15)", border: "2px solid", borderColor: "divider" }}>
          {user?.firstName?.[0]}
        </Avatar>
        <Typography variant="subtitle2" fontWeight={800} color="text.primary">{user?.firstName} {user?.lastName}</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>{user?.email}</Typography>
        <Divider sx={{ mx: "auto", mb: 1.5, width: "60%", borderColor: "divider" }} />
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
        {sections.map((section) => (
          <Box key={section.label}>
            <Typography variant="caption" fontWeight={800} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.62rem", px: 1, display: "block", mb: 0.8 }}>
              {section.label}
            </Typography>
            <Stack spacing={0.5}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const badge = getBadge(item);
                const isActive = isItemActive(item);
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
