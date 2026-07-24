import axios from "./axios";

export const getInventory = async (company_id: number) => {
  const response = await axios.get("/inventory/", {
    params: {
      company_id,
    },
  });

  return response.data;
};