import { useEffect, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Paper,
  TableContainer,
  Typography,
  Box,
} from "@mui/material";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import { getProducts } from "../api/productApi";


interface Product {
  id:number;
  name:string;
  sku:string;
  stock_quantity:number;
  status:string;
}


export default function Inventory(){

  const companyId = 1;

  const [products,setProducts] = useState<Product[]>([]);


  const loadInventory = async()=>{

    try{

      const res = await getProducts(companyId);

      setProducts(res.data);

    }
    catch(err){
      console.log(err);
    }

  };


  useEffect(()=>{

    loadInventory();

  },[]);



  return (

    <Box sx={{display:"flex"}}>

      <Sidebar/>


      <Box sx={{flexGrow:1}}>

        <Topbar/>


        <Box sx={{p:3}}>


          <Typography variant="h4" mb={3}>
            Inventory
          </Typography>



          <TableContainer component={Paper}>

            <Table>


              <TableHead>

                <TableRow>

                  <TableCell>
                    Product Name
                  </TableCell>


                  <TableCell>
                    Stock
                  </TableCell>


                  <TableCell>
                    Status
                  </TableCell>


                  <TableCell>
                    Action
                  </TableCell>


                </TableRow>

              </TableHead>



              <TableBody>


                {
                  products.map((product)=>(

                    <TableRow key={product.id}>


                      <TableCell>
                        {product.name}
                      </TableCell>


                      <TableCell>
                        {product.stock_quantity}
                      </TableCell>


                      <TableCell>

                        {
                          product.stock_quantity <= 10
                          ?
                          "Low Stock"
                          :
                          "Available"
                        }

                      </TableCell>



                      <TableCell>

                        <Button
                          variant="contained"
                          size="small"
                        >
                          View
                        </Button>


                      </TableCell>


                    </TableRow>

                  ))
                }



              </TableBody>


            </Table>


          </TableContainer>


        </Box>


      </Box>


    </Box>

  );

}