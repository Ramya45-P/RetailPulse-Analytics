import { AppBar, Toolbar, Typography } from "@mui/material";

export default function Topbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6">
          RetailPulse Analytics
        </Typography>
      </Toolbar>
    </AppBar>
  );
}