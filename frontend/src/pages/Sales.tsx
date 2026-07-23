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
} from "@mui/material";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  getSales,
  deleteSale,
} from "../api/saleApi";

import SalesForm from "../components/SalesForm";


export default function Sales() {

  const companyId = 1;

  const [sales, setSales] = useState<any[]>([]);


  const loadSales = async () => {

    try {

      const data = await getSales(companyId);

      setSales(data);

    } catch (error) {

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

    } catch(error){

      console.log(error);

    }

  };



  return (

    <Box sx={{ display:"flex" }}>


      <Sidebar />


      <Box sx={{ flexGrow:1 }}>


        <Topbar />


        <Box sx={{ p:3 }}>


          <Typography variant="h4" mb={3}>
            Sales Management
          </Typography>



          <SalesForm refresh={loadSales} />



          <TableContainer 
            component={Paper}
            sx={{ mt:4 }}
          >

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
                    Sales Channel
                  </TableCell>

                  <TableCell>
                    Payment Method
                  </TableCell>

                  <TableCell>
                    Total Amount
                  </TableCell>

                  <TableCell>
                    Action
                  </TableCell>

                </TableRow>

              </TableHead>



              <TableBody>


                {
                  sales.map((sale)=>(

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
                        ₹ {sale.total_amount}
                      </TableCell>



                      <TableCell>

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

                  ))
                }



                {
                  sales.length === 0 && (

                    <TableRow>

                      <TableCell 
                        colSpan={6}
                        align="center"
                      >
                        No Sales Found
                      </TableCell>

                    </TableRow>

                  )
                }



              </TableBody>


            </Table>


          </TableContainer>



        </Box>


      </Box>


    </Box>

  );

}