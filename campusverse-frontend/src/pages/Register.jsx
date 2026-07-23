import { useState } from "react";
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
} from "@mui/material";
import { CloudUpload, PersonAdd } from "@mui/icons-material";

export default function Register() {
  const { register, loading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  // Get college info from CollegeRegister page
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

  const [photo, setPhoto] = useState(null);
  const [collegeIdCard, setCollegeIdCard] = useState(null);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

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
      setTimeout(() => nav("/dashboard"), 600);
    } else {
      setErr(res.message);
    }
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
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background ambient blobs */}
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          left: "15%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,70,229,0.1) 0%, rgba(0,0,0,0) 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "10%",
          right: "15%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(0,0,0,0) 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <Paper
        elevation={4}
        sx={{
          p: { xs: 4, md: 5 },
          maxWidth: 600,
          width: "100%",
          borderRadius: "28px",
          background: "rgba(30, 41, 59, 0.3)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Typography
          variant="h4"
          fontWeight="900"
          mb={1}
          textAlign="center"
          sx={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}
        >
          Create Student Account
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.6)", textAlign: "center", mb: 4 }}>
          Join your college's community on CampusVerse
        </Typography>

        {err && (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              mb: 3,
              bgcolor: "rgba(239, 68, 68, 0.1)",
              borderColor: "rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
            }}
          >
            <Typography variant="body2" sx={{ color: "#F87171", textAlign: "center", fontWeight: "500" }}>
              {err}
            </Typography>
          </Paper>
        )}
        {ok && (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              mb: 3,
              bgcolor: "rgba(16, 185, 129, 0.1)",
              borderColor: "rgba(16, 185, 129, 0.3)",
              borderRadius: "12px",
            }}
          >
            <Typography variant="body2" sx={{ color: "#34D399", textAlign: "center", fontWeight: "500" }}>
              {ok}
            </Typography>
          </Paper>
        )}

        <form onSubmit={onSubmit}>
          <Stack spacing={2.5}>
            {/* Name */}
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

            {/* Email & Password */}
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

            {/* Gender, Course, Branch & Passing Year */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
            </Stack>

            {/* College Info (Disabled, pre-filled) */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="College Name"
                name="collegeName"
                value={form.collegeName}
                disabled
                fullWidth
                variant="outlined"
                sx={textFieldStyles}
              />
              <TextField
                label="College Location"
                name="collegeLocation"
                value={form.collegeLocation}
                disabled
                fullWidth
                variant="outlined"
                sx={textFieldStyles}
              />
            </Stack>

            {/* File Uploads */}
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

            {/* Submit */}
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              size="large"
              startIcon={<PersonAdd />}
              sx={{
                py: 1.6,
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
              {loading ? "Creating Account..." : "Create Account"}
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
              fontWeight: 600,
            }}
          >
            Login here
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
