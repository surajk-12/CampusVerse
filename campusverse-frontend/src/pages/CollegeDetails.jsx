import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Chip,
  Button,
  Divider,
} from "@mui/material";
import { ArrowBack, School } from "@mui/icons-material";
import api from "../api/axios.js";

export default function CollegeDetails() {
  const { collegeId } = useParams();
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace("/api", "");
  const navigate = useNavigate();

  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCollege() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get(`/colleges/${collegeId}`);
        setCollege(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCollege();
  }, [collegeId]);

  if (loading) return <CircularProgress sx={{ mt: 5, mx: "auto", display: "block" }} />;
  if (error)
    return (
      <Typography color="error" textAlign="center" mt={5}>
        {error}
      </Typography>
    );
  if (!college) return null;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{ borderRadius: "12px" }}
        >
          Back
        </Button>
      </Box>

      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 4, md: 6 }, 
          borderRadius: "24px",
          border: "1px solid rgba(226, 232, 240, 0.8)",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
          <Box sx={{ p: 2, borderRadius: "24px", bgcolor: "rgba(79, 70, 229, 0.08)", mb: 2, display: "inline-flex" }}>
            <School sx={{ fontSize: 48, color: "primary.main" }} />
          </Box>
          <Typography variant="h4" fontWeight="800" textAlign="center" mb={1}>
            {college.collegeName || college.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" fontWeight={500} textAlign="center">
            {college.city || college.location}, {college.state}, {college.country}
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight="700" sx={{ textTransform: "uppercase", mb: 1.5 }}>
            Address details
          </Typography>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2.5, 
              borderRadius: "16px", 
              bgcolor: "grey.50", 
              borderColor: "rgba(226, 232, 240, 0.8)" 
            }}
          >
            <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6, fontWeight: 500 }}>
              {college.address || "No address provided"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
              Pincode: {college.pincode}
            </Typography>
          </Paper>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight="700" sx={{ textTransform: "uppercase", mb: 2 }}>
            Campus Gallery
          </Typography>
          <Grid container spacing={3}>
            {(college.photos && college.photos.length > 0 ? college.photos : [null]).map(
              (photo, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  {photo ? (
                    <Box
                      component="img"
                      src={`${apiBase}/${photo.replace(/^\/?/, "")}`}
                      alt={`College Photo ${idx + 1}`}
                      sx={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        borderRadius: "16px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: "100%",
                        height: 180,
                        bgcolor: "grey.100",
                        borderRadius: "16px",
                        border: "1px dashed rgba(226, 232, 240, 1)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "text.secondary",
                      }}
                    >
                      <Typography variant="caption" fontWeight="500">No photos uploaded</Typography>
                    </Box>
                  )}
                </Grid>
              )
            )}
          </Grid>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1.5, py: 2 }}>
          <Typography variant="body2" fontWeight="700" color="text.secondary" sx={{ textTransform: "uppercase" }}>
            Registered Students:
          </Typography>
          <Chip
            label={college.students?.length ?? 0}
            color="primary"
            sx={{ fontWeight: "800", fontSize: "0.95rem", py: 1.8, px: 1, borderRadius: "10px" }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
