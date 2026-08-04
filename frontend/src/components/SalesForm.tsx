import { useEffect, useState } from "react";

import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";

import { getProducts } from "../api/productApi";
import { createSale } from "../api/saleApi";
import api from "../api/axios";


interface SalesFormProps {
  refresh: () => void;
}


interface Product {
  id: number;
  name: string;
  unit_price: number;
  category_id: number;
}


interface Customer {
  id: number;
  full_name: string;
}



const SalesForm = ({ refresh }: SalesFormProps) => {


  const companyId =
    Number(localStorage.getItem("company_id"));



  const [products, setProducts] =
    useState<Product[]>([]);



  const [customers, setCustomers] =
    useState<Customer[]>([]);



  const [customerId, setCustomerId] =
    useState<number | null>(null);



  const [productId, setProductId] =
    useState<number | null>(null);



  const [unitPrice, setUnitPrice] =
    useState("");



  const [quantity, setQuantity] =
    useState("1");



  const [discount, setDiscount] =
    useState("0");



  const [tax, setTax] =
    useState("0");



  const [salesChannel, setSalesChannel] =
    useState("Online");



  const [paymentMethod, setPaymentMethod] =
    useState("Cash");



  const [totalAmount, setTotalAmount] =
    useState(0);




  useEffect(() => {

    loadProducts();

    loadCustomers();

  }, []);





  useEffect(() => {

    calculateTotal();

  }, [
    unitPrice,
    quantity,
    discount,
    tax
  ]);





  const loadProducts = async () => {

    try {

     const response =
  await getProducts(companyId);

console.log("Products:", response);

setProducts(response || []); 

    } catch(error) {

      console.error(
        "Product loading error",
        error
      );

    }

  };







  const loadCustomers = async () => {

    try {

      const response =
        await api.get("/customers/");


      setCustomers(
        response.data || []
      );


    } catch(error) {

      console.error(
        "Customer loading error",
        error
      );

    }

  };







  const calculateTotal = () => {


    const price =
      Number(unitPrice) || 0;


    const qty =
      Number(quantity) || 0;


    const discountValue =
      Number(discount) || 0;


    const taxValue =
      Number(tax) || 0;



    const total =
      (price * qty)
      - discountValue
      + taxValue;



    setTotalAmount(
      total > 0 ? total : 0
    );

  };

const submitSale = async () => {


    try {


      const selectedCustomer =
        customers.find(
          (customer) =>
            customer.id === customerId
        );



      const selectedProduct =
        products.find(
          (product) =>
            product.id === productId
        );



      const saleData = {


        company_id: companyId,


        customer_id: customerId,


        customer_name:
          selectedCustomer?.full_name || "",



        product_id: productId,


        category_id:
          selectedProduct?.category_id || 0,



        quantity:
          Number(quantity),



        unit_price:
          Number(unitPrice),



        discount:
          Number(discount),



        tax:
          Number(tax),



        sales_channel:
          salesChannel,



        payment_method:
          paymentMethod

      };




      console.log(
        "Sending Sale:",
        saleData
      );



      await createSale(
        saleData
      );



      alert(
        "Sale created successfully"
      );



      resetForm();


      refresh();



    } catch(error) {


      console.error(
        "Sale creation failed",
        error
      );


      alert(
        "Failed to create sale"
      );

    }

  };








  const resetForm = () => {


    setCustomerId(null);

    setProductId(null);

    setUnitPrice("");

    setQuantity("1");

    setDiscount("0");

    setTax("0");

    setSalesChannel("Online");

    setPaymentMethod("Cash");

    setTotalAmount(0);

  };
    return (

    <Box>

      <Typography
        variant="h6"
        sx={{ mb: 2 }}
      >
        Add Sale Transaction
      </Typography>
      {/* CUSTOMER */}
      <TextField
  select
  fullWidth
  label="Customer"
  value={customerId ?? ""}
  onChange={(e) => setCustomerId(Number(e.target.value))}
  sx={{ mb: 2 }}
>
  {customers.map((customer) => (
    <MenuItem key={customer.id} value={customer.id}>
      {customer.full_name}
    </MenuItem>
  ))}
</TextField>


{/* PRODUCT */}
<TextField
  select
  fullWidth
  label="Product"
  value={productId ?? ""}
  onChange={(e) => {
    const id = Number(e.target.value);

    setProductId(id);

    const selected = products.find((p) => p.id === id);

    if (selected) {
      setUnitPrice(String(selected.unit_price));
    }
  }}
  sx={{ mb: 2 }}
>
  {products.map((product) => (
    <MenuItem key={product.id} value={product.id}>
      {product.name}
    </MenuItem>
  ))}
</TextField>



 <TextField

        fullWidth

        label="Unit Price"

        type="number"

        value={unitPrice}


        onChange={(e) =>

          setUnitPrice(
            e.target.value
          )

        }


        sx={{ mb: 2 }}

      />







      <TextField

        fullWidth

        label="Quantity"

        type="number"

        value={quantity}


        onChange={(e) =>

          setQuantity(
            e.target.value
          )

        }


        sx={{ mb: 2 }}

      />







      <TextField

        fullWidth

        label="Discount"

        type="number"

        value={discount}


        onChange={(e) =>

          setDiscount(
            e.target.value
          )

        }


        sx={{ mb: 2 }}

      />







      <TextField

        fullWidth

        label="Tax"

        type="number"

        value={tax}


        onChange={(e) =>

          setTax(
            e.target.value
          )

        }


        sx={{ mb: 2 }}

      />







      <TextField

        select

        fullWidth

        label="Sales Channel"


        value={salesChannel}


        onChange={(e) =>

          setSalesChannel(
            e.target.value
          )

        }


        sx={{ mb: 2 }}

      >

        <MenuItem value="Online">
          Online
        </MenuItem>


        <MenuItem value="Store">
          Store
        </MenuItem>


        <MenuItem value="Mobile">
          Mobile
        </MenuItem>


      </TextField>







      <TextField

        select

        fullWidth

        label="Payment Method"


        value={paymentMethod}


        onChange={(e) =>

          setPaymentMethod(
            e.target.value
          )

        }


        sx={{ mb: 2 }}

      >

        <MenuItem value="Cash">
          Cash
        </MenuItem>


        <MenuItem value="UPI">
          UPI
        </MenuItem>


        <MenuItem value="Card">
          Card
        </MenuItem>


        <MenuItem value="Online">
          Online
        </MenuItem>


      </TextField>








      <Typography
        variant="h6"
        sx={{ mb: 2 }}
      >

        Total Amount: ₹
        {totalAmount.toLocaleString()}

      </Typography>








      <Box

        sx={{

          display: "flex",

          gap: 2

        }}

      >


        <Button

          variant="contained"

          onClick={submitSale}


          disabled={
            !customerId ||
            !productId
          }

        >

          Submit Sale

        </Button>





        <Button

          variant="outlined"

          onClick={resetForm}

        >

          Reset

        </Button>



      </Box>



    </Box>

  );

};


export default SalesForm;