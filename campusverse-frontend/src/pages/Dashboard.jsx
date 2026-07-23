import { useAuth } from "../context/AuthContext.jsx";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, TablePagination,
  InputAdornment, Grid, Card, CardContent, Stack, Chip,
} from "@mui/material";
import { Search, School, People, Notifications, Class } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios.js";

export default function Dashboard() {
  const { user, notifications, friends } = useAuth();
  const nav = useNavigate();

  const [colleges, setColleges] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [myCollegeDetails, setMyCollegeDetails] = useState(null);

  useEffect(() => {
    api.get("/colleges")
      .then(({ data }) => {
        if (Array.isArray(data)) setColleges(data);
        else if (Array.isArray(data.colleges)) setColleges(data.colleges);
        else setColleges([]);
      })
      .catch((err) => console.error("Failed to fetch colleges", err));
  }, []);

  useEffect(() => {
    if (!user?.college) return;
    api.get(`/colleges/${user.college}`)
      .then(({ data }) => setMyCollegeDetails(data))
      .catch((err) => console.error(err));
  }, [user?.college]);

  if (!user) return null;

  const pendingRequests = notifications.filter((n) => n.status === "pending").length;

  const filteredColleges = colleges.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.collegeName || c.name || "").toLowerCase().includes(q) ||
      (c.city || c.location || "").toLowerCase().includes(q)
    );
  });

  const paginatedColleges = filteredColleges.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const handleChangePage = (_, newPage) => setPage(newPage);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>

      {/* 1. Welcome Banner */}
      <Paper elevation={0} sx={{ p: { xs: 4, md: 5 }, mb: 4, borderRadius: "28px", background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #EC4899 100%)", color: "#ffffff", boxShadow: "0 10px 25px -5px rgba(79,70,229,0.3)", position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography variant="h4" fontWeight="800" gutterBottom>Welcome Back, {user.firstName}! 👋</Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: "600px", fontWeight: 500 }}>
            Browse the campus directory, connect with peers, and explore student networks across colleges.
          </Typography>
        </Box>
        <Box sx={{ position: "absolute", bottom: "-30px", right: "-20px", opacity: 0.1, zIndex: 0, transform: "rotate(-15deg)" }}>
          <School sx={{ fontSize: 260 }} />
        </Box>
      </Paper>

      {/* 2. Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 4, width: "100%", mx: 0 }}>
        {[
          { icon: <People />, value: friends?.length || 0, label: "Connections", sub: "Active friends in your circle", bg: "rgba(79,70,229,0.08)", color: "primary.main" },
          { icon: <Notifications />, value: pendingRequests, label: "Pending Invites", sub: "Friend requests awaiting review", bg: "rgba(236,72,153,0.08)", color: "secondary.main" },
          { icon: <Class />, value: myCollegeDetails?.students?.length || 0, label: "Campus Peers", sub: "Registered students in your college", bg: "rgba(16,185,129,0.08)", color: "success.main" },
        ].map((m) => (
          <Grid item xs={12} md={4} key={m.label}>
            <Card sx={{ bgcolor: "background.paper", height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box sx={{ p: 1.2, borderRadius: "12px", bgcolor: m.bg, color: m.color, display: "flex" }}>{m.icon}</Box>
                  <Typography variant="h5" fontWeight="800" color="text.primary">{m.value}</Typography>
                </Stack>
                <Typography variant="subtitle2" fontWeight="700" color="text.secondary">{m.label}</Typography>
                <Typography variant="caption" color="text.secondary">{m.sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 3. Table Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 2, border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px" }}>
        <Box>
          <Typography variant="h6" fontWeight="800">Campuses Directory</Typography>
          <Typography variant="body2" color="text.secondary">Click any row to explore that college's student directory</Typography>
        </Box>
        <TextField placeholder="Search campuses..." variant="outlined" size="small" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{
            maxWidth: { sm: 280 },
            "& .MuiOutlinedInput-root": {
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: "10px",
            },
          }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: "text.secondary", fontSize: 20 }} /></InputAdornment> }}
        />
      </Paper>

      {/* 4. Full-width College Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", overflow: "hidden" }}>
        {paginatedColleges.length === 0 ? (
          <Box sx={{ p: 8, textAlign: "center" }}>
            <School sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
            <Typography variant="body1" color="text.secondary">{search ? "No colleges match your search." : "No colleges found."}</Typography>
          </Box>
        ) : (
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {["#", "College Name", "City", "State", "Country", "Pincode", "Students"].map((col, ci) => (
                  <TableCell key={col} align={ci === 6 ? "center" : "left"}
                    sx={{ fontWeight: 800, bgcolor: "rgba(79,70,229,0.05)", color: "text.secondary", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "2px solid rgba(226,232,240,0.8)", whiteSpace: "nowrap" }}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedColleges.map((college, idx) => (
                <TableRow key={college._id} hover
                  onClick={() => nav(`/colleges/${college._id}/students`, { state: { collegeId: college._id, collegeName: college.collegeName } })}
                  sx={{ cursor: "pointer", bgcolor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)", transition: "background 0.2s", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.03) !important" } }}>
                  <TableCell sx={{ color: "text.disabled", fontWeight: 600, width: 48 }}>{page * rowsPerPage + idx + 1}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ p: 0.8, borderRadius: "10px", bgcolor: "rgba(79,70,229,0.08)", color: "primary.main", display: "flex", flexShrink: 0 }}>
                        <School sx={{ fontSize: 18 }} />
                      </Box>
                      <Typography variant="body2" fontWeight={700} color="text.primary">{college.collegeName || college.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{college.city || college.location || "—"}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{college.state || "—"}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{college.country || "—"}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{college.pincode || "—"}</Typography></TableCell>
                  <TableCell align="center">
                    <Chip label={college.students?.length ?? 0} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, borderRadius: "8px", minWidth: 48 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* 5. Pagination */}
      <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
        <TablePagination component="div" count={filteredColleges.length} page={page} onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage} rowsPerPageOptions={[]} sx={{ border: "none", bgcolor: "transparent" }} />
      </Box>

    </Box>
  );
}
