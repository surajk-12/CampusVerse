import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const loc = useLocation();
  const redirectTo = loc.state?.from?.pathname || "/dashboard";

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    const res = await login(email, password);
    if (res.ok) nav(redirectTo, { replace: true });
    else setErr(res.message);
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
          top: "20%",
          left: "25%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,70,229,0.15) 0%, rgba(0,0,0,0) 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "20%",
          right: "25%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, rgba(0,0,0,0) 70%)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <Paper
        elevation={4}
        sx={{
          p: { xs: 4, md: 5 },
          width: "100%",
          maxWidth: 440,
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
          Welcome Back
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.6)", textAlign: "center", mb: 4 }}>
          Log in to your CampusVerse student account
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

        <form onSubmit={onSubmit}>
          <Stack spacing={2.5}>
            <TextField
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              variant="outlined"
              sx={textFieldStyles}
            />
            <TextField
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              variant="outlined"
              sx={textFieldStyles}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
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
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Stack>
        </form>

        <Typography mt={4} variant="body2" textAlign="center" sx={{ color: "rgba(255, 255, 255, 0.5)" }}>
          New to CampusVerse?{" "}
          <Link
            to="/register"
            style={{
              textDecoration: "none",
              color: "#818CF8",
              fontWeight: 600,
            }}
          >
            Get started
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
