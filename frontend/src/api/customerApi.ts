import api from "./axios";

export const getCustomers = async () => {
  const response = await api.get("/customers/");
  return response.data;
};

export const createCustomer = async (customer: any) => {
  const response = await api.post("/customers/", customer);
  return response.data;
};

export const deleteCustomer = async (id: number) => {
  const response = await api.delete(`/customers/${id}`);
  return response.data;
};