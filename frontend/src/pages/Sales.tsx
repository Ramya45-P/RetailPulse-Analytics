import { useEffect,useState } from "react";
import {
Table,
TableBody,
TableCell,
TableHead,
TableRow,
Button
} from "@mui/material";

import {
getSales,
createSale,
deleteSale,
} from "../api/saleApi";

import SalesForm from "../components/SalesForm";


const Sales =()=>{

const [sales,setSales]=useState<any[]>([]);

const loadSales=async()=>{

const data=await getSales(1);

setSales(data);

};


useEffect(()=>{
loadSales();
},[]);



return (

<div>

<h1>Sales</h1>


<SalesForm refresh={loadSales}/>


<Table>

<TableHead>

<TableRow>

<TableCell>Invoice</TableCell>
<TableCell>Customer</TableCell>
<TableCell>Total</TableCell>
<TableCell>Action</TableCell>

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
₹ {sale.total_amount}
</TableCell>


<TableCell>

<Button
color="error"
onClick={async()=>{
await deleteSale(sale.id);
loadSales();
}}
>
Delete
</Button>

</TableCell>


</TableRow>

))
}


</TableBody>

</Table>


</div>

)

}


export default Sales;