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
} from "@mui/material";

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
  console.log("form Data", form);


  const [photo, setPhoto] = useState(null);
  const [collegeIdCard, setCollegeIdCard] = useState(null);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!photo || !collegeIdCard) {
      setErr("Please upload both Photo and College ID Card.");
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("photo", photo);
    fd.append("collegeIdCard", collegeIdCard);

    const res = await register(fd);
    console.log("Register response of res", res);

    if (res.ok) {
      setOk("Registration successful! Redirecting…");
      setTimeout(() => nav("/dashboard"), 600);
    } else {
      setErr(res.message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          maxWidth: 550,
          width: "100%",
          borderRadius: 2,
          bgcolor: "#fff",
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          mb={3}
          color="primary.main"
          textAlign="center"
        >
          Create Your Account
        </Typography>

        {err && (
          <Typography color="error" mb={2} textAlign="center">
            {err}
          </Typography>
        )}
        {ok && (
          <Typography color="primary.main" mb={2} textAlign="center">
            {ok}
          </Typography>
        )}

        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            {/* Name */}
            <Box display="flex" gap={1}>
              <TextField
                placeholder="First Name"
                name="firstName"
                value={form.firstName}
                onChange={onChange}
                required
                size="small"
                fullWidth
                variant="outlined"
              />
              <TextField
                placeholder="Last Name"
                name="lastName"
                value={form.lastName}
                onChange={onChange}
                required
                size="small"
                fullWidth
                variant="outlined"
              />
            </Box>

            {/* Email & Password */}
            <TextField
              placeholder="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
              size="small"
              fullWidth
              variant="outlined"
            />
            <TextField
              placeholder="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              required
              size="small"
              fullWidth
              variant="outlined"
            />

            {/* Gender, Course, Branch & Passing Year */}
            <Box display="flex" gap={1}>
              <FormControl fullWidth size="small">
                <Select
                  displayEmpty
                  name="gender"
                  value={form.gender}
                  onChange={onChange}
                  variant="outlined"
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>

              <TextField
                placeholder="Course"
                name="course"
                value={form.course}
                onChange={onChange}
                size="small"
                fullWidth
                variant="outlined"
              />
            </Box>

            <Box display="flex" gap={1}>
              <TextField
                placeholder="Branch"
                name="branch"
                value={form.branch}
                onChange={onChange}
                size="small"
                fullWidth
                variant="outlined"
              />

              <TextField
                placeholder="Passing Year"
                name="passingYear"
                value={form.passingYear}
                onChange={onChange}
                size="small"
                fullWidth
                variant="outlined"
              />
            </Box>


            {/* College Info (Disabled, pre-filled) */}
            <Box display="flex" gap={1}>
              <TextField
                placeholder="College Name"
                name="collegeName"
                value={form.collegeName}
                disabled
                size="small"
                fullWidth
                variant="outlined"
              />
              <TextField
                placeholder="College Location"
                name="collegeLocation"
                value={form.collegeLocation}
                disabled
                size="small"
                fullWidth
                variant="outlined"
              />
            </Box>

            {/* File Uploads */}
            <Box display="flex" gap={1} mt={1}>
              <Box flex={1}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ textTransform: "none" }}
                  size="small"
                >
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  />
                </Button>
                {photo && (
                  <Box mt={1}>
                    <img
                      src={URL.createObjectURL(photo)}
                      alt="photo preview"
                      style={{ width: 80, borderRadius: 6 }}
                    />
                  </Box>
                )}
              </Box>

              <Box flex={1}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ textTransform: "none" }}
                  size="small"
                >
                  Upload College ID
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setCollegeIdCard(e.target.files?.[0] || null)}
                  />
                </Button>
                {collegeIdCard && (
                  <Box mt={1}>
                    <img
                      src={URL.createObjectURL(collegeIdCard)}
                      alt="id preview"
                      style={{ width: 80, borderRadius: 6 }}
                    />
                  </Box>
                )}
              </Box>
            </Box>

            {/* Submit */}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              size="medium"
              sx={{ mt: 2, py: 1.3, fontWeight: "bold" }}
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </Stack>
        </form>

        <Typography mt={3} variant="body2" textAlign="center">
          Already have an account? <Link to="/login">Login</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
