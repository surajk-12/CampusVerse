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

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "85vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        position: "relative",
        overflow: "hidden",
        transition: "background-color 0.3s ease",
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
          background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, rgba(0,0,0,0) 70%)",
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
          background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, rgba(0,0,0,0) 70%)",
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
          bgcolor: "background.paper",
          backdropFilter: "blur(20px)",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.1)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Typography
          variant="h4"
          fontWeight="900"
          mb={1}
          textAlign="center"
          color="text.primary"
          sx={{
            letterSpacing: "-0.02em",
          }}
        >
          Welcome Back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mb: 4 }}>
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
            />
            <TextField
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              variant="outlined"
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
                ":hover": {
                  background: "linear-gradient(135deg, #4338CA 0%, #4F46E5 100%)",
                },
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Stack>
        </form>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Don't have a student account?{" "}
            <Link
              to="/register"
              style={{
                color: "#6366F1",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Register here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
