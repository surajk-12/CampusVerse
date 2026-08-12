import React, { useEffect, useState } from "react";
import AISearchInput from "../components/AISearchInput.jsx";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  Avatar,
  IconButton,
  Divider,
  CircularProgress,
  Grid,
  Chip,
  Modal,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  School,
  CloudUpload,
  Download,
  Search,
  Close,
  InsertDriveFile,
  LocalOffer,
  CalendarMonth,
  Person,
  SmartToy,
  Verified,
  Delete,
  Flag,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../api/axios.js";
import useRole from "../hooks/useRole.js";

const DEPARTMENTS = [
  "All",
  "Computer Science",
  "Information Technology",
  "Mechanical",
  "Electrical",
  "Electronics",
  "Civil",
  "Management",
  "Science & Arts",
];

const YEARS = ["All", "1st Year", "2nd Year", "3rd Year", "4th Year", "Postgrad"];

const FORM_DEPARTMENTS = DEPARTMENTS.filter((d) => d !== "All");
const FORM_YEARS = YEARS.filter((y) => y !== "All");

export default function NotesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isSuperAdmin, isCollegeAdmin, isModerator, canModerate, sameCollege } = useRole();
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api");

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");

  // Upload Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch Resources
  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/resources", {
        params: {
          search: searchQuery,
          department: selectedDept,
          year: selectedYear,
        },
      });
      setResources(data);
    } catch (err) {
      console.error("Error fetching resources:", err);
      showToast("Failed to load academic notes.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const aiSearchVal = queryParams.get("aiSearch");
    if (aiSearchVal) {
      setSearchQuery(aiSearchVal);
    }
  }, []);

  useEffect(() => {
    const handleAIFilter = (e) => {
      if (e.detail?.searchString) {
        setSearchQuery(e.detail.searchString);
      }
    };
    window.addEventListener("ai-filter", handleAIFilter);
    return () => window.removeEventListener("ai-filter", handleAIFilter);
  }, []);

  useEffect(() => {
    fetchResources();
  }, [selectedDept, selectedYear, searchQuery]);

  // File Picker Change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showToast("Maximum file size is 10MB.", "warning");
        return;
      }
      setSelectedFile(file);
    }
  };

  // Upload Submit
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!title || !subjectCode || !department || !year || !selectedFile) {
      showToast("Please fill in all required fields.", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("subjectCode", subjectCode);
      formData.append("department", department);
      formData.append("year", year);
      formData.append("description", description);
      formData.append("tags", tagsText);
      formData.append("file", selectedFile);

      const { data } = await api.post("/resources", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResources((prev) => [data, ...prev]);
      showToast("Academic document shared successfully!", "success");

      // Reset & Close
      setTitle("");
      setSubjectCode("");
      setDepartment("");
      setYear("");
      setDescription("");
      setTagsText("");
      setSelectedFile(null);
      setModalOpen(false);
    } catch (err) {
      console.error("Error uploading notes:", err);
      showToast(err.response?.data?.message || "Failed to upload document notes.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger File Download via Axios blob stream
  const handleDownload = async (resourceId, filename) => {
    try {
      showToast("Preparing document download...", "info");
      const response = await api.get(`/resources/${resourceId}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast("Download completed successfully!", "success");
    } catch (err) {
      console.error("Download error:", err);
      showToast("Could not download file.", "error");
    }
  };

  // Delete Resource Note
  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm("Are you sure you want to delete this resource note? This cannot be undone.")) return;
    try {
      await api.delete(`/resources/${resourceId}`);
      showToast("Academic document deleted successfully.", "success");
      setResources((prev) => prev.filter((r) => r._id !== resourceId));
    } catch (err) {
      console.error("Error deleting notes:", err);
      showToast(err.response?.data?.message || "Failed to delete notes.", "error");
    }
  };

  // Toggle Verify Resource
  const handleVerifyResource = async (resourceId) => {
    try {
      const { data } = await api.put(`/resources/${resourceId}/verify`);
      showToast(data.message, "success");
      setResources((prev) =>
        prev.map((r) => (r._id === resourceId ? { ...r, isVerified: data.isVerified } : r))
      );
    } catch (err) {
      console.error("Error verifying notes:", err);
      showToast(err.response?.data?.message || "Failed to verify note document.", "error");
    }
  };

  // Report Resource
  const handleReportResource = async (resourceId) => {
    try {
      await api.post(`/resources/${resourceId}/report`);
      showToast("Academic resource reported for review.", "success");
    } catch (err) {
      console.error("Error reporting notes:", err);
      showToast(err.response?.data?.message || "You have already reported this document.", "info");
    }
  };

  // Format File Size
  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };



  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      {/* Header section */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight={900} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <School sx={{ color: "primary.main" }} />
            NotesVerse
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Access and download shared lecture notes, syllabus sheets, and previous fests question papers
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => setModalOpen(true)}
          sx={{
            borderRadius: "8px",
            height: 32,
            px: 3,
            fontWeight: 700,
            textTransform: "none",
            background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
            boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)",
            fontSize: "0.78rem",
          }}
        >
          Upload Notes
        </Button>
      </Stack>



      {/* Filter toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "0px",
          background: "rgba(30, 41, 59, 0.15)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexGrow: 1 }}>
          <AISearchInput
            placeholder="Ask AI or search notes..."
            context="notes"
            onFilterApply={(res) => {
              setSearchQuery(res.search || "");
              if (res.department) {
                const exists = DEPARTMENTS.some(d => d.toLowerCase() === res.department.toLowerCase());
                if (exists) {
                  setSelectedDept(DEPARTMENTS.find(d => d.toLowerCase() === res.department.toLowerCase()));
                }
              }
              if (res.year) {
                const exists = YEARS.some(y => y.toLowerCase() === res.year.toLowerCase());
                if (exists) {
                  setSelectedYear(YEARS.find(y => y.toLowerCase() === res.year.toLowerCase()));
                }
              }
            }}
            sx={{ minWidth: { sm: 260 } }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={selectedDept}
              label="Department"
              onChange={(e) => setSelectedDept(e.target.value)}
              sx={{
                borderRadius: "8px",
                bgcolor: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.06)",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              }}
            >
              {DEPARTMENTS.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Academic Year</InputLabel>
            <Select
              value={selectedYear}
              label="Academic Year"
              onChange={(e) => setSelectedYear(e.target.value)}
              sx={{
                borderRadius: "8px",
                bgcolor: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.06)",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              }}
            >
              {YEARS.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Button
          variant="outlined"
          size="small"
          onClick={fetchResources}
          sx={{
            borderRadius: "8px",
            height: 32,
            px: 2.2,
            fontWeight: 700,
            textTransform: "none",
            fontSize: "0.72rem",
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          Refresh Repository
        </Button>
      </Paper>

      {/* Grid of Shared Files */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={45} />
        </Box>
      ) : resources.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(30, 41, 59, 0.15)",
            borderRadius: "0px",
          }}
        >
          <InsertDriveFile sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
          <Typography variant="body1" fontWeight={750} color="text.secondary">
            No document resources found in the repository yet.
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Be the first to upload and share study assets with classmates!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {resources.map((res) => {
            const uploaderName = res.uploadedBy
              ? `${res.uploadedBy.firstName} ${res.uploadedBy.lastName}`
              : "Uploader";
            const uploaderPhotoUrl = res.uploadedBy?.photo
              ? `${apiBase.replace("/api", "")}/uploads/${res.uploadedBy.photo}`
              : undefined;

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={res._id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "0px",
                    background: "rgba(30, 41, 59, 0.2)",
                    backdropFilter: "blur(8px)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.15)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
                    },
                  }}
                >
                  <Box>
                    {/* Top Row: Course Code & Year */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={res.subjectCode}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            bgcolor: "rgba(79, 70, 229, 0.12)",
                            color: "#818CF8",
                            border: "1px solid rgba(79, 70, 229, 0.2)",
                            borderRadius: "4px",
                          }}
                        />
                        {res.isVerified && (
                          <Chip
                            icon={<Verified sx={{ fontSize: "11px !important", color: "#10B981" }} />}
                            label="Verified"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.65rem",
                              fontWeight: 800,
                              bgcolor: "rgba(16, 185, 129, 0.12)",
                              color: "#10B981",
                              border: "1px solid rgba(16, 185, 129, 0.25)",
                              borderRadius: "4px",
                            }}
                          />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {res.year}
                      </Typography>
                    </Stack>

                    {/* Title */}
                    <Typography variant="subtitle2" fontWeight={850} color="text.primary" noWrap sx={{ mb: 0.8 }}>
                      {res.title}
                    </Typography>

                    {/* Description */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", fontSize: "0.78rem", lineHeight: 1.4 }}>
                      {res.description || "No description provided."}
                    </Typography>

                    {/* Meta info: File type / size / department */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <InsertDriveFile sx={{ fontSize: 16, color: "primary.main" }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        {res.fileType?.toUpperCase() || "DOC"} · {formatBytes(res.fileSize)}
                      </Typography>
                    </Stack>

                    {/* Tags */}
                    {res.tags?.length > 0 && (
                      <Stack direction="row" spacing={0.6} flexWrap="wrap" sx={{ mb: 2 }}>
                        {res.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            icon={<LocalOffer sx={{ fontSize: "10px !important" }} />}
                            sx={{
                              height: 18,
                              fontSize: "0.58rem",
                              borderRadius: "4px",
                              bgcolor: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                            }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>

                  <Box>
                    <Divider sx={{ mb: 2, borderColor: "rgba(255, 255, 255, 0.06)" }} />

                    {/* Footer Row: Uploader Detail & Actions */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ maxWidth: "60%" }}>
                        <Avatar src={uploaderPhotoUrl} sx={{ width: 24, height: 24, bgcolor: "rgba(255,255,255,0.08)", fontSize: 11 }}>
                          {uploaderName[0]}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="caption" color="text.primary" fontWeight={700} noWrap display="block">
                            {uploaderName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.62rem", display: "block" }}>
                            {new Date(res.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={0.8} alignItems="center">
                        {/* Verify button */}
                        {canModerate && sameCollege(res.college) && (
                          <Tooltip title={res.isVerified ? "Remove Verification" : "Verify Document"}>
                            <IconButton
                              size="small"
                              onClick={() => handleVerifyResource(res._id)}
                              sx={{
                                color: res.isVerified ? "#10B981" : "text.secondary",
                                bgcolor: res.isVerified ? "rgba(16, 185, 129, 0.08)" : "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                "&:hover": { bgcolor: "rgba(16, 185, 129, 0.15)" },
                              }}
                            >
                              <Verified sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Report button */}
                        {res.uploadedBy?._id !== user._id && (
                          <Tooltip title="Report Document">
                            <IconButton
                              size="small"
                              onClick={() => handleReportResource(res._id)}
                              sx={{
                                color: "warning.main",
                                bgcolor: "rgba(245, 158, 11, 0.05)",
                                border: "1px solid rgba(245, 158, 11, 0.15)",
                                "&:hover": { bgcolor: "rgba(245, 158, 11, 0.15)" },
                              }}
                            >
                              <Flag sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Delete button */}
                        {(res.uploadedBy?._id === user._id ||
                          isSuperAdmin ||
                          (canModerate && sameCollege(res.college))) && (
                          <Tooltip title="Delete Document">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteResource(res._id)}
                              sx={{
                                color: "error.main",
                                bgcolor: "rgba(244, 63, 94, 0.05)",
                                border: "1px solid rgba(244, 63, 94, 0.15)",
                                "&:hover": { bgcolor: "rgba(244, 63, 94, 0.15)" },
                              }}
                            >
                              <Delete sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Download sx={{ fontSize: 12 }} />}
                          onClick={() => handleDownload(res._id, res.fileName)}
                          sx={{
                            borderRadius: "8px",
                            height: 28,
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            px: 1.8,
                            background: "linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)",
                          }}
                        >
                          Download
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Upload Notes Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} closeAfterTransition sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box
          component="form"
          onSubmit={handleUploadSubmit}
          sx={{
            width: "90%",
            maxWidth: 500,
            bgcolor: "#0F172A",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "0px",
            p: { xs: 2.5, sm: 4 },
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            outline: "none",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={900} color="text.primary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CloudUpload sx={{ color: "primary.main" }} />
              Upload Academic Notes
            </Typography>
            <IconButton onClick={() => setModalOpen(false)} size="small">
              <Close />
            </IconButton>
          </Stack>

          <Stack spacing={2.5}>
            <TextField
              label="Document Title"
              placeholder="e.g. Lecture 4: Binary Trees Notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              variant="outlined"
              size="small"
            />

            <TextField
              label="Course / Subject Code"
              placeholder="e.g. CS101"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              required
              fullWidth
              variant="outlined"
              size="small"
              inputProps={{ style: { textTransform: "uppercase" } }}
            />

            <FormControl fullWidth size="small" required>
              <InputLabel>Department</InputLabel>
              <Select
                value={department}
                label="Department"
                onChange={(e) => setDepartment(e.target.value)}
              >
                {FORM_DEPARTMENTS.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" required>
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={year}
                label="Academic Year"
                onChange={(e) => setYear(e.target.value)}
              >
                {FORM_YEARS.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Tags (Comma separated)"
              placeholder="e.g. midsem, trees, dsa"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            />

            <TextField
              label="Short Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              variant="outlined"
              size="small"
            />

            {/* Custom file selector input */}
            <Box>
              <input
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*"
                style={{ display: "none" }}
                id="notesverse-file-uploader"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="notesverse-file-uploader">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<InsertDriveFile />}
                  sx={{
                    borderRadius: "8px",
                    height: 38,
                    textTransform: "none",
                    borderColor: "rgba(255,255,255,0.12)",
                    color: "text.secondary",
                  }}
                >
                  {selectedFile ? selectedFile.name : "Select Document File (Max 10MB)"}
                </Button>
              </label>
            </Box>

            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 700,
                height: 38,
                background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                boxShadow: "0 4px 15px rgba(79, 70, 229, 0.3)",
              }}
            >
              {submitting ? "Uploading..." : "Publish Resource"}
            </Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}
