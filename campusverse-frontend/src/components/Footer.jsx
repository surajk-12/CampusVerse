import { Box, Container, Typography, Link, Grid } from "@mui/material";

export default function Footer() {
  return (
    <Box
      sx={{
        backgroundColor: "#f5f5f5",
        padding: "20px 0",
        marginTop: "auto",
        borderTop: "1px solid #ddd",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3} justifyContent="space-between">
          {/* Left side - Brand */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              CampusVerse
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connecting students, building communities.
            </Typography>
          </Grid>

          {/* Middle - Links */}
          {/* <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              Quick Links
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Link href="/" underline="hover" color="inherit">
                Home
              </Link>
              <Link href="/login" underline="hover" color="inherit">
                Login
              </Link>
              <Link href="/register" underline="hover" color="inherit">
                Register
              </Link>
              <Link href="/dashboard" underline="hover" color="inherit">
                Dashboard
              </Link>
            </Box>
          </Grid> */}

          {/* Right side - Contact */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              Contact Us
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: support@campusverse.com
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phone: +91 98765 43210
            </Typography>
          </Grid>
        </Grid>

        {/* Bottom copyright */}
        <Box sx={{ textAlign: "center", mt: 3, pt: 2, borderTop: "1px solid #ddd" }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} CampusVerse. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
