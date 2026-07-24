import { useEffect, useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
} from "@mui/material";

import { getInventory } from "../api/inventoryApi";


interface InventoryItem {
  id: number;
  product_name: string;
  stock: number;
}


export default function Inventory() {

  const [inventory, setInventory] = useState<InventoryItem[]>([]);


  useEffect(() => {

    const fetchInventory = async () => {

      const data = await getInventory(1);
      setInventory(data);

    };

    fetchInventory();

  }, []);


  return (

    <Box>

      <Box sx={{ p: 3 }}>


        <Typography variant="h4" mb={3}>
          Inventory Overview
        </Typography>


        <Grid container spacing={3} mb={3}>


          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>

                <Typography color="text.secondary">
                  Total Products
                </Typography>

                <Typography variant="h4">
                  {inventory.length}
                </Typography>

              </CardContent>
            </Card>
          </Grid>



          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>

                <Typography color="text.secondary">
                  Low Stock
                </Typography>

                <Typography variant="h4">

                  {
                    inventory.filter(
                      item => item.stock > 0 && item.stock <= 5
                    ).length
                  }

                </Typography>

              </CardContent>
            </Card>
          </Grid>



          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>

                <Typography color="text.secondary">
                  Out Of Stock
                </Typography>

                <Typography variant="h4">

                  {
                    inventory.filter(
                      item => item.stock === 0
                    ).length
                  }

                </Typography>

              </CardContent>
            </Card>
          </Grid>


        </Grid>



        <Card>

          <CardContent>

            <Typography variant="h5" mb={3}>
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


                  {inventory.map((item) => (

                    <TableRow key={item.id}>


                      <TableCell>
                        {item.product_name}
                      </TableCell>


                      <TableCell>
                        {item.stock}
                      </TableCell>


                      <TableCell>

                        {item.stock === 0 ? (

                          <Chip
                            label="Out of Stock"
                            color="error"
                          />

                        ) : item.stock <= 5 ? (

                          <Chip
                            label="Low Stock"
                            color="warning"
                          />

                        ) : (

                          <Chip
                            label="Available"
                            color="success"
                          />

                        )}

                      </TableCell>
                      <TableCell>

  <Chip
    label="View"
    color="primary"
    clickable
  />

</TableCell>

                    </TableRow>

                  ))}


                </TableBody>


              </Table>

            </TableContainer>


          </CardContent>

        </Card>


      </Box>

    </Box>

  );

}