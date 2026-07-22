import { useState } from "react";
import { Button, TextField, Box } from "@mui/material";
import { createSale } from "../api/saleApi";


const SalesForm = ({refresh}: {refresh:()=>void}) => {

const [form,setForm] = useState({
    company_id:1,
    customer_name:"",
    product_id:1,
    category_id:1,
    quantity:1,
    unit_price:0,
    discount:0,
    tax:0,
    sales_channel:"Online",
    payment_method:"UPI"
});


const handleChange=(e:any)=>{
    setForm({
        ...form,
        [e.target.name]: e.target.value
    });
};


const submitSale=async()=>{

    await createSale({
        ...form,
        quantity:Number(form.quantity),
        unit_price:Number(form.unit_price),
        discount:Number(form.discount),
        tax:Number(form.tax)
    });

    refresh();

};



return (

<Box>

<TextField
name="customer_name"
label="Customer Name"
onChange={handleChange}
/>


<TextField
name="unit_price"
label="Unit Price"
type="number"
onChange={handleChange}
/>


<TextField
name="quantity"
label="Quantity"
type="number"
onChange={handleChange}
/>


<Button
variant="contained"
onClick={submitSale}
>
Add Sale
</Button>


</Box>

)

}


export default SalesForm;