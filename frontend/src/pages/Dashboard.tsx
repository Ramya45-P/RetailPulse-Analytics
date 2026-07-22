import { useEffect, useState } from "react";
import { getDashboardStats } from "../api/dashboardApi";

import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box
} from "@mui/material";


const Dashboard = () => {


  const [statsData, setStatsData] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalStock: 0,
    lowStockItems: 0,
  });



  useEffect(() => {
    loadStats();
  }, []);



  const loadStats = async () => {

    try {

      const data = await getDashboardStats();

      setStatsData(data);

    } catch (error) {

      console.log(error);

    }

  };




  const stats = [
    {
      title:"Total Products",
      value: statsData.totalProducts
    },
    {
      title:"Total Categories",
      value: statsData.totalCategories
    },
    {
      title:"Total Stock",
      value: statsData.totalStock
    },
    {
      title:"Low Stock Items",
      value: statsData.lowStockItems
    }
  ];



  return (

    <Box>


      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{mb:4}}
      >
        RetailPulse Analytics Dashboard
      </Typography>



      <Grid container spacing={3}>


        {
          stats.map((item)=>(

            <Grid item xs={12} sm={6} md={3} key={item.title}>


              <Card
                sx={{
                  borderRadius:3,
                  boxShadow:3,
                  height:150
                }}
              >

                <CardContent>


                  <Typography
                    color="text.secondary"
                    variant="h6"
                  >
                    {item.title}
                  </Typography>



                  <Typography
                    variant="h3"
                    fontWeight="bold"
                    sx={{
                      mt:2
                    }}
                  >
                    {item.value}
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