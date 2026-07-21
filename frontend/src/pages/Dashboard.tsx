import { useEffect, useState } from "react";

import {
  Box,
  Grid,
  Typography
} from "@mui/material";

import DashboardCard from "../components/DashboardCard";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  getDashboardStats
} from "../api/dashboardApi";


export default function Dashboard() {

  const companyId = 1;


  const [stats, setStats] = useState({
    total_products: 0,
    total_categories: 0,
    total_stock: 0,
    low_stock_products: 0
  });



  const loadStats = async () => {

    try {

      const response = await getDashboardStats(companyId);

      setStats(response.data);

    } catch (error) {

      console.log(error);

    }

  };



  useEffect(() => {

    loadStats();

  }, []);



  return (

    <Box sx={{ display: "flex" }}>

      <Sidebar />


      <Box sx={{ flexGrow: 1 }}>

        <Topbar />


        <Box sx={{ p: 3 }}>


          <Typography
            variant="h4"
            fontWeight="bold"
            mb={3}
          >
            RetailPulse Analytics Dashboard
          </Typography>



          <Grid container spacing={3}>


            <Grid size={{ xs: 12, md: 3 }}>

              <DashboardCard
                title="Total Products"
                value={stats.total_products}
              />

            </Grid>



            <Grid size={{ xs: 12, md: 3 }}>

              <DashboardCard
                title="Total Categories"
                value={stats.total_categories}
              />

            </Grid>



            <Grid size={{ xs: 12, md: 3 }}>

              <DashboardCard
                title="Total Stock"
                value={stats.total_stock}
              />

            </Grid>



            <Grid size={{ xs: 12, md: 3 }}>

              <DashboardCard
                title="Low Stock Items"
                value={stats.low_stock_products}
              />

            </Grid>


          </Grid>



        </Box>


      </Box>


    </Box>

  );

}