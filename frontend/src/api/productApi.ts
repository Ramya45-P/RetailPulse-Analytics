import axios from "axios";

const API_URL = "http://127.0.0.1:8000";


const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
});


// Get all products
export const getProducts = async (companyId:number) => {

  const response = await axios.get(
    `${API_URL}/products/?company_id=${companyId}`,
    getAuthHeader()
  );

  return response.data;

};



// Create product
export const createProduct = async (product:any) => {

  const response = await axios.post(
    `${API_URL}/products/`,
    product,
    getAuthHeader()
  );

  return response.data;

};



// Update product
export const updateProduct = async (
  id:number,
  product:any
) => {

  const response = await axios.put(
    `${API_URL}/products/${id}`,
    product,
    getAuthHeader()
  );

  return response.data;

};



// Delete product
export const deleteProduct = async (id:number) => {

  const response = await axios.delete(
    `${API_URL}/products/${id}`,
    getAuthHeader()
  );

  return response.data;

};