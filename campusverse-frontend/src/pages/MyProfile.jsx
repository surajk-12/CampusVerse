import { useAuth } from "../context/AuthContext.jsx";
import { Box, Typography, Paper, Grid, Stack, Avatar, Button, Chip, Divider, CircularProgress } from "@mui/material";
import { VerifiedUser, School, People, ArrowForward, LocationOn, CalendarMonth, Email, Badge, Edit, WorkspacePremium } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios.js";

export default function MyProfile() {
  const { user, friends } = useAuth();
  const nav = useNavigate();
  const [myCollegeDetails, setMyCollegeDetails] = useState(null);
  const [loadingCollege, setLoadingCollege] = useState(false);
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

  useEffect(() => {
    if (!user?.college) return;
    setLoadingCollege(true);
    api.get(`/colleges/${user.college}`)
      .then(({ data }) => setMyCollegeDetails(data))
      .catch((err) => console.error(err))
      .finally(() => setLoadingCollege(false));
  }, [user?.college]);

  if (!user) return null;
  const avatarUrl = user?.photo ? `${apiBase}/uploads/${user.photo}` : undefined;
  const idCardUrl = user?.collegeIdCard ? `${apiBase}/uploads/${user.collegeIdCard}` : undefined;

  const stats = [
    { label: "Connections", value: friends?.length || 0, color: "#6366F1", bg: "rgba(99, 102, 241, 0.08)" },
    { label: "Course / Branch", value: `${user.course || "—"} (${user.branch || "—"})`, color: "#EC4899", bg: "rgba(236, 72, 153, 0.08)" },
    { label: "Class of", value: user.passingYear || "—", color: "#10B981", bg: "rgba(16, 185, 129, 0.08)" },
  ];

  const infoRows = [
    { icon: <Email sx={{ fontSize: 18 }} />, label: "Email Address", value: user.email, color: "#6366F1" },
    { icon: <Badge sx={{ fontSize: 18 }} />, label: "Course & Specialization", value: `${user.course || "—"} - ${user.branch || "—"}`, color: "#EC4899" },
    { icon: <School sx={{ fontSize: 18 }} />, label: "University / College", value: loadingCollege ? "Loading..." : myCollegeDetails?.collegeName || "—", color: "#10B981" },
    { icon: <LocationOn sx={{ fontSize: 18 }} />, label: "Campus Address", value: myCollegeDetails ? `${myCollegeDetails.address || ""}, ${myCollegeDetails.city || ""}, ${myCollegeDetails.state || ""}` : "—", color: "#F59E0B" },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Page Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} sx={{ background: "linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.7) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          My Student Profile
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage your verified student credentials and campus networking index card.
        </Typography>
      </Box>

      {/* Main Glass Profile Card */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "32px",
          overflow: "hidden",
          background: "rgba(30, 41, 59, 0.35)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Banner Section with Space Gradients */}
        <Box
          sx={{
            height: 200,
            background: "linear-gradient(135deg, #312E81 0%, #4338CA 30%, #DB2777 100%)",
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            p: 3,
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, rgba(0,0,0,0) 60%)",
            }
          }}
        >
          {/* Glowing Badge */}
          <Chip
            icon={<VerifiedUser sx={{ color: "#10B981 !important", fontSize: 16 }} />}
            label="VERIFIED STUDENT"
            sx={{
              bgcolor: "rgba(16, 185, 129, 0.15)",
              color: "#10B981",
              fontWeight: 800,
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              backdropFilter: "blur(10px)",
              p: 0.5,
              borderRadius: "12px",
            }}
          />
        </Box>

        {/* Profile Card Body */}
        <Box sx={{ px: { xs: 3, md: 5 }, pb: 5 }}>
          {/* Avatar and Main Controls overlap */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            alignItems={{ xs: "flex-start", sm: "flex-end" }}
            sx={{ mt: "-60px", mb: 4 }}
          >
            <Avatar
              src={avatarUrl}
              sx={{
                width: 120,
                height: 120,
                border: "6px solid #0B0F19",
                boxShadow: "0 0 25px rgba(99, 102, 241, 0.4)",
                bgcolor: "#1E293B",
                fontSize: 44,
                fontWeight: 800,
                color: "primary.main",
                flexShrink: 0,
              }}
            >
              {user.firstName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1, pt: { xs: 1, sm: "60px" } }}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} gap={3}>
                <Box>
                  <Typography variant="h4" fontWeight={900} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {user.firstName} {user.lastName || ""}
                    <WorkspacePremium sx={{ color: "primary.main", fontSize: 26 }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {loadingCollege ? "Loading College..." : myCollegeDetails?.collegeName || "—"}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} sx={{ width: { xs: "100%", sm: "auto" } }}>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    sx={{
                      borderRadius: "12px",
                      fontWeight: 700,
                      borderColor: "rgba(255, 255, 255, 0.15)",
                      color: "text.primary",
                      "&:hover": { borderColor: "text.primary", bgcolor: "rgba(255,255,255,0.05)" }
                    }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={<ArrowForward />}
                    onClick={() => nav(`/colleges/${user.college}/students`, { state: { collegeId: user.college, collegeName: myCollegeDetails?.collegeName } })}
                    sx={{
                      borderRadius: "12px",
                      fontWeight: 700,
                      background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                      boxShadow: "0 4px 15px rgba(79, 70, 229, 0.4)",
                      "&:hover": { background: "linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)" }
                    }}
                  >
                    My Classmates
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          {/* Stats Bar */}
          <Grid container spacing={3} sx={{ mb: 5 }}>
            {stats.map((s) => (
              <Grid item xs={12} sm={4} key={s.label}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    textAlign: "center",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "20px",
                    bgcolor: "rgba(255, 255, 255, 0.015)",
                    transition: "transform 0.2s, background-color 0.2s",
                    "&:hover": { transform: "translateY(-2px)", bgcolor: "rgba(255, 255, 255, 0.03)" },
                  }}
                >
                  <Typography variant="h5" fontWeight={900} sx={{ color: s.color }}>
                    {s.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", mt: 0.5, display: "block" }}>
                    {s.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ mb: 4, borderColor: "rgba(255, 255, 255, 0.08)" }} />

          {/* Information & Documents Grid */}
          <Grid container spacing={5}>
            {/* Left: General Info */}
            <Grid item xs={12} md={7}>
              <Typography variant="subtitle1" fontWeight={900} color="text.primary" sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                Student Credentials
              </Typography>
              <Stack spacing={3}>
                {infoRows.map((row, i) => (
                  <Stack key={i} direction="row" spacing={2.5} alignItems="center">
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: "14px",
                        bgcolor: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                        color: row.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {row.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.05em" }} display="block">
                        {row.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mt: 0.3 }}>
                        {row.value}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Grid>

            {/* Right: Uploaded ID Card Display */}
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle1" fontWeight={900} color="text.primary" sx={{ mb: 3 }}>
                Verified ID Card
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "24px",
                  bgcolor: "rgba(255, 255, 255, 0.01)",
                  textAlign: "center",
                }}
              >
                {idCardUrl ? (
                  <Box
                    component="img"
                    src={idCardUrl}
                    alt="College ID Card"
                    sx={{
                      width: "100%",
                      maxHeight: "220px",
                      objectFit: "contain",
                      borderRadius: "16px",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      background: "rgba(0,0,0,0.25)",
                      p: 1,
                    }}
                  />
                ) : (
                  <Box sx={{ py: 6, color: "text.disabled" }}>
                    <School sx={{ fontSize: 44, mb: 1, opacity: 0.4 }} />
                    <Typography variant="body2">No ID card document uploaded</Typography>
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5, fontStyle: "italic" }}>
                  This document serves as proof of student status for automatic/manual audit.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
