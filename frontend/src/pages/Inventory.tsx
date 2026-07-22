import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  TextField,
} from "@mui/material";

const Inventory = () => {

  const [productName, setProductName] = useState("");
  const [stock, setStock] = useState("");

  const [inventory, setInventory] = useState<any[]>([]);


  const addInventory = () => {

    const newItem = {
      id: Date.now(),
      product_name: productName,
      stock: Number(stock),
    };

    setInventory([...inventory, newItem]);

    setProductName("");
    setStock("");

  };


  return (
    <div>

      <h1>Inventory</h1>


      <TextField
        label="Product Name"
        value={productName}
        onChange={(e)=>setProductName(e.target.value)}
        sx={{marginRight:2}}
      />


      <TextField
        label="Stock"
        type="number"
        value={stock}
        onChange={(e)=>setStock(e.target.value)}
        sx={{marginRight:2}}
      />


      <Button
        variant="contained"
        onClick={addInventory}
      >
        Add Stock
      </Button>


      <Table sx={{marginTop:3}}>

        <TableHead>

          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>Stock</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>

        </TableHead>


        <TableBody>

          {
            inventory.map((item)=>(
              <TableRow key={item.id}>

                <TableCell>
                  {item.product_name}
                </TableCell>

                <TableCell>
                  {item.stock}
                </TableCell>

                <TableCell>

                  <Button color="error">
                    Delete
                  </Button>

                </TableCell>

              </TableRow>
            ))
          }

        </TableBody>

      </Table>


    </div>
  );
};


export default Inventory;