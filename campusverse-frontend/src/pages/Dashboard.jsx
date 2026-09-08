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
import AISearchInput from "../components/AISearchInput.jsx";
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

  useEffect(() => {
    const handleAIFilter = (e) => {
      if (e.detail?.searchString) {
        setSearch(e.detail.searchString);
        setPage(0);
      }
    };
    window.addEventListener("ai-filter", handleAIFilter);
    return () => window.removeEventListener("ai-filter", handleAIFilter);
  }, []);

  if (!user) return null;

  const pendingRequests = notifications.filter((n) => n.status === "pending").length;

  const parseSearchCondition = (query) => {
    const q = query.toLowerCase().trim();
    if (q.includes("student")) {
      const numMatch = q.match(/\d+/);
      if (numMatch) {
        const targetCount = parseInt(numMatch[0], 10);
        if (q.includes("more than") || q.includes("greater than") || q.includes("above") || q.includes("over") || q.includes(">")) {
          return (c) => (c.students?.length || 0) > targetCount;
        }
        if (q.includes("less than") || q.includes("under") || q.includes("below") || q.includes("<")) {
          return (c) => (c.students?.length || 0) < targetCount;
        }
        if (q.includes("at least") || q.includes(">=")) {
          return (c) => (c.students?.length || 0) >= targetCount;
        }
        if (q.includes("at most") || q.includes("<=")) {
          return (c) => (c.students?.length || 0) <= targetCount;
        }
        return (c) => (c.students?.length || 0) === targetCount;
      }
    }
    return null;
  };

  const filteredColleges = colleges.filter((c) => {
    if (!search.trim()) return true;
    
    // Check if there is an active smart condition
    const condition = parseSearchCondition(search);
    if (condition) {
      return condition(c);
    }

    // Fallback to standard text search
    const q = search.toLowerCase();
    return (
      (c.collegeName || c.name || "").toLowerCase().includes(q) ||
      (c.city || c.location || "").toLowerCase().includes(q)
    );
  });

  const paginatedColleges = filteredColleges.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const handleChangePage = (_, newPage) => setPage(newPage);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* 1. Welcome Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: "20px",
          background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #EC4899 100%)",
          color: "#ffffff",
          boxShadow: "0 6px 20px -4px rgba(79,70,229,0.25)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography variant="h5" fontWeight="900" gutterBottom>
            Welcome Back, {user.firstName}! 👋
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: "550px", fontWeight: 500, fontSize: "0.85rem", lineHeight: 1.4 }}>
            Browse the campus directory, connect with peers, and explore student networks across colleges.
          </Typography>
        </Box>
        <Box sx={{ position: "absolute", bottom: "-30px", right: "-20px", opacity: 0.08, zIndex: 0, transform: "rotate(-15deg)" }}>
          <School sx={{ fontSize: 180 }} />
        </Box>
      </Paper>

      {/* 2. Metrics Row */}
      <Grid container spacing={2} sx={{ mb: 3, width: "100%", mx: 0 }}>
        {[
          { icon: <People sx={{ fontSize: 20 }} />, value: friends?.length || 0, label: "Connections", sub: "Active friends in your circle", bg: "rgba(79,70,229,0.08)", color: "primary.main" },
          { icon: <Notifications sx={{ fontSize: 20 }} />, value: pendingRequests, label: "Pending Invites", sub: "Friend requests awaiting review", bg: "rgba(236,72,153,0.08)", color: "secondary.main" },
          { icon: <Class sx={{ fontSize: 20 }} />, value: myCollegeDetails?.students?.length || 0, label: "Campus Peers", sub: "Registered classmates", bg: "rgba(16,185,129,0.08)", color: "success.main" },
        ].map((m) => (
          <Grid size={{ xs: 12, sm: 4, md: 4 }} key={m.label}>
            <Card sx={{ bgcolor: "background.paper", height: "100%" }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.2}>
                  <Box sx={{ p: 0.8, borderRadius: "10px", bgcolor: m.bg, color: m.color, display: "flex" }}>{m.icon}</Box>
                  <Typography variant="subtitle1" fontWeight="900" color="text.primary">{m.value}</Typography>
                </Stack>
                <Typography variant="body2" fontWeight="800" color="text.primary" sx={{ fontSize: "0.8rem", mb: 0.2 }}>{m.label}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem", display: "block" }}>{m.sub}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>



      {/* 3. Table Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "0px",
          bgcolor: "background.paper",
          backdropFilter: "blur(12px)",
        }}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight="900" color="text.primary">Campuses Directory</Typography>
          <Typography variant="caption" color="text.secondary">Click any row to explore that college's student directory</Typography>
        </Box>
        <AISearchInput
          placeholder="Ask AI or search campuses..."
          context="dashboard"
          onFilterApply={(res) => {
            setSearch(res.search || "");
            setPage(0);
          }}
          sx={{ maxWidth: { sm: 260 }, width: { xs: "100%", sm: "auto" } }}
        />
      </Paper>

      {/* 4. Full-width College Table */}
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "0px", overflowX: "auto" }}>
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
                  <TableCell key={col} align={ci === 6 ? "center" : "left"}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedColleges.map((college, idx) => (
                <TableRow key={college._id} hover
                  onClick={() => nav(`/colleges/${college._id}/students`, { state: { collegeId: college._id, collegeName: college.collegeName } })}
                  sx={{ cursor: "pointer", transition: "background 0.2s" }}>
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
