import { AppBar, Toolbar, Typography, Avatar, Box } from "@mui/material";

function Topbar() {
  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{
        bgcolor: "white",
        color: "black",
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          RetailPulse Analytics
        </Typography>
        <Box
  sx={{
    display: "flex",
    alignItems: "center",
    gap: 1,
  }}
>
  <Typography sx={{ fontWeight: "bold" }}>
    Ramya
  </Typography>

  <Avatar>R</Avatar>
</Box>
          
      </Toolbar>
    </AppBar>
  );
}

export default Topbar;