import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import axios from "axios";

interface AnalyticsData {
  total_revenue: number;
  total_orders: number;
  products_sold: number;
  average_order_value: number;
  inventory_value: number;
  low_stock_products: number;
  out_of_stock_products: number;
  categories: number;
}

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/analytics/"
      );

      console.log("Analytics Data:", response.data);

      setAnalytics(response.data);

    } catch (error) {
      console.error("Analytics API Error:", error);
    }
  };

  if (!analytics) {
    return (
      <Typography variant="h6">
        Loading Analytics...
      </Typography>
    );
  }

  const cards = [
  {
    title: "Total Revenue",
    value: `₹${(analytics?.total_revenue ?? 0).toLocaleString()}`
  },
  {
    title: "Total Orders",
    value: analytics?.total_orders ?? 0
  },
  {
    title: "Products Sold",
    value: analytics?.products_sold ?? 0
  },
  {
    title: "Average Order Value",
    value: `₹${analytics?.average_order_value ?? 0}`
  },
  {
    title: "Inventory Value",
    value: `₹${(analytics?.inventory_value ?? 0).toLocaleString()}`
  },
  {
    title: "Low Stock Products",
    value: analytics?.low_stock_products ?? 0
  },
  {
    title: "Out Of Stock Products",
    value: analytics?.out_of_stock_products ?? 0
  },
  {
    title: "Categories",
    value: analytics?.categories ?? 0
  }
];
  return (
    <>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Analytics
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid key={index}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">
                  {card.title}
                </Typography>

                <Typography variant="h5">
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default AnalyticsDashboard;