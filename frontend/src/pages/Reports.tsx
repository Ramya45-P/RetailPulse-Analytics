import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

import { getSales } from "../api/saleApi";


export default function Reports() {

  const companyId = 1;

  const [sales, setSales] = useState<any[]>([]);


  useEffect(() => {

    const loadReports = async () => {

      const data = await getSales(companyId);
      setSales(data);

    };

    loadReports();

  }, []);



  const totalRevenue = sales.reduce(
    (sum, sale) => sum + sale.total_amount,
    0
  );


  return (

    <Box sx={{ p: 3 }}>

      <Typography variant="h4" fontWeight="bold" mb={3}>
        Reports & Analytics
      </Typography>


      <Grid container spacing={3} mb={4}>


        <Grid item xs={12} md={4}>

          <Card>
            <CardContent>

              <Typography color="text.secondary">
                Total Sales
              </Typography>

              <Typography variant="h4">
                {sales.length}
              </Typography>

            </CardContent>
          </Card>

        </Grid>



        <Grid item xs={12} md={4}>

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



        <Grid item xs={12} md={4}>

          <Card>
            <CardContent>

              <Typography color="text.secondary">
                Average Order Value
              </Typography>

              <Typography variant="h4">

                ₹ {
                  sales.length
                    ? Math.round(
                        totalRevenue / sales.length
                      ).toLocaleString("en-IN")
                    : 0
                }

              </Typography>

            </CardContent>
          </Card>

        </Grid>


      </Grid>



      <Card>

        <CardContent>

          <Typography variant="h5" mb={3}>
            Sales Report
          </Typography>


          <TableContainer component={Paper}>

            <Table>


              <TableHead>

                <TableRow>

                  <TableCell>
                    Invoice
                  </TableCell>

                  <TableCell>
                    Customer
                  </TableCell>

                  <TableCell>
                    Channel
                  </TableCell>

                  <TableCell>
                    Amount
                  </TableCell>

                </TableRow>

              </TableHead>



              <TableBody>


                {sales.map((sale) => (

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
                      ₹ {sale.total_amount.toLocaleString("en-IN")}
                    </TableCell>


                  </TableRow>

                ))}


              </TableBody>


            </Table>

          </TableContainer>


        </CardContent>

      </Card>


    </Box>

  );
}