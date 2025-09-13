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
    console.log("Respone os res", res);
    
    if (res.ok) {
      setOk("College registered successfully! Redirecting to Student Registration…");
      // Redirect to student register and pass college info
      setTimeout(() => nav("/register/student", { state: { college: res.data.college._id, collegeName: res.data.college.collegeName, collegeLocation: `${res.data.college.city}, ${res.data.college.state}` } }), 800);
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
      maxWidth: 500,
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
      College Registration
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
        <TextField
          placeholder="College Name"
          name="collegeName"
          value={form.collegeName}
          onChange={onChange}
          required
          fullWidth
          size="small"
          variant="outlined"
        />

        {/* Country + State row */}
        <Stack direction="row" spacing={2}>
          <TextField
            placeholder="Country"
            name="country"
            value={form.country}
            onChange={onChange}
            required
            fullWidth
            size="small"
            variant="outlined"
          />
          <TextField
            placeholder="State"
            name="state"
            value={form.state}
            onChange={onChange}
            required
            fullWidth
            size="small"
            variant="outlined"
          />
        </Stack>

        {/* City + Pincode row */}
        <Stack direction="row" spacing={2}>
          <TextField
            placeholder="City"
            name="city"
            value={form.city}
            onChange={onChange}
            required
            fullWidth
            size="small"
            variant="outlined"
          />
          <TextField
            placeholder="Pincode"
            name="pincode"
            value={form.pincode}
            onChange={onChange}
            required
            fullWidth
            size="small"
            variant="outlined"
          />
        </Stack>

        <TextField
          placeholder="Address"
          name="address"
          value={form.address}
          onChange={onChange}
          required
          fullWidth
          size="small"
          variant="outlined"
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          size="medium"
          sx={{ mt: 2, py: 1.3, fontWeight: "bold" }}
        >
          {loading ? "Registering..." : "Register College"}
        </Button>
      </Stack>
    </form>
  </Paper>
</Box>

  );
}
