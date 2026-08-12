import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  Typography,
  Paper,
  FormControl,
  Stack,
  InputLabel,
  Grid,
  Checkbox,
  FormControlLabel,
  Alert,
  LinearProgress,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import {
  CloudUpload,
  PersonAdd,
  CheckCircle,
  VerifiedUser,
  Security,
  Storefront,
  School,
} from "@mui/icons-material";
import api from "../api/axios.js";

export default function Register() {
  const { register, loading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  // Get college info from search widget
  const collegeInfo = location.state || {};

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    gender: "Male",
    course: "",
    branch: "",
    passingYear: "",
    college: collegeInfo.college || "",
    collegeName: collegeInfo.collegeName || "",
    collegeLocation: collegeInfo.collegeLocation || "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [collegeIdCard, setCollegeIdCard] = useState(null);

  // Password strength states
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-4
  const [passwordFeedback, setPasswordFeedback] = useState("");

  // Colleges for autocomplete selection (fallback if not pre-selected)
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);

  useEffect(() => {
    if (!form.college) {
      const fetchColleges = async () => {
        try {
          setCollegesLoading(true);
          const { data } = await api.get("/colleges");
          if (Array.isArray(data)) setColleges(data);
          else if (Array.isArray(data.colleges)) setColleges(data.colleges);
        } catch (err) {
          console.error("Failed to fetch colleges for registration form", err);
        } finally {
          setCollegesLoading(false);
        }
      };
      fetchColleges();
    }
  }, [form.college]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Evaluate password strength
  useEffect(() => {
    const pw = form.password;
    if (!pw) {
      setPasswordStrength(0);
      setPasswordFeedback("");
      return;
    }

    let score = 0;
    if (pw.length >= 6) score += 1;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;

    setPasswordStrength(score);

    if (score <= 1) {
      setPasswordFeedback("Weak (Include at least 6 characters)");
    } else if (score <= 3) {
      setPasswordFeedback("Medium (Mix upper/lower case & digits)");
    } else {
      setPasswordFeedback("Strong Password!");
    }
  }, [form.password]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!form.college) {
      setErr("Please select your college first!");
      return;
    }

    if (form.password !== confirmPassword) {
      setErr("Passwords do not match!");
      return;
    }

    if (!agreeTerms) {
      setErr("You must agree to the Terms of Service & Privacy Policy.");
      return;
    }

    if (!photo || !collegeIdCard) {
      setErr("Please upload both your live photo and your college ID card.");
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("photo", photo);
    fd.append("collegeIdCard", collegeIdCard);

    const res = await register(fd);
    console.log("Register response:", res);

    if (res.ok) {
      setOk("Registration successful! Entering Dashboard…");
      setTimeout(() => nav("/dashboard"), 800);
    } else {
      setErr(res.message);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "error";
    if (passwordStrength <= 3) return "warning";
    return "success";
  };

  const textFieldStyles = {
    "& .MuiOutlinedInput-root": {
      background: "rgba(255, 255, 255, 0.04)",
      borderRadius: "14px",
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
      color: "rgba(255, 255, 255, 0.5)",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#818CF8",
    },
    "& .MuiOutlinedInput-input.Mui-disabled": {
      WebkitTextFillColor: "rgba(255, 255, 255, 0.4)",
    },
  };

  const selectStyles = {
    ...textFieldStyles,
    "& .MuiSelect-icon": {
      color: "rgba(255, 255, 255, 0.5)",
    },
  };

  return (
    <Box
      sx={{
        bgcolor: "#0B0F19", // Cohesive dark space theme background
        minHeight: "100vh",
        display: "flex",
        alignItems: "stretch",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background ambient blobs */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(0,0,0,0) 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <Grid container sx={{ position: "relative", zIndex: 1 }}>
        {/* Left Side: Product Illustration & Benefits */}
        <Grid
          item
          xs={12}
          md={5}
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "center",
            p: 6,
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)",
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <Box sx={{ maxWidth: "420px", mx: "auto" }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                mb: 4,
              }}
            >
              <School sx={{ fontSize: 24 }} />
            </Box>

            <Typography variant="h3" fontWeight={950} sx={{ mb: 2, letterSpacing: "-0.03em", color: "#FFFFFF" }}>
              Join the Verse.
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255, 255, 255, 0.65)", mb: 6, lineHeight: 1.6 }}>
              Unlock access to your college's study note archives, peer-to-peer discussions, events, and trading center.
            </Typography>

            <Stack spacing={4}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ p: 1, borderRadius: "8px", bgcolor: "rgba(16, 185, 129, 0.15)", color: "#10B981", mt: 0.5 }}>
                  <VerifiedUser sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="#F1F5F9">Verified Student Directory</Typography>
                  <Typography variant="caption" color="text.secondary">Every account is checked to preserve a secure campus workspace.</Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ p: 1, borderRadius: "8px", bgcolor: "rgba(99, 102, 241, 0.15)", color: "#818CF8", mt: 0.5 }}>
                  <Security sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="#F1F5F9">Role-Based Gated Permissions</Typography>
                  <Typography variant="caption" color="text.secondary">Moderation controls keep files clean and Q&As accurate.</Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ p: 1, borderRadius: "8px", bgcolor: "rgba(236, 72, 153, 0.15)", color: "#F472B6", mt: 0.5 }}>
                  <Storefront sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="#F1F5F9">Campus Marketplace & Events</Typography>
                  <Typography variant="caption" color="text.secondary">Find local events, trade text books, and stay connected.</Typography>
                </Box>
              </Stack>
            </Stack>

            <Box sx={{ mt: 8, pt: 4, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={750} display="block" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", mb: 1 }}>
                Trust Indicators
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">
                CampusVerse uses military-grade asset upload streams and cryptographic passwords to shield college records.
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Right Side: Registration Form */}
        <Grid
          item
          xs={12}
          md={7}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 3, sm: 6 },
            overflowY: "auto",
            maxHeight: "100vh",
          }}
        >
          <Box sx={{ maxWidth: "580px", width: "100%" }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, md: 5 },
                borderRadius: "28px",
                background: "rgba(30, 41, 59, 0.25)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
              }}
            >
              <Typography variant="h4" fontWeight={950} sx={{ mb: 1, letterSpacing: "-0.02em", color: "#FFFFFF" }}>
                Create Student Account
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.6)", mb: 4 }}>
                Fill out the application below to connect to your college directory.
              </Typography>

              {err && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: "12px", bgcolor: "rgba(239, 68, 68, 0.08)", color: "#F87171", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                  {err}
                </Alert>
              )}
              {ok && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: "12px", bgcolor: "rgba(16, 185, 129, 0.08)", color: "#34D399", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  {ok}
                </Alert>
              )}

              <form onSubmit={onSubmit}>
                <Stack spacing={2.5}>
                  {/* Full Name */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="First Name"
                      name="firstName"
                      value={form.firstName}
                      onChange={onChange}
                      required
                      fullWidth
                      variant="outlined"
                      sx={textFieldStyles}
                    />
                    <TextField
                      label="Last Name"
                      name="lastName"
                      value={form.lastName}
                      onChange={onChange}
                      required
                      fullWidth
                      variant="outlined"
                      sx={textFieldStyles}
                    />
                  </Stack>

                  {/* Email */}
                  <TextField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange}
                    required
                    fullWidth
                    variant="outlined"
                    sx={textFieldStyles}
                  />

                  {/* Password & Confirm Password */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={onChange}
                        required
                        fullWidth
                        variant="outlined"
                        sx={textFieldStyles}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        fullWidth
                        variant="outlined"
                        sx={textFieldStyles}
                        error={confirmPassword !== "" && form.password !== confirmPassword}
                        helperText={confirmPassword !== "" && form.password !== confirmPassword ? "Passwords do not match" : ""}
                      />
                    </Grid>
                  </Grid>

                  {/* Password Strength Indicator */}
                  {form.password && (
                    <Box sx={{ mt: 1 }}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">Password Strength:</Typography>
                        <Typography variant="caption" color={`${getStrengthColor()}.main`} fontWeight="bold">
                          {passwordFeedback}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(passwordStrength / 4) * 100}
                        color={getStrengthColor()}
                        sx={{ height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,0.06)" }}
                      />
                    </Box>
                  )}

                  {/* Gender & Course */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth sx={selectStyles}>
                        <InputLabel id="gender-select-label" sx={{ color: "rgba(255, 255, 255, 0.5) !important" }}>
                          Gender
                        </InputLabel>
                        <Select
                          labelId="gender-select-label"
                          label="Gender"
                          name="gender"
                          value={form.gender}
                          onChange={onChange}
                          variant="outlined"
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: "#0F172A",
                                border: "1px solid rgba(255,255,255,0.12)",
                                color: "#FFFFFF",
                                "& .MuiMenuItem-root:hover": {
                                  bgcolor: "rgba(129, 140, 248, 0.15)",
                                },
                                "& .Mui-selected": {
                                  bgcolor: "rgba(129, 140, 248, 0.25) !important",
                                },
                              },
                            },
                          }}
                        >
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Course (e.g. B.Tech)"
                        name="course"
                        value={form.course}
                        onChange={onChange}
                        required
                        fullWidth
                        variant="outlined"
                        sx={textFieldStyles}
                      />
                    </Grid>
                  </Grid>

                  {/* Branch & Passing Year */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Branch (e.g. CSE)"
                        name="branch"
                        value={form.branch}
                        onChange={onChange}
                        required
                        fullWidth
                        variant="outlined"
                        sx={textFieldStyles}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Passing Year"
                        name="passingYear"
                        type="number"
                        value={form.passingYear}
                        onChange={onChange}
                        required
                        fullWidth
                        variant="outlined"
                        sx={textFieldStyles}
                      />
                    </Grid>
                  </Grid>

                  {/* College Details (Organization) */}
                  {collegeInfo.college || form.college ? (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="College Name"
                        name="collegeName"
                        value={form.collegeName || "No college chosen"}
                        disabled
                        fullWidth
                        variant="outlined"
                        sx={textFieldStyles}
                      />
                      <TextField
                        label="Location"
                        name="collegeLocation"
                        value={form.collegeLocation || "—"}
                        disabled
                        fullWidth
                        variant="outlined"
                        sx={textFieldStyles}
                      />
                    </Stack>
                  ) : (
                    <Box>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, mb: 1.5 }}>
                        Select Your College
                      </Typography>
                      <Autocomplete
                        options={colleges}
                        getOptionLabel={(option) =>
                          `${option.collegeName || option.name}, ${option.city || option.location}`
                        }
                        loading={collegesLoading}
                        onChange={(event, value) => {
                          setForm((f) => ({
                            ...f,
                            college: value ? value._id : "",
                            collegeName: value ? (value.collegeName || value.name) : "",
                            collegeLocation: value ? `${value.city || value.location}, ${value.state || ""}` : "",
                          }));
                        }}
                        PaperComponent={({ children, ...rest }) => (
                          <Box
                            {...rest}
                            sx={{
                              background: "#0B1120",
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
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Choose your university..."
                            variant="outlined"
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {collegesLoading ? (
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
                  )}

                  {/* Document & Photo Uploads */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
                    <Box flex={1}>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        startIcon={<CloudUpload />}
                        sx={{
                          py: 1.5,
                          borderStyle: "dashed",
                          borderWidth: "1.5px",
                          borderRadius: "14px",
                          color: "rgba(255, 255, 255, 0.7)",
                          borderColor: "rgba(255, 255, 255, 0.2)",
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "rgba(129, 140, 248, 0.5)",
                            background: "rgba(129, 140, 248, 0.05)",
                          },
                        }}
                      >
                        Upload Live Photo
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                        />
                      </Button>
                      {photo && (
                        <Box mt={1.5} display="flex" justifyContent="center">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt="photo preview"
                            style={{
                              width: 100,
                              height: 100,
                              objectFit: "cover",
                              borderRadius: 14,
                              border: "2px solid rgba(255, 255, 255, 0.1)",
                            }}
                          />
                        </Box>
                      )}
                    </Box>

                    <Box flex={1}>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        startIcon={<CloudUpload />}
                        sx={{
                          py: 1.5,
                          borderStyle: "dashed",
                          borderWidth: "1.5px",
                          borderRadius: "14px",
                          color: "rgba(255, 255, 255, 0.7)",
                          borderColor: "rgba(255, 255, 255, 0.2)",
                          textTransform: "none",
                          "&:hover": {
                            borderColor: "rgba(129, 140, 248, 0.5)",
                            background: "rgba(129, 140, 248, 0.05)",
                          },
                        }}
                      >
                        Upload ID Card
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => setCollegeIdCard(e.target.files?.[0] || null)}
                        />
                      </Button>
                      {collegeIdCard && (
                        <Box mt={1.5} display="flex" justifyContent="center">
                          <img
                            src={URL.createObjectURL(collegeIdCard)}
                            alt="id preview"
                            style={{
                              width: 100,
                              height: 100,
                              objectFit: "cover",
                              borderRadius: 14,
                              border: "2px solid rgba(255, 255, 255, 0.1)",
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  </Stack>

                  {/* Terms checkbox */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        sx={{
                          color: "rgba(255,255,255,0.3)",
                          "&.Mui-checked": { color: "#818CF8" },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                        I agree to the Terms of Service & Privacy Policy.
                      </Typography>
                    }
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || !agreeTerms || (form.password !== confirmPassword && confirmPassword !== "")}
                    size="large"
                    startIcon={<PersonAdd />}
                    sx={{
                      py: 1.7,
                      fontWeight: 700,
                      fontSize: "1rem",
                      borderRadius: "14px",
                      mt: 2,
                      background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                      boxShadow: "0 10px 20px -5px rgba(79, 70, 229, 0.3)",
                      textTransform: "none",
                      "&:hover": {
                        background: "linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)",
                      },
                    }}
                  >
                    {loading ? "Registering student account..." : "Submit Student Registration"}
                  </Button>
                </Stack>
              </form>

              <Typography mt={4} variant="body2" textAlign="center" sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{
                    textDecoration: "none",
                    color: "#818CF8",
                    fontWeight: 700,
                  }}
                >
                  Login here
                </Link>
              </Typography>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
