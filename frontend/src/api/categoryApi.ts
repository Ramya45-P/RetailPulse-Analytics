import axios from "axios";

const API_URL = "http://127.0.0.1:8000";


const getAuthHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
});


// Get categories
export const getCategories = async (companyId: number) => {

  const response = await axios.get(
    `${API_URL}/categories/`,
    {
      params: {
        company_id: companyId,
      },
      ...getAuthHeader(),
    }
  );

  return response.data;

};



// Create category
export const createCategory = async (category:any) => {

  const response = await axios.post(
    `${API_URL}/categories/`,
    category,
    getAuthHeader()
  );

  return response.data;

};



// Update category
export const updateCategory = async (
  id:number,
  category:any
) => {

  const response = await axios.put(
    `${API_URL}/categories/${id}`,
    category,
    getAuthHeader()
  );

  return response.data;

};



// Delete category
export const deleteCategory = async (id:number) => {

  const response = await axios.delete(
    `${API_URL}/categories/${id}`,
    getAuthHeader()
  );

  return response.data;

};