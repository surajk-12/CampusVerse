import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Avatar,
  Chip,
} from "@mui/material";

export default function CollegeDetails() {
  const { collegeId } = useParams();
  const apiBase = import.meta.env.VITE_API_BASE_URL.replace("/api", "");

  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCollege() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${apiBase}/colleges/${collegeId}`);
        if (!res.ok) throw new Error("Failed to fetch college data");
        const data = await res.json();
        setCollege(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCollege();
  }, [apiBase, collegeId]);

  if (loading) return <CircularProgress sx={{ mt: 5, mx: "auto", display: "block" }} />;
  if (error)
    return (
      <Typography color="error" textAlign="center" mt={5}>
        {error}
      </Typography>
    );
  if (!college) return null;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="h4" fontWeight="bold" mb={2} textAlign="center">
          {college.name}
        </Typography>

        <Typography variant="subtitle1" color="text.secondary" mb={1} textAlign="center">
          {college.location}
        </Typography>

        <Typography variant="body1" mb={3} textAlign="center" sx={{ whiteSpace: "pre-line" }}>
          {college.address || "No address provided"}
        </Typography>

        <Typography variant="h6" fontWeight="bold" mb={2}>
          Photos
        </Typography>

        <Grid container spacing={2} mb={4}>
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
                      height: 160,
                      objectFit: "cover",
                      borderRadius: 2,
                      boxShadow: 2,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: 160,
                      bgcolor: "grey.300",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "grey.600",
                      fontStyle: "italic",
                    }}
                  >
                    No photos available
                  </Box>
                )}
              </Grid>
            )
          )}
        </Grid>

        <Box textAlign="center">
          <Typography variant="subtitle1" fontWeight="bold" display="inline" mr={1}>
            Number of Registered Students:
          </Typography>
          <Chip
            label={college.registeredStudents?.length ?? 0}
            color="primary"
            sx={{ fontWeight: "bold", fontSize: "1rem" }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
