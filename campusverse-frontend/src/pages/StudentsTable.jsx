import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Paper,
  IconButton,
  CircularProgress,
  Chip,
  Button,
  TextField,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function StudentsTable({ collegeId: propCollegeId, collegeName: propCollegeName }) {
  const { user } = useAuth();
  const { collegeId: paramCollegeId } = useParams();
  const collegeId = propCollegeId || paramCollegeId;

  const [collegeName, setCollegeName] = useState(propCollegeName || "");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestsStatus, setRequestsStatus] = useState({}); // { studentId: 'sent' | 'accepted' | 'rejected' }
  const [friends, setFriends] = useState([]); // current user's friends
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Fetch students
  useEffect(() => {
    if (!collegeId) return;

    const fetchStudents = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/colleges/${collegeId}/students`);
        setStudents(data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [collegeId]);

  // Fetch college name if not provided
  useEffect(() => {
    if (!collegeId || collegeName) return;

    const fetchCollege = async () => {
      try {
        const { data } = await api.get(`/colleges/${collegeId}`);
        setCollegeName(data.collegeName || "");
      } catch (err) {
        console.error("Failed to fetch college info", err);
      }
    };

    fetchCollege();
  }, [collegeId, collegeName]);

  // Fetch current user's friends
  useEffect(() => {
    if (!user?._id) return;

    const fetchFriends = async () => {
      try {
        const { data } = await api.get(`/users/${user._id}`);
        setFriends(data.friends || []);
      } catch (err) {
        console.error("Failed to fetch friends", err);
      }
    };

    fetchFriends();
  }, [user?._id]);

  // Fetch existing requests sent by logged-in user
  useEffect(() => {
    if (!user?._id) return;

    const fetchSentRequests = async () => {
      try {
        const { data } = await api.get(`/notifications/sent-by/${user._id}`);
        const statusMap = {};
        data.forEach(req => {
          if (req.status === "pending") statusMap[req.to] = "sent";
          else statusMap[req.to] = req.status; // accepted | rejected
        });
        setRequestsStatus(statusMap);
      } catch (err) {
        console.error("Failed to fetch sent requests", err);
      }
    };

    fetchSentRequests();
  }, [user?._id]);

  // Handle sending request
  const handleSendRequest = async (studentId) => {
    if (!user?._id) return;

    try {
      const { data } = await api.post("/notifications", {
        from: user._id,
        to: studentId,
      });

      setRequestsStatus((prev) => ({ ...prev, [studentId]: "sent" }));
    } catch (err) {
      // If request already exists, just mark as sent
      if (err.response?.data?.message === "Friend request already sent!") {
        setRequestsStatus((prev) => ({ ...prev, [studentId]: "sent" }));
        return;
      }

      console.error("Failed to send request", err);
      alert(err.response?.data?.message || "Failed to send request");
    }
  };


  // Filter students based on search
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const course = (student.course || "").toLowerCase();
    const branch = (student.branch || "").toLowerCase();
    const passingYear = (student.passingYear || "").toString().toLowerCase();

    return (
      fullName.includes(search.toLowerCase()) ||
      course.includes(search.toLowerCase()) ||
      branch.includes(search.toLowerCase()) ||
      passingYear.includes(search.toLowerCase())
    );
  });

  if (loading)
    return (
      <Box sx={{ mt: 5, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Typography color="error" textAlign="center" mt={5}>
        {error}
      </Typography>
    );

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      {/* Back Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          color="primary"
          onClick={() => navigate(-1)}
          sx={{
            mb: 2,
            borderRadius: "20px",
            textTransform: "none",
            fontWeight: "bold",
            px: 2,
          }}
        >
          Back
        </Button>
      </Box>

      {/* Title + Search */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" fontWeight="bold" color="primary.main">
          Students of {collegeName || "—"}
        </Typography>
        <TextField
          label="Search Students"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      {/* Students Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 4, borderRadius: 1 }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "primary.light" }}>
              <TableCell sx={{ fontWeight: "bold", color: "#fff", textAlign: "center", width: "8%" }}>
                S.No.
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff", textAlign: "center", width: "25%" }}>
                Name
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff", textAlign: "center", width: "25%" }}>
                Course / Branch
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff", textAlign: "center", width: "20%" }}>
                Passing Year
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff", textAlign: "center", width: "22%" }}>
                Request Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student, index) => {
              const status = requestsStatus[student._id] || "none";
              const isFriend = friends.includes(student._id);

              return (
                <TableRow
                  key={student._id}
                  hover
                  sx={{ "&:hover": { bgcolor: "primary.light", color: "#fff" } }}
                >
                  <TableCell sx={{ textAlign: "center" }}>{index + 1}</TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    {student.course || ""} / {student.branch || ""}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>{student.passingYear || "—"}</TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    {isFriend ? (
                      <Chip icon={<CheckCircleIcon />} label="Friends" color="primary" variant="outlined" />
                    ) : status === "sent" ? (
                      <Chip icon={<CheckCircleIcon />} label="Sent" color="success" variant="outlined" />
                    ) : status === "accepted" ? (
                      <Chip icon={<CheckCircleIcon />} label="Accepted" color="primary" variant="outlined" />
                    ) : (
                      <IconButton color="primary" onClick={() => handleSendRequest(student._id)}>
                        <SendIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
