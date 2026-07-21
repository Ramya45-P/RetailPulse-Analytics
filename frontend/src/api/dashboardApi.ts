import axios from "axios";

const API_URL = "http://127.0.0.1:8000";


export const getDashboardStats = (
  companyId:number
) => {

  return axios.get(
    `${API_URL}/dashboard/stats`,
    {
      params:{
        company_id: companyId
      }
    }
  );

};