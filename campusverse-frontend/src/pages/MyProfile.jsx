import { useAuth } from "../context/AuthContext.jsx";
import { Box, Typography, Paper, Grid, Stack, Avatar, Button, Chip, Divider, CircularProgress } from "@mui/material";
import { VerifiedUser, School, People, ArrowForward, LocationOn, CalendarMonth, Email, Badge, Edit } from "@mui/icons-material";
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

  const stats = [
    { label: "Connections", value: friends?.length || 0, color: "primary.main" },
    { label: "Course", value: user.course || "—", color: "secondary.main" },
    { label: "Class of", value: user.passingYear || "—", color: "success.main" },
  ];

  const infoRows = [
    { icon: <Email sx={{ fontSize: 18, color: "primary.main" }} />, label: "Email Address", value: user.email },
    { icon: <Badge sx={{ fontSize: 18, color: "secondary.main" }} />, label: "Branch / Specialization", value: user.branch || "—" },
    { icon: <School sx={{ fontSize: 18, color: "success.main" }} />, label: "College", value: loadingCollege ? "Loading..." : myCollegeDetails?.collegeName || "—" },
    { icon: <LocationOn sx={{ fontSize: 18, color: "warning.main" }} />, label: "Campus Location", value: myCollegeDetails ? `${myCollegeDetails.city || "—"}, ${myCollegeDetails.state || "—"}, ${myCollegeDetails.country || "—"}` : "—" },
    { icon: <CalendarMonth sx={{ fontSize: 18, color: "error.main" }} />, label: "Graduation Year", value: `Class of ${user.passingYear || "—"}` },
    { icon: <People sx={{ fontSize: 18, color: "info.main" }} />, label: "Network Connections", value: `${friends?.length || 0} friends connected` },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={800}>Student Profile</Typography>
        <Typography variant="body2" color="text.secondary">Your verified student identity card on CampusVerse.</Typography>
      </Box>
      <Paper elevation={0} sx={{ border: "1px solid rgba(226,232,240,0.8)", borderRadius: "28px", overflow: "hidden" }}>
        <Box sx={{ height: 180, background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 40%, #EC4899 100%)", position: "relative" }}>
          <Box sx={{ position: "absolute", top: 16, right: 20, display: "flex", alignItems: "center", gap: 0.6, bgcolor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)", px: 1.5, py: 0.6, borderRadius: "20px" }}>
            <VerifiedUser sx={{ fontSize: 14, color: "#fff" }} />
            <Typography variant="caption" fontWeight={700} sx={{ color: "#fff", letterSpacing: "0.05em" }}>STUDENT VERIFIED</Typography>
          </Box>
          <Box sx={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)" }} />
          <Box sx={{ position: "absolute", top: -20, left: "40%", width: 100, height: 100, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)" }} />
        </Box>
        <Box sx={{ px: { xs: 3, md: 5 }, pb: 4 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ xs: "flex-start", sm: "flex-end" }} sx={{ mt: "-52px", mb: 3 }}>
            <Avatar src={avatarUrl} sx={{ width: 104, height: 104, border: "4px solid #fff", boxShadow: "0 6px 20px rgba(79,70,229,0.3)", bgcolor: "primary.light", fontSize: 38, flexShrink: 0 }}>
              {user.firstName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1, pt: { xs: 1, sm: "52px" } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                <Box>
                  <Typography variant="h5" fontWeight={800} color="text.primary" lineHeight={1.2}>{user.firstName} {user.lastName}</Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.3}>{user.course} • {user.branch} • Class of {user.passingYear}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" size="small" startIcon={<Edit />} sx={{ borderRadius: "10px", fontWeight: 700, borderWidth: "1.5px" }}>Edit Profile</Button>
                  <Button variant="contained" size="small" endIcon={<ArrowForward />} onClick={() => nav(`/colleges/${user.college}/students`, { state: { collegeId: user.college, collegeName: myCollegeDetails?.collegeName } })} sx={{ borderRadius: "10px", fontWeight: 700 }}>My Classmates</Button>
                </Stack>
              </Stack>
            </Box>
          </Stack>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {stats.map((s) => (
              <Grid item xs={4} key={s.label}>
                <Paper elevation={0} sx={{ p: 2, textAlign: "center", border: "1px solid rgba(226,232,240,0.7)", borderRadius: "16px", bgcolor: "rgba(248,250,252,0.5)" }}>
                  <Typography variant="h6" fontWeight={800} color={s.color}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", mb: 2 }}>Student Information</Typography>
          <Grid container spacing={3}>
            {infoRows.map((row, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ mt: 0.2, flexShrink: 0 }}>{row.icon}</Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }} display="block">{row.label}</Typography>
                    <Typography variant="body2" fontWeight={600} color="text.primary">{row.value}</Typography>
                  </Box>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
