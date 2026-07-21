import { Drawer, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { Link } from "react-router-dom";

const drawerWidth = 220;

export default function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/dashboard">
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={Link} to="/products">
            <ListItemText primary="Products" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton component={Link} to="/categories">
            <ListItemText primary="Categories" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
}