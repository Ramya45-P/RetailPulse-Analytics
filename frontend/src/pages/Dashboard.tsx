import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Chip,
} from "@mui/material";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import InventoryIcon from "@mui/icons-material/Inventory";
import CategoryIcon from "@mui/icons-material/Category";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

import { getDashboardStats } from "../api/dashboardApi";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUnitsSold: 0,
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    totalCategories: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.log(error);
    }
  };

  const cards = [
    {
      title: "Total Units Sold",
      value: stats.totalUnitsSold,
      color: "#1976d2",
      icon: <LocalShippingIcon sx={{ fontSize: 38 }} />,
    },
    {
      title: "Revenue",
      value: `₹ ${Number(stats.totalRevenue).toLocaleString()}`,
      color: "#2e7d32",
      icon: <CurrencyRupeeIcon sx={{ fontSize: 38 }} />,
    },
    {
      title: "Orders",
      value: stats.totalOrders,
      color: "#ed6c02",
      icon: <ShoppingCartIcon sx={{ fontSize: 38 }} />,
    },
    {
      title: "Average Order",
      value: `₹ ${Number(stats.averageOrderValue).toFixed(2)}`,
      color: "#6a1b9a",
      icon: <TrendingUpIcon sx={{ fontSize: 38 }} />,
    },
    {
      title: "Products",
      value: stats.totalProducts,
      color: "#00838f",
      icon: <InventoryIcon sx={{ fontSize: 38 }} />,
    },
    {
      title: "Active Products",
      value: stats.activeProducts,
      color: "#43a047",
      icon: <CheckCircleIcon sx={{ fontSize: 38 }} />,
    },
    {
      title: "Inactive Products",
      value: stats.inactiveProducts,
      color: "#d32f2f",
      icon: <CancelIcon sx={{ fontSize: 38 }} />,
    },
    {
      title: "Categories",
      value: stats.totalCategories,
      color: "#5e35b1",
      icon: <CategoryIcon sx={{ fontSize: 38 }} />,
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "1600px",
        mx: "auto",
        p: 4,
      }}
    >
      <Typography
        variant="h4"
        sx={{ fontWeight: "bold" }}
        mb={1}
      >
        RetailPulse Analytics Dashboard
      </Typography>

      <Typography color="text.secondary" mb={4}>
        Welcome back! Here's an overview of your business performance.
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                borderRadius: 4,
                boxShadow: 4,
                transition: "0.3s",
                "&:hover": {
                  transform: "translateY(-6px)",
                  boxShadow: 8,
                  cursor: "pointer",
                },
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" fontSize={15}>
                      {card.title}
                    </Typography>

                    <Typography
                      variant="h4"
                      sx={{ fontWeight: "bold" }}
                      mt={2}
                    >
                      {card.value}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      backgroundColor: card.color,
                      color: "#fff",
                      p: 1.5,
                      borderRadius: 3,
                    }}
                  >
                    {card.icon}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} mt={4}>
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: 4,
              height: "100%",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold" }}
                mb={3}
              >
                Business Summary
              </Typography>

              <Typography mb={1}>
                📦 Total Products : <strong>{stats.totalProducts}</strong>
              </Typography>

              <Typography mb={1}>
                📂 Categories : <strong>{stats.totalCategories}</strong>
              </Typography>

              <Typography mb={1}>
                🛒 Orders : <strong>{stats.totalOrders}</strong>
              </Typography>

              <Typography mb={1}>
                💰 Revenue :{" "}
                <strong>₹ {Number(stats.totalRevenue).toLocaleString()}</strong>
              </Typography>

              <Typography mb={1}>
                🚚 Units Sold : <strong>{stats.totalUnitsSold}</strong>
              </Typography>

              <Typography>
                📊 Average Order :{" "}
                <strong>₹ {Number(stats.averageOrderValue).toFixed(2)}</strong>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 4,
              boxShadow: 4,
              height: "100%",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold" }}
                mb={3}
              >
                System Status
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2">Backend</Typography>
                  <Chip label="Connected" color="success" />
                </Box>

                <Box>
                  <Typography variant="body2">Database</Typography>
                  <Chip label="Connected" color="success" />
                </Box>

                <Box>
                  <Typography variant="body2">API</Typography>
                  <Chip label="Running" color="success" />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}