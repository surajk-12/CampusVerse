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
          p: 5,
          width: "100%",
          maxWidth: 450,
          borderRadius: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          mb={3}
          color="primary.main"
          textAlign="center"
        >
          Login
        </Typography>

        {err && (
          <Typography variant="body2" color="error" mb={2} textAlign="center">
            {err}
          </Typography>
        )}

        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              size="small"
              variant="outlined"
            />
            <TextField
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              size="small"
              variant="outlined"
            />
            <Button
              type="submit"
              variant="contained"
              size="medium"
              disabled={loading}
              sx={{ fontWeight: "bold", py: 1.3 }}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Stack>
        </form>

        <Typography mt={3} variant="body2" textAlign="center">
          New here?{" "}
          <Link to="/register" style={{ textDecoration: "none", color: "#1976d2" }}>
            Create an account
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
