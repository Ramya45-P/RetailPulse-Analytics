import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const getCategories = (companyId: number) => {
  return axios.get(`${API_URL}/categories/`, {
    params: {
      company_id: companyId,
    },
  });
};


export const createCategory = (data: any) => {
  return axios.post(
    `${API_URL}/categories/`,
    data
  );
};


export const updateCategory = (
  id: number,
  data: any
) => {
  return axios.put(
    `${API_URL}/categories/${id}`,
    data
  );
};


export const deleteCategory = (
  id: number
) => {
  return axios.delete(
    `${API_URL}/categories/${id}`
  );
};