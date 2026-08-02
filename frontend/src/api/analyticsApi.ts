import api from "./axios";

export const getAnalyticsDashboard = async () => {
  const token = localStorage.getItem("access_token");
  console.log("Token:", token);

  const response = await api.get("/analytics/dashboard");

  return response.data;
};