import { useAuth } from "../context/AuthContext.jsx";
import {
  Box, Typography, Paper, Stack, Avatar, Button, Chip,
  CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Tooltip, TextField, InputAdornment,
} from "@mui/material";
import { People, Chat as ChatIcon, Search, PersonAdd } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios.js";
import AISearchInput from "../components/AISearchInput.jsx";

export default function Connections() {
  const { user, markConnectionsAsSeen } = useAuth();
  const nav = useNavigate();
  const [friendsList, setFriendsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    api.get(`/users/${user._id}`)
      .then(({ data }) => {
        const list = data.friends || [];
        setFriendsList(list);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user?._id]);

  useEffect(() => {
    if (friendsList.length > 0 && markConnectionsAsSeen) {
      markConnectionsAsSeen();
    }
  }, [friendsList, markConnectionsAsSeen]);

  useEffect(() => {
    const handleAIFilter = (e) => {
      if (e.detail?.searchString) {
        setSearch(e.detail.searchString);
      }
    };
    window.addEventListener("ai-filter", handleAIFilter);
    return () => window.removeEventListener("ai-filter", handleAIFilter);
  }, []);

  if (!user) return null;

  const filtered = friendsList.filter((f) => {
    const q = search.toLowerCase();
    return (
      (f.firstName + " " + f.lastName).toLowerCase().includes(q) ||
      (f.course || "").toLowerCase().includes(q) ||
      (f.branch || "").toLowerCase().includes(q) ||
      (f.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={900}>My Connections</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          All your campus friends and peers in one place.
        </Typography>
      </Box>



      {/* 1. Search Block Header Panel */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "0px",
          background: "rgba(30, 41, 59, 0.15)",
          backdropFilter: "blur(12px)",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight="900" color="text.primary">Network ({filtered.length})</Typography>
          <Typography variant="caption" color="text.secondary">{friendsList.length} total connections in your network</Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <AISearchInput
            placeholder="Ask AI or search connections..."
            context="connections"
            onFilterApply={(res) => {
              setSearch(res.search || "");
            }}
            sx={{ minWidth: 220 }}
          />
          <Tooltip title={!user.college ? "No college linked to your account" : ""} placement="top">
            <span>
              <Button
                variant="outlined"
                size="small"
                disabled={!user.college}
                startIcon={<PersonAdd sx={{ fontSize: 12 }} />}
                onClick={() => user.college && nav(`/colleges/${user.college}/students`, { state: { collegeId: user.college } })}
                sx={{
                  borderRadius: "8px",
                  height: 28,
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  px: 2,
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  textTransform: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Find Peers
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Paper>

      {/* 2. Main List Panel (Table / Loading / Empty) */}
      {loading ? (
        <Paper elevation={0} sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "0px", p: 6, textAlign: "center" }}>
          <CircularProgress size={36} />
          <Typography variant="body2" color="text.secondary" mt={2}>Loading connections...</Typography>
        </Paper>
      ) : filtered.length === 0 ? (
        <Paper elevation={0} sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "0px", p: 6, textAlign: "center" }}>
          <People sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1}>
            {search ? "No results found" : "No connections yet"}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {search ? "Try a different search term." : "Browse the campus directory to connect with peers."}
          </Typography>
          {!search && user.college && (
            <Button
              variant="contained"
              size="small"
              onClick={() => nav(`/colleges/${user.college}/students`, { state: { collegeId: user.college } })}
              sx={{ borderRadius: "30px", height: 28, textTransform: "none", fontWeight: 700, fontSize: "0.72rem", px: 2.5 }}
            >
              Browse Campus Directory
            </Button>
          )}
          {!search && !user.college && (
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block" }}>
              No campus linked — super admins don't have a home campus.
            </Typography>
          )}
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "0px", overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                {["#", "Student", "Course", "Branch", "Passing Year", "Email", "Actions"].map((col, ci) => (
                  <TableCell key={col} align={ci === 6 ? "center" : "left"}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((friend, idx) => (
                <TableRow
                  key={friend._id}
                  onClick={() => nav(`/profile/${friend._id}`)}
                  sx={{
                    cursor: "pointer",
                    bgcolor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)",
                    transition: "background 0.15s",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.03) !important" },
                  }}
                >
                  <TableCell sx={{ color: "text.disabled", fontWeight: 600, width: 48 }}>{idx + 1}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={friend.photo ? `${apiBase}/uploads/${friend.photo}` : undefined}
                        sx={{ width: 32, height: 32, bgcolor: "primary.light", fontWeight: 700, fontSize: 13 }}>
                        {friend.firstName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700} color="text.primary">{friend.firstName} {friend.lastName}</Typography>
                        <Chip label="Connected" size="small" color="success" variant="outlined"
                          sx={{ height: 17, fontSize: "0.6rem", fontWeight: 700, borderRadius: "6px", mt: 0.3 }} />
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>{friend.course || "—"}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{friend.branch || "—"}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{friend.passingYear ? `Class of ${friend.passingYear}` : "—"}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {friend.email || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Open Chat">
                      <IconButton size="small" color="primary" onClick={() => nav("/chat", { state: { friend } })}
                        sx={{ bgcolor: "rgba(79,70,229,0.08)", borderRadius: "8px", "&:hover": { bgcolor: "rgba(79,70,229,0.18)" } }}>
                        <ChatIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
