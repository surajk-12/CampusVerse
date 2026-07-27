import { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Grid, Stack, Avatar, Button,
  Chip, Divider, CircularProgress, Skeleton,
} from "@mui/material";
import {
  VerifiedUser, School, LocationOn, Email, Badge,
  ArrowBack, Forum, WorkspacePremium, People,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";

export default function UserProfile() {
  const { userId } = useParams();
  const { user: me, friends } = useAuth();
  const nav = useNavigate();
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

  const [profile, setProfile] = useState(null);
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Determine friendship status
  const isFriend = friends?.some((f) => {
    const fId = typeof f === "object" ? f._id : f;
    return fId === userId;
  });
  const isMe = me?._id === userId;

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/users/${userId}`);
        setProfile(data);

        if (data?.college) {
          const { data: col } = await api.get(`/colleges/${typeof data.college === "object" ? data.college._id : data.college}`);
          setCollege(col);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Skeleton variant="rounded" height={200} sx={{ borderRadius: "24px", mb: 3 }} />
      <Skeleton variant="rounded" height={300} sx={{ borderRadius: "24px" }} />
    </Box>
  );

  if (error) return (
    <Box sx={{ mt: 8, textAlign: "center" }}>
      <Typography color="error" variant="h6">{error}</Typography>
      <Button onClick={() => nav(-1)} sx={{ mt: 2 }} startIcon={<ArrowBack />}>Go Back</Button>
    </Box>
  );

  if (!profile) return null;

  const avatarUrl = profile.photo ? `${apiBase}/uploads/${profile.photo}` : undefined;

  const infoRows = [
    { icon: <Email sx={{ fontSize: 18 }} />, label: "Email", value: profile.email, color: "#6366F1" },
    { icon: <Badge sx={{ fontSize: 18 }} />, label: "Course & Branch", value: `${profile.course || "—"} — ${profile.branch || "—"}`, color: "#EC4899" },
    { icon: <School sx={{ fontSize: 18 }} />, label: "University", value: college?.collegeName || "—", color: "#10B981" },
    { icon: <LocationOn sx={{ fontSize: 18 }} />, label: "Campus", value: college ? `${college.city || ""}, ${college.state || ""}` : "—", color: "#F59E0B" },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Back Button Row */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => nav(-1)}
          variant="outlined"
          sx={{
            borderRadius: "12px",
            fontWeight: 700,
            borderColor: "rgba(255,255,255,0.15)",
            color: "text.primary",
            "&:hover": { borderColor: "text.primary", bgcolor: "rgba(255,255,255,0.05)" },
          }}
        >
          Back
        </Button>
        {isFriend && (
          <Chip
            icon={<VerifiedUser sx={{ color: "#10B981 !important", fontSize: 15 }} />}
            label="Campus Friend"
            sx={{
              bgcolor: "rgba(16, 185, 129, 0.1)",
              color: "#10B981",
              fontWeight: 800,
              border: "1px solid rgba(16, 185, 129, 0.25)",
              fontSize: "0.75rem",
            }}
          />
        )}
        {isMe && (
          <Chip
            label="This is You"
            sx={{
              bgcolor: "rgba(99,102,241,0.1)",
              color: "primary.main",
              fontWeight: 800,
              border: "1px solid rgba(99,102,241,0.25)",
            }}
          />
        )}
      </Stack>

      {/* Main Profile Card */}
      <Paper
        elevation={0}
        sx={{
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "32px",
          overflow: "hidden",
          background: "rgba(30, 41, 59, 0.35)",
          backdropFilter: "blur(12px)",
          boxShadow: isFriend
            ? "0 20px 40px rgba(16, 185, 129, 0.08), 0 0 0 1px rgba(16,185,129,0.1)"
            : "0 20px 40px rgba(0,0,0,0.35)",
        }}
      >
        {/* Banner */}
        <Box
          sx={{
            height: 180,
            background: isFriend
              ? "linear-gradient(135deg, #064E3B 0%, #065F46 40%, #1D4ED8 100%)"
              : "linear-gradient(135deg, #312E81 0%, #4338CA 30%, #DB2777 100%)",
            position: "relative",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            p: 3,
            "&::before": {
              content: '""',
              position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
              background: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 60%)",
            },
          }}
        >
          {isFriend && (
            <Chip
              icon={<People sx={{ color: "#10B981 !important", fontSize: 15 }} />}
              label="YOUR FRIEND"
              sx={{
                bgcolor: "rgba(16,185,129,0.2)",
                color: "#10B981",
                fontWeight: 800,
                fontSize: "0.7rem",
                letterSpacing: "0.05em",
                border: "1px solid rgba(16,185,129,0.4)",
                backdropFilter: "blur(10px)",
              }}
            />
          )}
        </Box>

        {/* Body */}
        <Box sx={{ px: { xs: 3, md: 5 }, pb: 5 }}>
          {/* Avatar + Name */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            alignItems={{ xs: "flex-start", sm: "flex-end" }}
            sx={{ mt: "-60px", mb: 4 }}
          >
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={avatarUrl}
                sx={{
                  width: 120,
                  height: 120,
                  border: isFriend ? "6px solid rgba(16,185,129,0.5)" : "6px solid #0B0F19",
                  boxShadow: isFriend
                    ? "0 0 28px rgba(16,185,129,0.4)"
                    : "0 0 25px rgba(99,102,241,0.3)",
                  bgcolor: "#1E293B",
                  fontSize: 44,
                  fontWeight: 800,
                  color: "primary.main",
                  flexShrink: 0,
                }}
              >
                {profile.firstName?.[0]}
              </Avatar>
              {isFriend && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 6,
                    right: 6,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: "#10B981",
                    border: "3px solid #0B0F19",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              )}
            </Box>

            <Box sx={{ flex: 1, pt: { xs: 1, sm: "60px" } }}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} gap={3}>
                <Box>
                  <Typography variant="h4" fontWeight={900} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {profile.firstName} {profile.lastName || ""}
                    {isFriend && <WorkspacePremium sx={{ color: "#10B981", fontSize: 26 }} />}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {college?.collegeName || "—"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, display: "block" }}>
                    Class of {profile.passingYear || "—"} · {profile.course || "—"}
                  </Typography>
                </Box>

                {/* Action Buttons */}
                {isFriend && !isMe && (
                  <Button
                    variant="contained"
                    startIcon={<Forum />}
                    onClick={() => nav("/chat", { state: { friend: profile } })}
                    sx={{
                      borderRadius: "12px",
                      fontWeight: 700,
                      background: "linear-gradient(135deg, #065F46 0%, #10B981 100%)",
                      boxShadow: "0 4px 15px rgba(16,185,129,0.35)",
                      "&:hover": { background: "linear-gradient(135deg, #047857 0%, #059669 100%)" },
                    }}
                  >
                    Send Message
                  </Button>
                )}
                {isMe && (
                  <Button
                    variant="outlined"
                    onClick={() => nav("/profile")}
                    sx={{
                      borderRadius: "12px",
                      fontWeight: 700,
                      borderColor: "rgba(255,255,255,0.15)",
                      color: "text.primary",
                    }}
                  >
                    Edit My Profile
                  </Button>
                )}
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ mb: 4, borderColor: "rgba(255,255,255,0.08)" }} />

          {/* Info Rows */}
          <Typography variant="subtitle1" fontWeight={900} color="text.primary" sx={{ mb: 3 }}>
            {isFriend ? "Classmate Details" : "Student Info"}
          </Typography>
          <Stack spacing={3}>
            {infoRows
              .filter((row) => {
                // Non-friends cannot see email
                if (row.label === "Email" && !isFriend && !isMe) return false;
                return true;
              })
              .map((row, i) => (
                <Stack key={i} direction="row" spacing={2.5} alignItems="center">
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: "14px",
                      bgcolor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
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

          {/* Privacy note for non-friends */}
          {!isFriend && !isMe && (
            <Box
              sx={{
                mt: 4,
                p: 2,
                borderRadius: "16px",
                bgcolor: "rgba(255,255,255,0.01)",
                border: "1px solid rgba(255,255,255,0.05)",
                textAlign: "center",
              }}
            >
              <Typography variant="caption" color="text.disabled">
                🔒 Connect with this student to see their full profile, email, and message them directly.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
