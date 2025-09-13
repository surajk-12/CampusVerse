import React from "react";
import { Box } from "@mui/material";

export default function AuthenticatedLayout({ sidebarContent, children }) {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >

          {/* Right Sidebar */}
      <Box
        sx={{
          width: 280,
          p: 2,
          borderLeft: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          overflowY: "auto",
        }}
      >
        {sidebarContent}
      </Box>
      
      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          maxWidth: "calc(100% - 280px)", // Adjust sidebar width here
          overflowY: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
