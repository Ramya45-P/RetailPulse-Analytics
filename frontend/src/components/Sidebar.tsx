import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import CategoryIcon from "@mui/icons-material/Category";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import BarChartIcon from "@mui/icons-material/BarChart";

import { Link, useLocation } from "react-router-dom";


const drawerWidth = 240;


export default function Sidebar() {

  const location = useLocation();


  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    {
      text: "Products",
      icon: <InventoryIcon />,
      path: "/products",
    },
    {
      text: "Categories",
      icon: <CategoryIcon />,
      path: "/categories",
    },
    {
      text: "Sales",
      icon: <ShoppingCartIcon />,
      path: "/sales",
    },
    {
      text: "Inventory",
      icon: <BarChartIcon />,
      path: "/inventory",
    },
  ];


  return (

    <Drawer

      variant="permanent"

      sx={{

        width: drawerWidth,

        "& .MuiDrawer-paper": {

          width: drawerWidth,

          boxSizing: "border-box",

          backgroundColor: "#ffffff",

          borderRight: "1px solid #ddd",

        },

      }}

    >

      <Toolbar />


      <List>


        {menuItems.map((item) => (

          <ListItem

            key={item.text}

            disablePadding

          >

            <ListItemButton

              component={Link}

              to={item.path}

              selected={location.pathname === item.path}

              sx={{

                margin: "6px 12px",

                borderRadius: "10px",

                "&.Mui-selected": {

                  backgroundColor: "#e3f2fd",

                  color: "#1976d2",

                },

                "&:hover": {

                  backgroundColor: "#f5f5f5",

                },

              }}

            >

              <ListItemIcon>

                {item.icon}

              </ListItemIcon>


              <ListItemText

                primary={item.text}

              />


            </ListItemButton>


          </ListItem>

        ))}


      </List>


    </Drawer>

  );

}