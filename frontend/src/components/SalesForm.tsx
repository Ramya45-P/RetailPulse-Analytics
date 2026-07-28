import { useEffect, useState } from "react";

import {
  Button,
  TextField,
  Box,
  MenuItem,
  Typography,
} from "@mui/material";

import { getProducts } from "../api/productApi";
import { createSale } from "../api/saleApi";


const SalesForm = ({ refresh }: { refresh: () => void }) => {

  const companyId = Number(localStorage.getItem("company_id")) || 1;

  const [products, setProducts] = useState<any[]>([]);


  const initialForm = {
    company_id: companyId,
    customer_name: "",
    product_id: "",
    category_id: 0,
    quantity: 1,
    unit_price: 0,
    discount: 0,
    tax: 0,
    sales_channel: "Retail Store",
    payment_method: "Cash",
  };


  const [form, setForm] = useState(initialForm);



  useEffect(() => {
    loadProducts();
  }, []);



  const loadProducts = async () => {

    try {

      const response = await getProducts(companyId);

      console.log("Products Response:", response);


      let productList:any[] = [];


      if(Array.isArray(response)){
        productList = response;
      }
      else if(Array.isArray(response.data)){
        productList = response.data;
      }
      else if(response.data?.products){
        productList = response.data.products;
      }


      console.log("Product List:", productList);


      setProducts(productList);



      if(productList.length > 0){

        setForm((prev)=>({

          ...prev,

          product_id: productList[0].id,

          category_id: productList[0].category_id,

          unit_price: productList[0].unit_price,

        }));

      }


    }
    catch(error){

      console.log("Loading products failed:",error);

      setProducts([]);

    }

  };




  const handleChange=(e:any)=>{

    const {name,value}=e.target;


    setForm({

      ...form,


      [name]:

      ["quantity","discount","tax"].includes(name)

      ? Number(value)

      : value

    });

  };





  const handleProductChange=(e:any)=>{


    const selected = products.find(

      (p)=>p.id===Number(e.target.value)

    );


    if(!selected) return;



    setForm((prev)=>({

      ...prev,

      product_id:selected.id,

      category_id:selected.category_id,

      unit_price:selected.unit_price,

    }));

  };





  const totalAmount =

    Number(form.quantity) *

    Number(form.unit_price)

    -

    Number(form.discount)

    +

    Number(form.tax);





  const submitSale = async()=>{


    try{


      await createSale({

        ...form,

        product_id:Number(form.product_id),

        quantity:Number(form.quantity),

        unit_price:Number(form.unit_price),

        discount:Number(form.discount),

        tax:Number(form.tax),

      });



      alert("Sale Added Successfully");


      setForm({

        ...initialForm,

        product_id: products.length ? products[0].id : "",

        category_id: products.length ? products[0].category_id : 0,

        unit_price: products.length ? products[0].unit_price : 0,

      });



      refresh();


    }

    catch(error){

      console.error(error);

      alert("Failed to add sale");

    }


  };





  return (

<Box

sx={{

mb:4,

display:"flex",

flexDirection:"column",

gap:2,

maxWidth:450,

}}

>



<Typography

variant="h6"

fontWeight="bold"

>

Add Sale Transaction

</Typography>





<TextField

label="Customer Name"

name="customer_name"

value={form.customer_name}

onChange={handleChange}

fullWidth

/>





<TextField

select

label="Product"

value={form.product_id}

onChange={handleProductChange}

fullWidth

>


{

products.length > 0 ? (

products.map((product)=>(

<MenuItem

key={product.id}

value={product.id}

>

{product.name}

</MenuItem>

))

)

:(

<MenuItem disabled>

No Products Available

</MenuItem>

)

}


</TextField>





<TextField

label="Unit Price"

value={form.unit_price}

InputProps={{

readOnly:true

}}

fullWidth

/>





<TextField

label="Quantity"

name="quantity"

type="number"

value={form.quantity}

onChange={handleChange}

fullWidth

/>





<TextField

label="Discount"

name="discount"

type="number"

value={form.discount}

onChange={handleChange}

fullWidth

/>





<TextField

label="Tax"

name="tax"

type="number"

value={form.tax}

onChange={handleChange}

fullWidth

/>





<TextField

select

label="Sales Channel"

name="sales_channel"

value={form.sales_channel}

onChange={handleChange}

fullWidth

>


<MenuItem value="Retail Store">

Retail Store

</MenuItem>


<MenuItem value="Online Store">

Online Store

</MenuItem>


<MenuItem value="Marketplace">

Marketplace

</MenuItem>


</TextField>





<TextField

select

label="Payment Method"

name="payment_method"

value={form.payment_method}

onChange={handleChange}

fullWidth

>


<MenuItem value="Cash">

Cash

</MenuItem>


<MenuItem value="Card">

Card

</MenuItem>


<MenuItem value="UPI">

UPI

</MenuItem>


<MenuItem value="Bank Transfer">

Bank Transfer

</MenuItem>


</TextField>





<Typography

variant="h6"

color="primary"

>

Total Amount: ₹ {totalAmount.toFixed(2)}

</Typography>





<Button

variant="contained"

color="primary"

onClick={submitSale}

disabled={products.length===0}

>

Add Sale

</Button>



</Box>

  );

};


export default SalesForm;