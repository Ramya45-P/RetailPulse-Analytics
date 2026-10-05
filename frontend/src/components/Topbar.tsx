import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
} from "@mui/material";

import NotificationCenter from "./NotificationCenter";

export default function Topbar() {
  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{
        backgroundColor: "#fff",
        color: "#333",
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* =====================================================
            LEFT SIDE
        ===================================================== */}

        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700 }}
          >
            RetailPulse Analytics
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Inventory & Sales Management System
          </Typography>
        </Box>

        {/* =====================================================
            RIGHT SIDE
        ===================================================== */}

        <Box
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Typography color="text.secondary">
            {new Date().toLocaleDateString()}
          </Typography>

          {/* Notification Center */}

          <NotificationCenter />

          {/* User Avatar */}

          <Avatar
            sx={{
              bgcolor: "#1976d2",
            }}
          >
            R
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
}