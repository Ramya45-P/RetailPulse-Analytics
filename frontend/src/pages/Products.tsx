import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import Sidebar from "../components/Sidebar";
import { getCategories } from "../api/categoryApi";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/productApi";


interface Product {
  id: number;
  name: string;
  sku: string;
  category_id: number;
  brand: string;
  description: string;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  unit_of_measure: string;
  status: string;
  company_id: number;
}


interface Category {
  id: number;
  name: string;
}


const companyId = Number(localStorage.getItem("company_id"));

const emptyForm = {
  name: "",
  sku: "",
  category_id: 0,
  brand: "",
  description: "",
  unit_price: 0,
  cost_price: 0,
  stock_quantity: 0,
  unit_of_measure: "Piece",
  status: "Active",
  company_id: companyId,
};



function Products() {


  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [open, setOpen] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState(emptyForm);



  const loadProducts = async () => {

    try {

      const data = await getProducts(companyId);

      console.log("Products Data:", data);

      setProducts(data);

    } catch(error) {

      console.log(error);

    }

  };



  const loadCategories = async () => {

    try {

      const data = await getCategories(companyId);

      console.log("Categories:", data);

      setCategories(data);

    } catch(error) {

      console.log(error);

    }

  };



  useEffect(()=>{

    loadProducts();

    loadCategories();

  },[]);




  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const { name, value } = e.target;


    setForm({

      ...form,

      [name]:

        name === "unit_price" ||
        name === "cost_price" ||
        name === "stock_quantity"

        ? Number(value)

        : value,


      company_id: companyId,

    });

  };





  const handleSave = async()=>{


    try{


      console.log("Sending Product:",form);


      if(editingId === null){

        await createProduct(form);

      }

      else{

        await updateProduct(editingId,form);

      }



      setForm({

        ...emptyForm,

        company_id: companyId

      });


      setEditingId(null);

      setOpen(false);


      loadProducts();


    }

    catch(error){

      console.log(error);

    }


  };
 const handleEdit = (product:Product)=>{


    setForm({

      name: product.name,

      sku: product.sku,

      category_id: product.category_id,

      brand: product.brand,

      description: product.description,

      unit_price: product.unit_price,

      cost_price: product.cost_price,

      stock_quantity: product.stock_quantity,

      unit_of_measure: product.unit_of_measure,

      status: product.status,

      company_id: companyId,

    });



    setEditingId(product.id);

    setOpen(true);


  };





  const handleDelete = async(id:number)=>{


    try{

      await deleteProduct(id);

      loadProducts();

    }

    catch(error){

      console.log(error);

    }


  };





return (

<Box sx={{display:"flex"}}>


<Sidebar/>


<Box sx={{flexGrow:1,p:3}}>


<Typography variant="h4" mb={3}>

Products

</Typography>


<Card>


<CardContent>


<Button

variant="contained"

onClick={()=>{

setForm({

...emptyForm,

company_id:companyId

});


setEditingId(null);

setOpen(true);

}}

>

Add Product

</Button>
<TableContainer component={Paper} sx={{mt:3}}>


<Table>


<TableHead>


<TableRow>

<TableCell>Name</TableCell>

<TableCell>SKU</TableCell>

<TableCell>Brand</TableCell>

<TableCell>Price</TableCell>

<TableCell>Stock</TableCell>

<TableCell>Actions</TableCell>


</TableRow>


</TableHead>



<TableBody>


{

products.map((product)=>(
<TableRow key={product.id}>


<TableCell>{product.name}</TableCell>
<TableCell>{product.sku}</TableCell>
<TableCell>{product.brand}</TableCell>
<TableCell>

₹ {product.unit_price}

</TableCell>


<TableCell>

{product.stock_quantity}

</TableCell>


<TableCell>


<Button onClick={()=>handleEdit(product)}>

Edit

</Button>
<Button

color="error"

onClick={()=>handleDelete(product.id)}

>
  Delete

</Button>


</TableCell>
</TableRow>


))

}

</TableBody>
</Table>
</TableContainer>
</CardContent>


</Card>
<Dialog

open={open}

onClose={()=>setOpen(false)}

>


<DialogTitle>

{

editingId

? "Edit Product"

: "Add Product"

}

</DialogTitle>

<DialogContent>

<TextField

margin="dense"

label="Name"

name="name"

fullWidth

value={form.name}

onChange={handleChange}

/>
<TextField

margin="dense"

label="SKU"

name="sku"

fullWidth

value={form.sku}

onChange={handleChange}

/>

<FormControl fullWidth margin="dense">


<InputLabel>

Category

</InputLabel>

<Select

name="category_id"

value={form.category_id}

label="Category"

onChange={(e)=>

setForm({

...form,

category_id:Number(e.target.value)

})

}


>


{

categories.map((category)=>(


<MenuItem

key={category.id}

value={category.id}

>

{category.name}


</MenuItem>


))

}
</Select>
</FormControl>

<TextField

margin="dense"

label="Brand"

name="brand"

fullWidth

value={form.brand}

onChange={handleChange}

/>
<TextField

margin="dense"

label="Description"

name="description"

fullWidth

value={form.description}

onChange={handleChange}

/>

<TextField

margin="dense"

label="Unit Price"

name="unit_price"

type="number"

fullWidth

value={form.unit_price}

onChange={handleChange}

/>

<TextField

margin="dense"

label="Cost Price"

name="cost_price"

type="number"

fullWidth

value={form.cost_price}

onChange={handleChange}

/>
<TextField

margin="dense"

label="Stock Quantity"

name="stock_quantity"

type="number"

fullWidth

value={form.stock_quantity}

onChange={handleChange}

/>
</DialogContent>

<DialogActions>


<Button onClick={()=>setOpen(false)}>

Cancel

</Button>
<Button

variant="contained"

onClick={handleSave}

>

Save

</Button>
</DialogActions>
</Dialog>
</Box>


</Box>


);


}

export default Products;