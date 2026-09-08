import { Box, Container, Typography, Grid, Stack } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";

export default function Footer() {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        color: "text.secondary",
        padding: "50px 0 30px 0",
        marginTop: "auto",
        borderTop: "1px solid",
        borderColor: "divider",
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          {/* Left side - Brand */}
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #4F46E5 0%, #EC4899 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                }}
              >
                <SchoolIcon sx={{ fontSize: 16 }} />
              </Box>
              <Typography
                variant="h6"
                fontWeight="bold"
                color="text.primary"
                sx={{
                  letterSpacing: "-0.01em",
                }}
              >
                CampusVerse
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
              Connecting students across registered universities to build verified peer networks, foster studies, and share experiences.
            </Typography>
          </Grid>

          {/* Middle - Quick info */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: "bold", mb: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Explore Platform
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Join your college, verify your student ID, search details of fellow students, send connection requests, and stay updated in real time.
            </Typography>
          </Grid>

          {/* Right side - Contact */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: "bold", mb: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Contact Support
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Email: support@campusverse.com
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phone: +91 98765 43210
            </Typography>
          </Grid>
        </Grid>

        {/* Bottom copyright */}
        <Box
          sx={{
            textAlign: "center",
            mt: 5,
            pt: 3,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
            © {new Date().getFullYear()} CampusVerse. All rights reserved. Built for modern student directories.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
