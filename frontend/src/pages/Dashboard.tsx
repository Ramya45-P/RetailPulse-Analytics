import { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";

import { getDashboardStats } from "../api/dashboardApi";


const Dashboard = () => {

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
const loadStats = async () => {
    try {
const data = await getDashboardStats();
console.log("Dashboard Data:", data);
setStats(data);
    } catch (error) {
      console.error(error);
    }
  };

  loadStats();
}, []);

  const cards = [

    {
      title:"Total Units Sold",
      value:stats.totalUnitsSold
    },

    {
      title:"Total Revenue",
      value:`₹ ${stats.totalRevenue}`
    },

    {
      title:"Total Orders",
      value:stats.totalOrders
    },

    {
      title:"Average Order Value",
      value:`₹ ${stats.averageOrderValue}`
    },

    {
      title:"Total Products",
      value:stats.totalProducts
    },

    {
  title: "Active Products",
  value: stats.activeProducts
},
{
  title: "Inactive Products",
  value: stats.inactiveProducts
},

    {
      title:"Total Categories",
      value:stats.totalCategories
    },

  ];



  return (

    <Box>

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
      >
        RetailPulse Analytics Dashboard
      </Typography>



      <Grid container spacing={3}>

        {
          cards.map((card,index)=>(

            <Grid item xs={12} sm={6} md={3} key={index}>

              <Card
                sx={{
                  height:"130px",
                  borderRadius:3
                }}
              >

                <CardContent>

                  <Typography
                    color="text.secondary"
                  >
                    {card.title}
                  </Typography>


                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    mt={2}
                  >
                    {card.value}
                  </Typography>


                </CardContent>

              </Card>


            </Grid>


          ))
        }


      </Grid>


    </Box>

  );


};


export default Dashboard;