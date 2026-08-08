import { useState, useEffect, useRef } from "react";
import {
  Container,
  Typography,
  Button,
  Grid,
  Box,
  Card,
  CardContent,
  Stack,
  Autocomplete,
  TextField,
  CircularProgress,
  Chip,
  InputAdornment,
} from "@mui/material";
import {
  School,
  People,
  Forum,
  ArrowForward,
  Search,
  LocationOn,
  Security,
  Bolt,
  Info,
  ChevronRight,
} from "@mui/icons-material";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";

const LandingPage = () => {
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();
  const selectionRef = useRef(null);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/colleges");
        if (Array.isArray(data)) {
          setColleges(data);
        } else if (Array.isArray(data.colleges)) {
          setColleges(data.colleges);
        } else {
          setColleges([]);
          setError("Could not parse college data.");
        }
      } catch (err) {
        console.error("Failed to fetch colleges", err);
        setError("Failed to load colleges. Please try again later.");
        setColleges([]);
      } finally {
        setLoading(false);
      }
    };
    fetchColleges();
  }, []);

  const handleCollegeSelect = (event, value) => {
    setSelectedCollege(value);
  };

  const handleProceed = () => {
    if (!selectedCollege) {
      showToast("Please select your college first!", "warning");
      return;
    }

    navigate("/register/student", {
      state: {
        college: selectedCollege._id,
        collegeName: selectedCollege.collegeName || selectedCollege.name,
        collegeLocation: selectedCollege.city || selectedCollege.location,
      },
    });
  };

  const handleExploreDirectory = () => {
    if (!selectedCollege) return;
    navigate(`/colleges/${selectedCollege._id}/students`, {
      state: {
        collegeId: selectedCollege._id,
        collegeName: selectedCollege.collegeName || selectedCollege.name,
      },
    });
  };

  const handleScrollToSelection = () => {
    selectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Select some popular/sample colleges to display as fast-click chips
  const popularColleges = colleges.slice(0, 4);

  return (
    <Box
      sx={{
        bgcolor: "#0B0F19", // Deep space dark background
        minHeight: "100vh",
        color: "#ffffff",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ─── Ambient Glow Blobs ─── */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,70,229,0.15) 0%, rgba(0,0,0,0) 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "40%",
          right: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, rgba(0,0,0,0) 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "10%",
          left: "20%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, rgba(0,0,0,0) 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* ─── Hero Section ─── */}
      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 15 }, pb: { xs: 8, md: 12 }, position: "relative", zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "100px",
                px: 2,
                py: 0.75,
                mb: 3,
              }}
            >
              <Chip
                label="New"
                size="small"
                sx={{
                  bgcolor: "primary.main",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  height: 20,
                }}
              />
              <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.8)", fontWeight: 500 }}>
                A modern platform built exclusively for students
              </Typography>
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.8rem", sm: "3.8rem", md: "4.5rem" },
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                mb: 3,
                color: "#FFFFFF",
              }}
            >
              Step into the <br />
              <Box
                component="span"
                sx={{
                  background: "linear-gradient(135deg, #818CF8 0%, #C084FC 50%, #EC4899 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  display: "inline-block",
                }}
              >
                CampusVerse
              </Box>
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: "rgba(241, 245, 249, 0.75)",
                fontWeight: 400,
                lineHeight: 1.6,
                mb: 5,
                maxWidth: "600px",
                fontSize: { xs: "1rem", md: "1.15rem" },
              }}
            >
              Connect with peers, search student directories, request connection approvals, and collaborate within a verified, safe, and exclusive collegiate network.
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={handleScrollToSelection}
                sx={{
                  background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                  boxShadow: "0 10px 20px -5px rgba(79, 70, 229, 0.4)",
                  px: 4,
                  py: 1.8,
                  fontSize: "1rem",
                  borderRadius: "14px",
                  "&:hover": {
                    background: "linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                Find My Campus
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate("/login")}
                sx={{
                  color: "#FFFFFF",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  px: 4,
                  py: 1.8,
                  fontSize: "1rem",
                  borderRadius: "14px",
                  backdropFilter: "blur(10px)",
                  "&:hover": {
                    borderColor: "#FFFFFF",
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                Sign In to Dashboard
              </Button>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: "none", md: "block" } }}>
            {/* Visual Glassmorphic Mockup Cards */}
            <Box sx={{ position: "relative", height: "450px" }}>
              <Box
                sx={{
                  position: "absolute",
                  top: "10%",
                  left: "10%",
                  width: "320px",
                  background: "rgba(30, 41, 59, 0.45)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "24px",
                  p: 3,
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
                  transform: "rotate(-4deg)",
                  zIndex: 2,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "14px",
                      bgcolor: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontWeight: "bold",
                    }}
                  >
                    CV
                  </Box>
                  <Box>
                    <Typography fontWeight="bold" sx={{ color: "#F1F5F9" }}>
                      Active Directory
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
                      Real-time peer matches
                    </Typography>
                  </Box>
                </Stack>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {[
                    { name: "Aarav Mehta", course: "B.Tech CSE", status: "Connected", code: "AC" },
                    { name: "Sneha Reddy", course: "B.Sc Physics", status: "Request Sent", code: "SR" },
                  ].map((peer, i) => (
                    <Box
                      key={i}
                      sx={{
                        p: 1.5,
                        borderRadius: "12px",
                        bgcolor: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: "#F1F5F9" }}>
                          {peer.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.4)" }}>
                          {peer.course}
                        </Typography>
                      </Box>
                      <Chip
                        label={peer.status}
                        size="small"
                        color={peer.status === "Connected" ? "primary" : "secondary"}
                        sx={{ fontSize: "0.65rem", height: "20px", fontWeight: "bold" }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box
                sx={{
                  position: "absolute",
                  bottom: "10%",
                  right: "5%",
                  width: "280px",
                  background: "rgba(15, 23, 42, 0.6)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "24px",
                  p: 3,
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                  transform: "rotate(6deg)",
                  zIndex: 1,
                }}
              >
                <Typography variant="body2" fontWeight="bold" sx={{ color: "#F1F5F9", mb: 1 }}>
                  Verification Secure
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)", display: "block", mb: 2 }}>
                  Every student identity is securely validated via student IDs.
                </Typography>
                <Box
                  sx={{
                    height: "4px",
                    width: "100%",
                    bgcolor: "rgba(255,255,255,0.1)",
                    borderRadius: "2px",
                    overflow: "hidden",
                    mb: 1,
                  }}
                >
                  <Box sx={{ width: "75%", height: "100%", bgcolor: "success.main" }} />
                </Box>
                <Typography variant="caption" sx={{ color: "success.main", fontWeight: "bold" }}>
                  Active Verified Rate: 98%
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* ─── Registered Colleges Search & Directory Interaction ─── */}
      <Box
        ref={selectionRef}
        sx={{
          py: 12,
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          bgcolor: "rgba(10, 15, 30, 0.5)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography
              variant="h6"
              sx={{
                color: "primary.light",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                mb: 1.5,
                fontSize: "0.85rem",
              }}
            >
              Get Connected
            </Typography>
            <Typography
              variant="h3"
              fontWeight="900"
              sx={{
                mb: 2,
                fontSize: { xs: "2rem", md: "2.8rem" },
                background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Find Your Campus Network
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "rgba(255, 255, 255, 0.6)", maxWidth: "600px", mx: "auto" }}
            >
              Search for your college below. Once selected, you can directly explore its student table directory or proceed to register.
            </Typography>
          </Box>

          {/* Central Glassmorphic Search Panel */}
          <Box
            sx={{
              background: "rgba(30, 41, 59, 0.3)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "28px",
              p: { xs: 4, md: 5 },
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            }}
          >
            <Stack spacing={4}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, mb: 1.5 }}>
                  Select or search your university
                </Typography>
                <Autocomplete
                  id="college-search-main"
                  options={colleges}
                  getOptionLabel={(option) =>
                    `${option.collegeName || option.name}, ${option.city || option.location}`
                  }
                  onChange={handleCollegeSelect}
                  value={selectedCollege}
                  loading={loading}
                  PaperComponent={({ children, ...rest }) => (
                    <Box
                      {...rest}
                      sx={{
                        background: "#0F172A",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "14px",
                        mt: 1,
                        overflow: "hidden",
                        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
                      }}
                    >
                      {children}
                    </Box>
                  )}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      background: "rgba(255, 255, 255, 0.04)",
                      borderRadius: "16px",
                      color: "#FFFFFF",
                      "& fieldset": {
                        borderColor: "rgba(255, 255, 255, 0.1)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(129, 140, 248, 0.4)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#818CF8",
                        borderWidth: "1.5px",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "rgba(148, 163, 184, 0.7)",
                    },
                    "& .MuiAutocomplete-popupIndicator": {
                      color: "rgba(148, 163, 184, 0.6)",
                    },
                    "& .MuiAutocomplete-clearIndicator": {
                      color: "rgba(148, 163, 184, 0.6)",
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Start typing university name..."
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: "rgba(255,255,255,0.4)" }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <>
                            {loading ? (
                              <CircularProgress sx={{ color: "#818CF8" }} size={18} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Box>

              {error && (
                <Typography sx={{ color: "#F87171", fontSize: "0.85rem", textAlign: "center" }}>
                  {error}
                </Typography>
              )}

              {/* Selected College Detail Card */}
              {selectedCollege ? (
                <Box
                  sx={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(129, 140, 248, 0.2)",
                    borderRadius: "20px",
                    p: 3,
                    animation: "fadeIn 0.3s ease-out",
                    "@keyframes fadeIn": {
                      from: { opacity: 0, transform: "translateY(10px)" },
                      to: { opacity: 1, transform: "translateY(0)" },
                    },
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={2.5}
                    mb={3}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          p: 1.8,
                          borderRadius: "14px",
                          bgcolor: "rgba(79, 70, 229, 0.15)",
                          color: "primary.light",
                          display: "flex",
                        }}
                      >
                        <School sx={{ fontSize: 28 }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: "#F1F5F9" }}>
                          {selectedCollege.collegeName || selectedCollege.name}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "rgba(255,255,255,0.4)" }}>
                          <LocationOn sx={{ fontSize: 14 }} />
                          <Typography variant="caption">
                            {selectedCollege.city || selectedCollege.location || "—"},{" "}
                            {selectedCollege.state || "—"}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>

                    <Chip
                      label={`${selectedCollege.students?.length || 0} Registered Students`}
                      sx={{
                        bgcolor: "rgba(79, 70, 229, 0.1)",
                        color: "primary.light",
                        border: "1px solid rgba(79, 70, 229, 0.2)",
                        fontWeight: 700,
                        borderRadius: "8px",
                      }}
                    />
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleExploreDirectory}
                        endIcon={<ChevronRight />}
                        sx={{
                          background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                          color: "#ffffff",
                          py: 1.8,
                          borderRadius: "12px",
                          fontWeight: 700,
                          textTransform: "none",
                        }}
                      >
                        Explore Student Directory
                      </Button>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleProceed}
                        sx={{
                          color: "primary.light",
                          borderColor: "rgba(129, 140, 248, 0.3)",
                          py: 1.8,
                          borderRadius: "12px",
                          fontWeight: 700,
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "primary.light",
                            bgcolor: "rgba(129, 140, 248, 0.05)",
                          },
                        }}
                      >
                        Join Campus as Student
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Box
                  sx={{
                    py: 4,
                    textAlign: "center",
                    border: "1px dashed rgba(255,255,255,0.08)",
                    borderRadius: "20px",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)" }}>
                    Choose your university above to check peer directories and start networking.
                  </Typography>
                </Box>
              )}

              {/* Popular quick select tags */}
              {popularColleges.length > 0 && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", display: "block", mb: 1.5 }}
                  >
                    Or select a registered campus quickly:
                  </Typography>
                  <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ gap: 1.5 }}>
                    {popularColleges.map((col) => (
                      <Chip
                        key={col._id}
                        label={col.collegeName || col.name}
                        onClick={() => setSelectedCollege(col)}
                        sx={{
                          bgcolor: "rgba(255,255,255,0.03)",
                          color: "rgba(255,255,255,0.7)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          cursor: "pointer",
                          fontWeight: 600,
                          "&:hover": {
                            bgcolor: "rgba(129, 140, 248, 0.15)",
                            color: "primary.light",
                            borderColor: "rgba(129, 140, 248, 0.3)",
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
                <Button
                  variant="text"
                  onClick={() => navigate("/register")}
                  sx={{
                    color: "secondary.light",
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": { textDecoration: "underline", bgcolor: "transparent" },
                  }}
                >
                  Can't find your college? Register a new college record →
                </Button>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* ─── Platform Features Section ─── */}
      <Container maxWidth="lg" sx={{ py: { xs: 10, md: 14 }, position: "relative", zIndex: 1 }}>
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography
            variant="h6"
            sx={{
              color: "primary.light",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              mb: 1.5,
              fontSize: "0.85rem",
            }}
          >
            Rich Features
          </Typography>
          <Typography variant="h3" fontWeight="900" sx={{ mb: 2, fontSize: { xs: "2rem", md: "2.8rem" } }}>
            Designed for Peer Collaboration
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255, 255, 255, 0.5)", maxWidth: "550px", mx: "auto" }}>
            CampusVerse includes premium tools designed to enhance student connection, communication, and resource discovery.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {[
            {
              icon: <Security sx={{ fontSize: 36 }} />,
              title: "Verified Student Network",
              desc: "Rest easy knowing that only actual students can view profiles or message. Verification secures our space.",
              color: "rgba(79, 70, 229, 0.15)",
              textColor: "primary.light",
            },
            {
              icon: <People sx={{ fontSize: 36 }} />,
              title: "Peer-to-Peer Directory",
              desc: "Instantly discover classmates in specific courses, semesters, or branches. Perfect for project partnerships.",
              color: "rgba(236, 72, 153, 0.15)",
              textColor: "secondary.light",
            },
            {
              icon: <Forum sx={{ fontSize: 36 }} />,
              title: "Centralized Chat Hub",
              desc: "Direct messages allow you to schedule studies, clear doubts, and collaborate on assignments inside the app.",
              color: "rgba(16, 185, 129, 0.15)",
              textColor: "success.light",
            },
          ].map((feat, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Box
                sx={{
                  p: 4.5,
                  height: "100%",
                  bgcolor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "24px",
                  transition: "all 0.3s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    bgcolor: "rgba(255, 255, 255, 0.04)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "16px",
                    bgcolor: feat.color,
                    color: feat.textColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3,
                  }}
                >
                  {feat.icon}
                </Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: "#F1F5F9", mb: 1.5 }}>
                  {feat.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.5)", lineHeight: 1.6 }}>
                  {feat.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default LandingPage;
