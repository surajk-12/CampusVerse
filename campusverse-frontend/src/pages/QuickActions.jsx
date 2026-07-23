import { useAuth } from "../context/AuthContext.jsx";
import { Box, Typography, Paper, Grid, Stack, Button, Chip, Divider } from "@mui/material";
import {
  HowToReg, Forum, School, PersonSearch, Dashboard,
  PeopleAlt, AccountCircle, Notifications, ArrowForward, OpenInNew,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const { user, notifications, friends } = useAuth();
  const nav = useNavigate();

  if (!user) return null;
  const pending = notifications.filter((n) => n.status === "pending").length;

  const groups = [
    {
      title: "My Account",
      color: "#4F46E5",
      items: [
        { label: "View My Profile", sublabel: "Student ID & details", icon: <AccountCircle />, badge: null, path: "/profile", color: "rgba(79,70,229,0.08)", iconColor: "primary.main" },
        { label: "My Connections", sublabel: `${friends?.length || 0} friends connected`, icon: <PeopleAlt />, badge: friends?.length || null, path: "/connections", color: "rgba(79,70,229,0.08)", iconColor: "primary.main" },
      ],
    },
    {
      title: "Social & Messaging",
      color: "#EC4899",
      items: [
        { label: "Friend Requests", sublabel: "Review pending invites", icon: <HowToReg />, badge: pending || null, path: "/notifications", color: "rgba(236,72,153,0.08)", iconColor: "secondary.main" },
        { label: "Campus Messenger", sublabel: "Chat with your connections", icon: <Forum />, badge: null, path: "/chat", color: "rgba(236,72,153,0.08)", iconColor: "secondary.main" },
      ],
    },
    {
      title: "Campus Directory",
      color: "#10B981",
      items: [
        { label: "College Directory", sublabel: "Browse all registered campuses", icon: <Dashboard />, badge: null, path: "/dashboard", color: "rgba(16,185,129,0.08)", iconColor: "success.main" },
        { label: "Browse My College", sublabel: "Find classmates in your college", icon: <School />, badge: null, path: `/colleges/${user.college}/students`, color: "rgba(16,185,129,0.08)", iconColor: "success.main" },
        { label: "Explore All Students", sublabel: "Discover peers across campuses", icon: <PersonSearch />, badge: null, path: "/dashboard", color: "rgba(16,185,129,0.08)", iconColor: "success.main" },
      ],
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={800}>Quick Actions</Typography>
        <Typography variant="body2" color="text.secondary">Jump to any section of CampusVerse instantly.</Typography>
      </Box>

      <Grid container spacing={3}>
        {groups.map((group) => (
          <Grid item xs={12} md={4} key={group.title}>
            <Paper elevation={0} sx={{ border: "1px solid rgba(226,232,240,0.8)", borderRadius: "20px", overflow: "hidden", height: "100%" }}>
              {/* Group header */}
              <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid rgba(226,232,240,0.6)", display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: group.color }} />
                <Typography variant="subtitle2" fontWeight={800} sx={{ textTransform: "uppercase", letterSpacing: "0.07em", fontSize: "0.72rem" }}>
                  {group.title}
                </Typography>
              </Box>

              <Stack spacing={0} divider={<Divider sx={{ opacity: 0.5 }} />}>
                {group.items.map((item, i) => (
                  <Box
                    key={i}
                    onClick={() => nav(item.path, item.path.includes("colleges") ? { state: { collegeId: user.college } } : undefined)}
                    sx={{
                      display: "flex", alignItems: "center", gap: 2, px: 2.5, py: 2,
                      cursor: "pointer", transition: "all 0.18s ease",
                      "&:hover": { bgcolor: item.color },
                    }}
                  >
                    <Box sx={{ p: 1.2, borderRadius: "12px", bgcolor: item.color, color: item.iconColor, display: "flex", flexShrink: 0 }}>
                      {item.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>{item.label}</Typography>
                        {item.badge != null && (
                          <Chip label={item.badge} size="small" color="primary" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, borderRadius: "6px" }} />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">{item.sublabel}</Typography>
                    </Box>
                    <ArrowForward sx={{ fontSize: 15, color: "text.disabled", flexShrink: 0 }} />
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Bottom CTA */}
      <Paper elevation={0} sx={{ mt: 4, p: 3.5, borderRadius: "20px", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #EC4899 100%)", color: "#fff" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={800}>Ready to grow your network?</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Browse students across campuses and connect with future colleagues.</Typography>
          </Box>
          <Button
            variant="contained"
            endIcon={<OpenInNew />}
            onClick={() => nav("/dashboard")}
            sx={{ bgcolor: "rgba(255,255,255,0.2)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, borderRadius: "12px", fontWeight: 800, border: "1px solid rgba(255,255,255,0.3)", whiteSpace: "nowrap", flexShrink: 0 }}>
            Explore Directory
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
