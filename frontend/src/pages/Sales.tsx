import { useEffect, useState } from "react";

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Paper,
  TableContainer,
  Typography,
  Card,
  CardContent,
  Grid,
} from "@mui/material";

import {
  getSales,
  deleteSale,
} from "../api/saleApi";

import SalesForm from "../components/SalesForm";


export default function Sales() {

  const companyId = Number(localStorage.getItem("company_id"));

  const [sales, setSales] = useState<any[]>([]);


  const loadSales = async () => {

    try {

      const data = await getSales(companyId);
      console.log("Sales API Data:", data);

      setSales(data || []);

    } 
    catch (error) {

      console.log(error);

    }

  };


  useEffect(() => {

    loadSales();

  }, []);



  const handleDelete = async (id:number) => {

    try {

      await deleteSale(id);

      loadSales();

    }
    catch(error){

      console.log(error);

    }

  };


  const totalRevenue = sales.reduce(
    (sum, sale) => sum + Number(sale.total_amount || 0),
    0
  );


  const totalChannels = new Set(
    sales.map((sale)=>sale.sales_channel)
  ).size;



  return (

    <Box 
      sx={{
        p:4,
        width:"100%"
      }}
    >


      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
      >
        Sales Management
      </Typography>



      {/* Summary Cards */}

      <Grid 
        container 
        spacing={3}
        mb={3}
      >


        <Grid size={{xs:12, md:4}}>

          <Card>

            <CardContent>

              <Typography color="text.secondary">
                Total Orders
              </Typography>


              <Typography variant="h4">
                {sales.length}
              </Typography>


            </CardContent>

          </Card>

        </Grid>




        <Grid size={{xs:12, md:4}}>

          <Card>

            <CardContent>

              <Typography color="text.secondary">
                Total Revenue
              </Typography>


              <Typography variant="h4">

                ₹ {totalRevenue.toLocaleString("en-IN")}

              </Typography>


            </CardContent>

          </Card>

        </Grid>




        <Grid size={{xs:12, md:4}}>

          <Card>

            <CardContent>

              <Typography color="text.secondary">
                Sales Channels
              </Typography>


              <Typography variant="h4">

                {totalChannels}

              </Typography>


            </CardContent>

          </Card>

        </Grid>



      </Grid>





      {/* Add Sale Form */}

      <Card

        sx={{

          borderRadius:3,

          boxShadow:3,

          mb:4

        }}

      >

        <CardContent>

          <SalesForm refresh={loadSales}/>

        </CardContent>


      </Card>







      {/* Sales Table */}


      <TableContainer

        component={Paper}

        sx={{

          borderRadius:3,

          boxShadow:3

        }}

      >

        <Table>


          <TableHead>

            <TableRow>


              <TableCell>
                <b>Invoice</b>
              </TableCell>


              <TableCell>
                <b>Customer</b>
              </TableCell>


              <TableCell>
                <b>Sales Channel</b>
              </TableCell>


              <TableCell>
                <b>Payment Method</b>
              </TableCell>


              <TableCell>
                <b>Total Amount</b>
              </TableCell>


              <TableCell align="center">
                <b>Action</b>
              </TableCell>


            </TableRow>


          </TableHead>





          <TableBody>



            {sales.map((sale)=>(


              <TableRow key={sale.id}>


                <TableCell>
                  {sale.invoice_number}
                </TableCell>



                <TableCell>
                  {sale.customer_name}
                </TableCell>



                <TableCell>
                  {sale.sales_channel}
                </TableCell>



                <TableCell>
                  {sale.payment_method}
                </TableCell>



                <TableCell>

                  ₹ {Number(
                    sale.total_amount || 0
                  ).toLocaleString("en-IN")}


                </TableCell>




                <TableCell align="center">


                  <Button

                    variant="contained"

                    color="error"

                    size="small"

                    onClick={() =>
                      handleDelete(sale.id)
                    }

                  >

                    Delete

                  </Button>


                </TableCell>



              </TableRow>



            ))}




            {sales.length === 0 && (

              <TableRow>


                <TableCell 
                  colSpan={6}
                  align="center"
                >

                  No Sales Found


                </TableCell>


              </TableRow>


            )}



          </TableBody>


        </Table>


      </TableContainer>


    </Box>


  );

}