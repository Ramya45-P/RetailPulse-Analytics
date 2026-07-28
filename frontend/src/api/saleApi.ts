import axios from "./axios";

export interface Sale {
  id: number;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
}


export const getSales = async (companyId: number) => {
  const response = await axios.get(
    `/sales/?company_id=${companyId}`
  );

  return response.data;
};


export const createSale = async (data: any) => {
  const response = await axios.post(
    "/sales/",
    data
  );

  return response.data;
};


export const deleteSale = async (id: number) => {
  const response = await axios.delete(
    `/sales/${id}`
  );

  return response.data;
};