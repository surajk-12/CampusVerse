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

export default function Connections() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [friendsList, setFriendsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    api.get(`/users/${user._id}`)
      .then(({ data }) => setFriendsList(data.friends || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [user?._id]);

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
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={800}>My Connections</Typography>
        <Typography variant="body2" color="text.secondary">
          All your campus friends and peers in one place.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "20px", overflow: "hidden" }}>
        {/* Header bar */}
        <Box sx={{ px: 3, py: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>Network ({filtered.length})</Typography>
            <Typography variant="caption" color="text.secondary">{friendsList.length} total connection{friendsList.length !== 1 ? "s" : ""} in your network</Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search connections..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                minWidth: 220,
                "& .MuiOutlinedInput-root": {
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "10px",
                },
              }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment> }}
            />
            <Button variant="outlined" size="small" startIcon={<PersonAdd />} onClick={() => nav(`/colleges/${user.college}/students`, { state: { collegeId: user.college } })} sx={{ borderRadius: "10px", fontWeight: 700, borderWidth: "1.5px", whiteSpace: "nowrap" }}>
              Find Peers
            </Button>
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <CircularProgress size={36} />
            <Typography variant="body2" color="text.secondary" mt={2}>Loading connections...</Typography>
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <People sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1}>
              {search ? "No results found" : "No connections yet"}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {search ? "Try a different search term." : "Browse the campus directory to connect with peers."}
            </Typography>
            {!search && (
              <Button variant="contained" onClick={() => nav(`/colleges/${user.college}/students`, { state: { collegeId: user.college } })} sx={{ borderRadius: "10px", fontWeight: 700 }}>
                Browse Campus Directory
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {["#", "Student", "Course", "Branch", "Passing Year", "Email", "Actions"].map((col, ci) => (
                    <TableCell key={col} align={ci === 6 ? "center" : "left"}
                      sx={{ fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "text.secondary", bgcolor: "rgba(255, 255, 255, 0.02)", borderBottom: "2px solid rgba(255, 255, 255, 0.08)", whiteSpace: "nowrap" }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((friend, idx) => (
                  <TableRow key={friend._id}
                    sx={{ bgcolor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)", transition: "background 0.15s", "&:hover": { bgcolor: "rgba(255,255,255,0.03) !important" } }}>
                    <TableCell sx={{ color: "text.disabled", fontWeight: 600, width: 48 }}>{idx + 1}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar src={friend.photo ? `${apiBase}/uploads/${friend.photo}` : undefined}
                          sx={{ width: 42, height: 42, bgcolor: "primary.light", fontWeight: 700, fontSize: 16 }}>
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
                    <TableCell align="center">
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
      </Paper>
    </Box>
  );
}
