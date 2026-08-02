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
import { getAnalyticsDashboard } from "../api/analyticsApi";

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
    const dashboardData = await getDashboardStats();
    setStats(dashboardData);

    const analyticsData = await getAnalyticsDashboard();
    setAnalytics(analyticsData);
  } catch (error) {
    console.log(error);
  }
};
const [analytics, setAnalytics] = useState<any>({
  total_revenue: 0,
  total_orders: 0,
  total_products_sold: 0,
  average_order_value: 0,
  total_inventory_value: 0,
  low_stock_products: 0,
  out_of_stock_products: 0,
  total_categories: 0,
  top_products: [],
});
  
 const cards = [
  {
    title: "Total Revenue",
    value: `₹ ${Number(analytics.total_revenue).toLocaleString("en-IN")}`,
    color: "#2e7d32",
    icon: <CurrencyRupeeIcon sx={{ fontSize: 38 }} />,
  },
  {
    title: "Total Orders",
    value: analytics.total_orders,
    color: "#ed6c02",
    icon: <ShoppingCartIcon sx={{ fontSize: 38 }} />,
  },
  {
    title: "Products Sold",
    value: analytics.total_products_sold,
    color: "#1976d2",
    icon: <LocalShippingIcon sx={{ fontSize: 38 }} />,
  },
  {
    title: "Average Order",
    value: `₹ ${Number(analytics.average_order_value).toLocaleString("en-IN")}`,
    color: "#6a1b9a",
    icon: <TrendingUpIcon sx={{ fontSize: 38 }} />,
  },
  {
    title: "Inventory Value",
    value: `₹ ${Number(analytics.total_inventory_value).toLocaleString("en-IN")}`,
    color: "#00838f",
    icon: <InventoryIcon sx={{ fontSize: 38 }} />,
  },
  {
    title: "Low Stock",
    value: analytics.low_stock_products,
    color: "#f57c00",
    icon: <InventoryIcon sx={{ fontSize: 38 }} />,
  },
  {
    title: "Out Of Stock",
    value: analytics.out_of_stock_products,
    color: "#d32f2f",
    icon: <CancelIcon sx={{ fontSize: 38 }} />,
  },
  {
    title: "Categories",
    value: analytics.total_categories,
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
    💰 Revenue :
    <strong>
      ₹ {Number(analytics.total_revenue).toLocaleString("en-IN")}
    </strong>
  </Typography>

<Typography mb={1}>
  🛒 Orders :
  <strong>{analytics.total_orders}</strong>
</Typography>

<Typography mb={1}>
  📦 Products Sold :
  <strong>{analytics.total_products_sold}</strong>
</Typography>

<Typography mb={1}>
  📊 Average Order :
  <strong>
    ₹ {Number(analytics.average_order_value).toLocaleString("en-IN")}
  </strong>
</Typography>

<Typography mb={1}>
  📂 Categories :
  <strong>{analytics.total_categories}</strong>
</Typography>

<Typography mb={1}>
  📦 Inventory Value :
  <strong>
    ₹ {Number(analytics.total_inventory_value).toLocaleString("en-IN")}
  </strong>
</Typography>

<Typography mb={1}>
  ⚠ Low Stock :
  <strong>{analytics.low_stock_products}</strong>
</Typography>

<Typography>
  ❌ Out Of Stock :
  <strong>{analytics.out_of_stock_products}</strong>
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
      <Grid container spacing={3} mt={4}>
  <Grid item xs={12}>
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: 4,
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          fontWeight="bold"
          mb={3}
        >
          Top Selling Products
        </Typography>

        {analytics.top_products?.length > 0 ? (
          analytics.top_products.map(
            (product: any, index: number) => (
              <Box
                key={index}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  py: 1.5,
                  borderBottom:
                    index !==
                    analytics.top_products.length - 1
                      ? "1px solid #eee"
                      : "none",
                }}
              >
                <Typography fontWeight={500}>
                  {index + 1}. {product.product}
                </Typography>

                <Chip
                  color="primary"
                  label={`${product.quantity} Sold`}
                />
              </Box>
            )
          )
        ) : (
          <Typography color="text.secondary">
            No product sales available.
          </Typography>
        )}
      </CardContent>
    </Card>
  </Grid>
</Grid>
    </Box>
  );
}