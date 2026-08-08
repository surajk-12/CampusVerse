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
  Avatar,
  InputAdornment,
  Stack,
} from "@mui/material";
import { Send, CheckCircle, ArrowBack, Search, Verified } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function StudentsTable({ collegeId: propCollegeId, collegeName: propCollegeName }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { collegeId: paramCollegeId } = useParams();
  const collegeId = propCollegeId || paramCollegeId;
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");

  const [collegeName, setCollegeName] = useState(propCollegeName || "");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestsStatus, setRequestsStatus] = useState({}); // { studentId: 'sent' | 'accepted' | 'rejected' }
  const [friends, setFriends] = useState([]); // current user's friend IDs
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
        // Populate friends returns objects; map them to ID strings securely checking for null
        const friendIds = (data.friends || [])
          .map(f => f && typeof f === "object" ? f._id : f)
          .filter(Boolean);
        setFriends(friendIds);
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
          if (req && req.to) {
            // Extract the string ID from the populated user object if it is an object
            const toId = typeof req.to === "object" ? req.to._id : req.to;
            if (toId) {
              if (req.status === "pending") statusMap[toId] = "sent";
              else statusMap[toId] = req.status; // accepted | rejected
            }
          }
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
      await api.post("/notifications", {
        from: user._id,
        to: studentId,
      });

      setRequestsStatus((prev) => ({ ...prev, [studentId]: "sent" }));
    } catch (err) {
      if (err.response?.data?.message === "Friend request already sent!") {
        setRequestsStatus((prev) => ({ ...prev, [studentId]: "sent" }));
        return;
      }

      console.error("Failed to send request", err);
      showToast(err.response?.data?.message || "Failed to send request", "error");
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

  if (loading || !user)
    return (
      <Box sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress size={50} />
      </Box>
    );

  if (error)
    return (
      <Typography color="error" textAlign="center" mt={5}>
        {error}
      </Typography>
    );

  return (
    <Box sx={{ width: "100%", p: { xs: 2, md: 4 } }}>
      {/* Title & Navigation Bar */}
      <Paper
        elevation={1}
        sx={{
          p: 3,
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "0px",
          background: "rgba(30, 41, 59, 0.35)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight="800" color="primary.main">
            Students Directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Campuses / {collegeName || "—"}
          </Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
          <TextField
            placeholder="Search classmates..."
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "10px",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            startIcon={<ArrowBack />}
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: "12px",
              py: 1,
            }}
          >
            Back
          </Button>
        </Stack>
      </Paper>

      {/* Students Table */}
      <TableContainer
        component={Paper}
        elevation={3}
        sx={{
          border: "1px solid rgba(255, 255, 255, 0.08)",
          overflowX: "auto",
          borderRadius: "0px",
        }}
      >
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3, width: "10%" }}>
                Avatar
              </TableCell>
              <TableCell>
                Full Name
              </TableCell>
              <TableCell>
                Course / Specialization
              </TableCell>
              <TableCell sx={{ width: "15%" }}>
                Passing Year
              </TableCell>
              <TableCell sx={{ pr: 3, width: "20%", textAlign: "center" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  No students registered in this college yet.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => {
                const status = requestsStatus[student._id] || "none";
                const isFriend = friends.includes(student._id);
                const isMe = user?._id === student._id;

                return (
                  <TableRow
                    key={student._id}
                    hover={!isFriend}
                    onClick={() => {
                      if (!isMe) navigate(`/profile/${student._id}`);
                    }}
                    sx={{
                      cursor: isMe ? "default" : "pointer",
                      transition: "all 0.2s",
                      position: "relative",
                      // Friend rows get a distinct green glow highlight
                      ...(isFriend && !isMe && {
                        bgcolor: "rgba(16, 185, 129, 0.03) !important",
                        borderLeft: "3px solid rgba(16, 185, 129, 0.5)",
                        "&:hover": {
                          bgcolor: "rgba(16, 185, 129, 0.07) !important",
                          boxShadow: "inset 0 0 20px rgba(16, 185, 129, 0.06)",
                        },
                      }),
                      ...(!isFriend && !isMe && {
                        "&:hover": { bgcolor: "rgba(79, 70, 229, 0.03)" },
                      }),
                    }}
                  >
                    <TableCell sx={{ pl: isFriend ? 2 : 3 }}>
                      <Box sx={{ position: "relative", display: "inline-block" }}>
                        <Avatar
                          src={student.photo ? `${apiBase}/uploads/${student.photo}` : undefined}
                          alt={student.firstName}
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "primary.light",
                            fontSize: 13,
                            ...(isFriend && {
                              border: "1.5px solid rgba(16, 185, 129, 0.6)",
                              boxShadow: "0 0 6px rgba(16, 185, 129, 0.2)",
                            }),
                          }}
                        >
                          {student.firstName?.[0]}
                        </Avatar>
                        {/* Green dot indicator for friends */}
                        {isFriend && (
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 0,
                              right: 0,
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              bgcolor: "#10B981",
                              border: "1.5px solid rgba(15, 23, 42, 0.9)",
                              boxShadow: "0 0 4px rgba(16, 185, 129, 0.5)",
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: isFriend ? "#34D399" : "text.primary" }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <span>{student.firstName} {student.lastName} {isMe && "(You)"}</span>
                        {isFriend && (
                          <Chip
                            icon={<Verified sx={{ fontSize: "14px !important", color: "#10B981 !important" }} />}
                            label="Friend"
                            size="small"
                            sx={{
                              bgcolor: "rgba(16,185,129,0.08)",
                              color: "#10B981",
                              border: "1px solid rgba(16,185,129,0.2)",
                              fontWeight: 700,
                              fontSize: "0.68rem",
                              height: 22,
                              "& .MuiChip-icon": { ml: 0.5 },
                            }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {student.course || "—"} / {student.branch || "—"}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {student.passingYear || "—"}
                    </TableCell>
                    <TableCell sx={{ pr: 3, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                      {isMe ? (
                        <Chip label="Me" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      ) : isFriend ? (
                        <Chip
                          icon={<CheckCircle sx={{ fontSize: "16px !important" }} />}
                          label="Connected"
                          size="small"
                          sx={{
                            bgcolor: "rgba(16,185,129,0.1)",
                            color: "#10B981",
                            border: "1px solid rgba(16,185,129,0.3)",
                            fontWeight: 700,
                            boxShadow: "0 0 8px rgba(16,185,129,0.15)",
                          }}
                        />
                      ) : status === "sent" ? (
                        <Chip icon={<CheckCircle />} label="Request Sent" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                      ) : status === "accepted" ? (
                        <Chip icon={<CheckCircle />} label="Connected" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                      ) : (
                        <IconButton
                          color="primary"
                          onClick={() => handleSendRequest(student._id)}
                          sx={{
                            bgcolor: "rgba(79, 70, 229, 0.06)",
                            "&:hover": { bgcolor: "rgba(79, 70, 229, 0.15)" },
                          }}
                        >
                          <Send sx={{ fontSize: 18 }} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
