import api from "./axios";

export interface Sale {
  id: number;
  company_id: number;
  customer_id: number | null;
  invoice_number: string;
  customer_name: string;
  sale_date: string;
  sales_channel: string;
  payment_method: string;
  total_amount: number;
  created_at: string;
}

export interface SaleItem {
  id: number;
  product_id: number;
  category_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
  product_name: string | null;
  sku: string | null;
  category_name: string | null;
}

export interface SaleDetail extends Sale {
  items: SaleItem[];
}

export interface SaleUpdateData {
  customer_id: number;
  customer_name: string;
  product_id: number;
  category_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  sales_channel: string;
  payment_method: string;
}

// Get all sales
export const getSales = async (
  companyId?: number
) => {
  const response = await api.get(
    "/sales/",
    {
      params: companyId
        ? {
            company_id: companyId,
          }
        : undefined,
    }
  );

  return response.data;
};

// Get one sale with complete details
export const getSaleDetails = async (
  id: number
) => {
  const response = await api.get(
    `/sales/${id}`
  );

  return response.data;
};

// Create sale
export const createSale = async (
  data: any
) => {
  const response = await api.post(
    "/sales/",
    data
  );

  return response.data;
};

// Update sale
export const updateSale = async (
  id: number,
  data: SaleUpdateData
) => {
  const response = await api.put(
    `/sales/${id}`,
    data
  );

  return response.data;
};

// Delete sale
export const deleteSale = async (
  id: number
) => {
  const response = await api.delete(
    `/sales/${id}`
  );

  return response.data;
};