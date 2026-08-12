import React, { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Stack,
  Button,
  Tooltip,
  Paper,
  Drawer,
  Divider,
} from "@mui/material";
import {
  School as SchoolIcon,
  Notifications as NotificationsIcon,
  Forum as ForumIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Campaign as CampaignIcon,
  Event as EventIcon,
  People as PeopleIcon,
  Storefront as StorefrontIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  QuestionAnswer as QnaIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AIAssistantWidget from "./AIAssistantWidget.jsx";

export default function AuthenticatedLayout({ sidebarContent, children }) {
  const { user, logout, notifications, seenNotificationsCount } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");
  const avatarUrl = user?.photo ? `${apiBase}/uploads/${user.photo}` : undefined;

  // Unseen notification count
  const pendingNotifications = notifications.filter((n) => n.status === "pending").length;
  const unseenNotificationsCount = seenNotificationsCount !== null && pendingNotifications > seenNotificationsCount
    ? pendingNotifications - seenNotificationsCount
    : 0;

  // Top Nav Items (Sidebar links duplicated to Top Menu for easy classic navigation)
  const TOP_NAV_ITEMS = [
    { label: "Dashboard", path: "/dashboard", icon: DashboardIcon },
    { label: "Feed", path: "/feed", icon: CampaignIcon },
    { label: "Events", path: "/events", icon: EventIcon },
    { label: "Notes", path: "/notes", icon: SchoolIcon },
    { label: "Market", path: "/marketplace", icon: StorefrontIcon },
    { label: "Q&A", path: "/queries", icon: QnaIcon },
    { label: "Connections", path: "/connections", icon: PeopleIcon },
    { label: "Chat", path: "/chat", icon: ForumIcon },
  ];

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      {/* Top Professional Header Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          zIndex: 1100,
          top: 0,
          borderRadius: "0px",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", height: 56, px: { xs: 2, sm: 3 } }}>
          <Stack direction="row" alignItems="center">
            {/* Hamburger Menu for Mobile & Tablet */}
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{ display: { xs: "inline-flex", md: "none" }, color: "text.primary", mr: 1 }}
            >
              <MenuIcon />
            </IconButton>

            {/* Left: Brand Logo & Title */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 3px 8px rgba(79, 70, 229, 0.25)",
                }}
              >
                <SchoolIcon sx={{ fontSize: 16 }} />
              </Box>
              <Typography
                variant="subtitle1"
                fontWeight={900}
                sx={{
                  letterSpacing: "-0.01em",
                  background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                CampusVerse
              </Typography>
            </Stack>
          </Stack>

          {/* Center: Navigation Links */}
          <Stack direction="row" spacing={0.5} sx={{ display: { xs: "none", md: "flex" } }}>
            {TOP_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  startIcon={<Icon sx={{ fontSize: "16px !important", color: isActive ? "primary.main" : "text.secondary" }} />}
                  sx={{
                    textTransform: "none",
                    fontWeight: isActive ? 800 : 600,
                    fontSize: "0.78rem",
                    px: 2,
                    py: 0.6,
                    borderRadius: "30px",
                    color: isActive ? "primary.main" : "text.secondary",
                    bgcolor: isActive ? "rgba(79, 70, 229, 0.08)" : "transparent",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      bgcolor: "rgba(79, 70, 229, 0.05)",
                      color: "text.primary",
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>

          {/* Right: Actions */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Notifications Icon Badge */}
            <Tooltip title="Notifications">
              <IconButton size="small" onClick={() => navigate("/notifications")} sx={{ color: "text.secondary", bgcolor: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <Badge badgeContent={unseenNotificationsCount} color="error" max={99} sx={{ "& .MuiBadge-badge": { fontSize: "0.58rem", height: 15, minWidth: 15 } }}>
                  <NotificationsIcon sx={{ fontSize: 18 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile Avatar Trigger */}
            <Tooltip title="My Profile">
              <Avatar
                src={avatarUrl}
                onClick={() => navigate(`/profile/${user?._id}`)}
                sx={{
                  width: 28,
                  height: 28,
                  cursor: "pointer",
                  bgcolor: "primary.light",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  fontSize: 12,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                {user?.firstName?.[0]}
              </Avatar>
            </Tooltip>

            {/* Logout Trigger (Desktop) */}
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              startIcon={<LogoutIcon sx={{ fontSize: 12 }} />}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.72rem",
                borderRadius: "30px",
                height: 28,
                px: 2,
                borderColor: "rgba(239, 68, 68, 0.25)",
                color: "#EF4444",
                "&:hover": {
                  borderColor: "#EF4444",
                  bgcolor: "rgba(239, 68, 68, 0.05)",
                },
              }}
            >
              Logout
            </Button>

            {/* Logout Trigger (Mobile Icon Only) */}
            <IconButton
              size="small"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              sx={{
                display: { xs: "inline-flex", sm: "none" },
                color: "#EF4444",
                bgcolor: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                borderRadius: "50%",
                "&:hover": {
                  borderColor: "#EF4444",
                  bgcolor: "rgba(239, 68, 68, 0.1)",
                },
              }}
            >
              <LogoutIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Under-Header Content Area */}
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        {/* Left Navigation Sidebar */}
        <Box
          sx={{
            width: 280,
            flexShrink: 0,
            p: 2,
            borderRight: "1px solid rgba(255, 255, 255, 0.06)",
            bgcolor: "background.paper",
            overflowY: "auto",
            display: { xs: "none", sm: "block" },
          }}
        >
          {sidebarContent}
        </Box>

        {/* Main Content Panel */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            overflowX: "hidden",
            overflowY: "auto",
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Mobile navigation drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: "#0F172A",
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "10px 0px 30px rgba(0,0,0,0.5)",
            overflowY: "auto",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Drawer Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                }}
              >
                <SchoolIcon sx={{ fontSize: 16 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={900} color="text.primary">
                CampusVerse
              </Typography>
            </Stack>
            <IconButton onClick={() => setMobileOpen(false)} sx={{ color: "text.secondary" }}>
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Stack>
          
          <Divider sx={{ mb: 2.5, borderColor: "rgba(255,255,255,0.06)" }} />

          {/* Quick Navigation Items */}
          <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ px: 1, mb: 1, display: "block", textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.05em" }}>
            Navigation
          </Typography>
          <Stack spacing={0.5} sx={{ mb: 3 }}>
            {TOP_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  startIcon={<Icon sx={{ fontSize: "16px !important", color: isActive ? "primary.main" : "text.secondary" }} />}
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    fontWeight: isActive ? 800 : 600,
                    fontSize: "0.8rem",
                    px: 2,
                    py: 1,
                    borderRadius: "12px",
                    color: isActive ? "primary.main" : "text.secondary",
                    bgcolor: isActive ? "rgba(79, 70, 229, 0.08)" : "transparent",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      bgcolor: "rgba(79, 70, 229, 0.05)",
                      color: "text.primary",
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}

            {/* Mobile Drawer Logout Button */}
            <Button
              onClick={() => {
                logout();
                navigate("/login");
                setMobileOpen(false);
              }}
              startIcon={<LogoutIcon sx={{ fontSize: "16px !important", color: "#EF4444" }} />}
              sx={{
                justifyContent: "flex-start",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.8rem",
                px: 2,
                py: 1,
                borderRadius: "12px",
                color: "#EF4444",
                bgcolor: "rgba(239, 68, 68, 0.05)",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: "rgba(239, 68, 68, 0.1)",
                },
              }}
            >
              Logout
            </Button>
          </Stack>

          <Divider sx={{ mb: 2.5, borderColor: "rgba(255,255,255,0.06)" }} />

          {/* Render Sidebar content inline for mobile */}
          <Box onClick={() => setMobileOpen(false)}>
            {sidebarContent}
          </Box>
        </Box>
      </Drawer>
      <AIAssistantWidget />
    </Box>
  );
}
