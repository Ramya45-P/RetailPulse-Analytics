import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
} from "@mui/material";

import {
  getSalesSummary,
  getSalesTrend,
  getTopProducts,
  getCustomerAnalytics,
  getPaymentMethods,
} from "../api/analyticsApi";

export default function AnalyticsDashboard() {

  const [kpis, setKpis] = useState<any>({});
  const [filterType, setFilterType] = useState("30days");

  const loadDashboard = async () => {

    try {

      const summary = await getSalesSummary(filterType);
      setKpis(summary);

    } catch(error){

      console.log(error);

    }

  };


  useEffect(()=>{

    loadDashboard();

  },[]);

  
  const cards = [
  {
    title: "Total Revenue",
    value: `₹${(kpis?.total_revenue ?? 0).toLocaleString()}`,
  },
  {
    title: "Total Orders",
    value: kpis?.total_orders ?? 0,
  },
  {
    title: "Average Order Value",
    value: `₹${(kpis?.average_order_value ?? 0).toLocaleString()}`,
  },
  {
    title: "Total Items Sold",
    value: kpis?.total_items_sold ?? 0,
  },
  {
    title: "Total Discount",
    value: `₹${(kpis?.total_discount ?? 0).toLocaleString()}`,
  },
  {
    title: "Total Tax",
    value: `₹${(kpis?.total_tax ?? 0).toLocaleString()}`,
  },
];
  return (

    <Box sx={{p:4}}>

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
      >
        Retail Analytics Dashboard
      </Typography>


      <Button
        variant="contained"
        onClick={loadDashboard}
        sx={{mb:3}}
      >
        Refresh
      </Button>


      <Grid container spacing={3}>

        {cards.map((card)=>(

          <Grid
            size={3}
            key={card.title}
          >

            <Card>

              <CardContent>

                <Typography color="text.secondary">
                  {card.title}
                </Typography>


                <Typography
                  variant="h5"
                  fontWeight="bold"
                >
                  {card.value}
                </Typography>


              </CardContent>

            </Card>

          </Grid>

        ))}

      </Grid>


    </Box>

  );

}