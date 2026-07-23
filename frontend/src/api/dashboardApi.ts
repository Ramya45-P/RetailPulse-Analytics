import axios from "./axios";

export const getDashboardStats = async () => {
  const company_id = 1;

  const response = await axios.get(
    `/dashboard/stats?company_id=${company_id}`
  );

  return response.data;
};