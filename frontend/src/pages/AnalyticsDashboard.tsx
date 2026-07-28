import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
} from "@mui/material";

import { getAnalyticsDashboard } from "../api/analyticsApi";


export default function AnalyticsDashboard() {

  const companyId = Number(
    localStorage.getItem("company_id")
  );

  const [kpis, setKpis] = useState<any>({});


  const loadDashboard = async () => {

    try {

      const data = await getAnalyticsDashboard(companyId);

      setKpis(data.kpis);

    } catch(error){

      console.log(error);

    }

  };


  useEffect(()=>{

    loadDashboard();

  },[]);



  const cards = [
    {
      title:"Total Revenue",
      value:`₹ ${kpis.total_revenue || 0}`
    },
    {
      title:"Total Orders",
      value:kpis.total_orders || 0
    },
    {
      title:"Products Sold",
      value:kpis.total_products_sold || 0
    },
    {
      title:"Average Order Value",
      value:`₹ ${kpis.average_order_value || 0}`
    },
    {
      title:"Inventory Value",
      value:`₹ ${kpis.total_inventory_value || 0}`
    },
    {
      title:"Low Stock Products",
      value:kpis.low_stock_products || 0
    },
    {
      title:"Out Of Stock",
      value:kpis.out_of_stock_products || 0
    },
    {
      title:"Categories",
      value:kpis.total_categories || 0
    }
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