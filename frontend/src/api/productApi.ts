import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const getProducts = (
  companyId: number,
  filters: any = {}
) => {

  const params: any = {
    company_id: companyId,
  };


  if (filters.search) {
    params.search = filters.search;
  }


  if (filters.status) {
    params.status = filters.status;
  }


  if (filters.category_id) {
    params.category_id = filters.category_id;
  }


  if (filters.brand) {
    params.brand = filters.brand;
  }


  return axios.get(
    `${API_URL}/products/`,
    {
      params
    }
  );
};




export const createProduct = (
  data:any
)=>{
  return axios.post(
    `${API_URL}/products/`,
    data
  );
};



export const updateProduct = (
  id:number,
  data:any
)=>{
  return axios.put(
    `${API_URL}/products/${id}`,
    data
  );
};



export const deleteProduct = (
  id:number
)=>{
  return axios.delete(
    `${API_URL}/products/${id}`
  );
};