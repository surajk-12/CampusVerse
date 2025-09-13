import { useAuth } from "../context/AuthContext.jsx";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  TablePagination,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/axios.js";

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [colleges, setColleges] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10); // 10 per page

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const { data } = await api.get("/colleges");
        console.log("Fetched colleges:", data);

        if (Array.isArray(data)) setColleges(data);
        else if (Array.isArray(data.colleges)) setColleges(data.colleges);
        else setColleges([]);
      } catch (err) {
        console.error("Failed to fetch colleges", err);
      }
    };
    fetchColleges();
  }, []);

  if (!user) return null;

  // Filtered colleges based on search
  const filteredColleges = colleges.filter(
    (college) =>
      (college.collegeName || college.name)
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (college.city || college.location)
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  // Pagination
  const paginatedColleges = filteredColleges.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => setPage(newPage);

  return (
    <Box sx={{ p: 3 }}>

      <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        color="primary.main"
        sx={{ mb: 3, textAlign: "right" }}
      >
        Colleges List
      </Typography>
        <TextField
          label="Search Colleges"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 4 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "primary.light" }}>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>S.No.</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>College Name</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedColleges.map((college, index) => (
              <TableRow
                key={college._id}
                hover
                sx={{
                  cursor: "pointer",
                  bgcolor: index % 2 === 0 ? "grey.100" : "grey.200",
                  "&:hover": { bgcolor: "primary.light", color: "#fff" },
                }}
                onClick={() =>
                  nav(`/colleges/${college._id}/students`, {
                    state: { collegeId: college._id, collegeName: college.collegeName }
                  })
                }
              >
                <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                <TableCell>{college.collegeName || college.name}</TableCell>
                <TableCell>{college.city || college.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredColleges.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[]}
      />
    </Box>
  );
}
