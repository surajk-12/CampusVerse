import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography, Paper, Stack } from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";

export default function CollegeRegister() {
  const { registerCollege, loading } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState({
    collegeName: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    address: "",
  });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    const res = await registerCollege(form);
    console.log("Response of res", res);
    
    if (res.ok) {
      setOk("College registered successfully! Redirecting to Student Registration…");
      setTimeout(() => nav("/register/student", { 
        state: { 
          college: res.data.college._id, 
          collegeName: res.data.college.collegeName, 
          collegeLocation: `${res.data.college.city}, ${res.data.college.state}` 
        } 
      }), 800);
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
  };

  return (
    <Box
      sx={{
        bgcolor: "#0B0F19", // Cohesive dark space theme background
        minHeight: "85vh",
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
          top: "15%",
          right: "20%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,70,229,0.1) 0%, rgba(0,0,0,0) 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "15%",
          left: "20%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, rgba(0,0,0,0) 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <Paper
        elevation={4}
        sx={{
          p: { xs: 4, md: 5 },
          maxWidth: 540,
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
          Register College
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.6)", textAlign: "center", mb: 4 }}>
          Add your educational institution to start a new campus directory
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
            <TextField
              label="College Name"
              name="collegeName"
              value={form.collegeName}
              onChange={onChange}
              required
              fullWidth
              variant="outlined"
              sx={textFieldStyles}
            />

            {/* Country + State row */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Country"
                name="country"
                value={form.country}
                onChange={onChange}
                required
                fullWidth
                variant="outlined"
                sx={textFieldStyles}
              />
              <TextField
                label="State"
                name="state"
                value={form.state}
                onChange={onChange}
                required
                fullWidth
                variant="outlined"
                sx={textFieldStyles}
              />
            </Stack>

            {/* City + Pincode row */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="City"
                name="city"
                value={form.city}
                onChange={onChange}
                required
                fullWidth
                variant="outlined"
                sx={textFieldStyles}
              />
              <TextField
                label="Pincode"
                name="pincode"
                value={form.pincode}
                onChange={onChange}
                required
                fullWidth
                variant="outlined"
                sx={textFieldStyles}
              />
            </Stack>

            <TextField
              label="Address"
              name="address"
              value={form.address}
              onChange={onChange}
              required
              fullWidth
              variant="outlined"
              sx={textFieldStyles}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              size="large"
              sx={{
                py: 1.6,
                fontWeight: 700,
                fontSize: "1rem",
                borderRadius: "14px",
                mt: 1,
                background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                boxShadow: "0 10px 20px -5px rgba(79, 70, 229, 0.3)",
                textTransform: "none",
                "&:hover": {
                  background: "linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)",
                },
              }}
            >
              {loading ? "Registering..." : "Register College"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
