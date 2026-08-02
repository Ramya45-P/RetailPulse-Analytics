import api from "./axios";


export interface Sale {
  id: number;
  invoice_number: string;
  customer_name: string;
  sales_channel: string;
  payment_method: string;
  total_amount: number;
}


export const getSales = async () => {

  const response = await api.get("/sales/");

  return response.data;

};


export const createSale = async (data:any) => {

  const response = await api.post("/sales/", data);

  return response.data;

};


export const deleteSale = async(id:number)=>{

  const response = await api.delete(`/sales/${id}`);

  return response.data;

};