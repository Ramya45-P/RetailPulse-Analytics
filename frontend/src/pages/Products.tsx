import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
} from "@mui/material";

import InventoryIcon from "@mui/icons-material/Inventory";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/productApi";


interface Product {

  id:number;
  name:string;
  sku:string;
  brand:string;
  description:string;
  category_id:number;
  company_id:number;
  unit_price:number;
  cost_price:number;
  stock_quantity:number;
  unit_of_measure:string;
  status:string;

}



export default function Products(){

const companyId = 1;


const emptyForm = {

name:"",
sku:"",
category_id:1,
brand:"",
description:"",
unit_price:0,
cost_price:0,
stock_quantity:0,
unit_of_measure:"Piece",
status:"Active",
company_id:companyId,

};


const [products,setProducts]=useState<Product[]>([]);
const [search,setSearch]=useState("");

const [form,setForm]=useState(emptyForm);

const [editingId,setEditingId]=useState<number|null>(null);



const loadProducts=async()=>{

try{

const res=await getProducts(companyId,{
search
});

setProducts(res.data);

}
catch(error){

console.log(error);

}

};



useEffect(()=>{

loadProducts();

},[]);




const handleChange=(e:React.ChangeEvent<HTMLInputElement>)=>{

const {name,value}=e.target;


setForm({

...form,

[name]:

name==="unit_price" ||
name==="cost_price" ||
name==="stock_quantity"

?

Number(value)

:

value


});

};





const handleSave=async()=>{

try{


if(editingId===null){

await createProduct(form);

}

else{

await updateProduct(editingId,form);

setEditingId(null);

}


setForm(emptyForm);

loadProducts();


}

catch(error){

console.log(error);

}

};






const handleEdit=(product:Product)=>{


setEditingId(product.id);


setForm({

name:product.name,
sku:product.sku,
category_id:product.category_id,
brand:product.brand,
description:product.description,
unit_price:product.unit_price,
cost_price:product.cost_price,
stock_quantity:product.stock_quantity,
unit_of_measure:product.unit_of_measure,
status:product.status,
company_id:product.company_id

});


};






const handleDelete=async(id:number)=>{

await deleteProduct(id);

loadProducts();

};





return(

<Box>


<Typography
variant="h4"
fontWeight="bold"
mb={3}
>
Product Management
</Typography>





<Grid container spacing={3} mb={4}>


<Grid size={{xs:12,md:4}}>

<Card sx={{borderRadius:3,boxShadow:3}}>

<CardContent>

<InventoryIcon color="primary"/>

<Typography>
Total Products
</Typography>


<Typography
variant="h4"
fontWeight="bold"
>
{products.length}
</Typography>


</CardContent>

</Card>

</Grid>





<Grid size={{xs:12,md:4}}>

<Card sx={{borderRadius:3,boxShadow:3}}>

<CardContent>

<CheckCircleIcon color="success"/>

<Typography>
Active Products
</Typography>


<Typography
variant="h4"
fontWeight="bold"
>

{
products.filter(
p=>p.status==="Active"
).length
}

</Typography>


</CardContent>

</Card>

</Grid>





<Grid size={{xs:12,md:4}}>

<Card sx={{borderRadius:3,boxShadow:3}}>

<CardContent>

<WarningIcon color="warning"/>

<Typography>
Low Stock Products
</Typography>


<Typography
variant="h4"
fontWeight="bold"
>

{
products.filter(
p=>p.stock_quantity<=10
).length
}

</Typography>


</CardContent>

</Card>

</Grid>



</Grid>







<Card
sx={{
mb:4,
borderRadius:3,
boxShadow:3
}}
>


<CardContent>


<Typography
variant="h6"
mb={3}
>

{
editingId
?
"Update Product"
:
"Add Product"
}

</Typography>



<Grid container spacing={2}>


<Grid size={{xs:12,md:6}}>

<TextField
fullWidth
label="Product Name"
name="name"
value={form.name}
onChange={handleChange}
/>

</Grid>



<Grid size={{xs:12,md:6}}>

<TextField
fullWidth
label="SKU"
name="sku"
value={form.sku}
onChange={handleChange}
/>

</Grid>




<Grid size={{xs:12,md:6}}>

<TextField
fullWidth
label="Brand"
name="brand"
value={form.brand}
onChange={handleChange}
/>

</Grid>




<Grid size={{xs:12,md:6}}>

<TextField
fullWidth
type="number"
label="Stock Quantity"
name="stock_quantity"
value={form.stock_quantity}
onChange={handleChange}
/>

</Grid>




<Grid size={{xs:12}}>

<Button
variant="contained"
onClick={handleSave}
>

{
editingId
?
"Update Product"
:
"Add Product"
}

</Button>


</Grid>


</Grid>


</CardContent>

</Card>







<Card
sx={{
mb:3,
borderRadius:3,
boxShadow:3
}}
>

<CardContent>


<TextField

fullWidth

label="Search Name / SKU / Brand"

value={search}

onChange={(e)=>setSearch(e.target.value)}

onKeyDown={(e)=>{

if(e.key==="Enter")
loadProducts();

}}

/>


</CardContent>


</Card>







<TableContainer
component={Paper}
sx={{
borderRadius:3,
boxShadow:3
}}
>


<Table>


<TableHead
sx={{
backgroundColor:"#1976d2"
}}
>


<TableRow>


<TableCell sx={{color:"white"}}>
Name
</TableCell>


<TableCell sx={{color:"white"}}>
SKU
</TableCell>


<TableCell sx={{color:"white"}}>
Brand
</TableCell>


<TableCell sx={{color:"white"}}>
Price
</TableCell>


<TableCell sx={{color:"white"}}>
Stock
</TableCell>


<TableCell sx={{color:"white"}}>
Status
</TableCell>


<TableCell sx={{color:"white"}}>
Action
</TableCell>



</TableRow>


</TableHead>





<TableBody>


{
products.map(product=>(


<TableRow
hover
key={product.id}
>


<TableCell>
{product.name}
</TableCell>


<TableCell>
{product.sku}
</TableCell>


<TableCell>
{product.brand}
</TableCell>


<TableCell>
₹ {product.unit_price}
</TableCell>


<TableCell>
{product.stock_quantity}
</TableCell>


<TableCell>

<Chip

label={product.status}

color={
product.status==="Active"
?
"success"
:
"default"
}

/>

</TableCell>



<TableCell>


<Button
size="small"
variant="contained"
sx={{mr:1}}
onClick={()=>handleEdit(product)}
>
Edit
</Button>



<Button
size="small"
color="error"
variant="contained"
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



</Box>


);


}