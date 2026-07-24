import { Box, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const drawerWidth = 240;

export default function Layout() {
  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${drawerWidth}px)`,
          minHeight: "100vh",
          overflow: "auto",
          bgcolor: "#f5f7fb",
        }}
      >
        <Topbar />

        <Toolbar />

        <Box
          sx={{
            p: 4,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}