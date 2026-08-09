import api from "./axios";
export const getProductForecast = async (
  productId: number,
  companyId: number,
  forecastPeriod: string
) => {
  const response = await api.get(`/forecast/product/${productId}`, {
    params: {
      forecast_period: forecastPeriod,
    },
  });

  return response.data;
};


export const generateForecast = async (
  productId: number,
  companyId: number,
  forecastPeriod: string
) => {
  const response = await api.post("/forecast/", {
    product_id: productId,
    company_id: companyId,
    forecast_period: forecastPeriod,
  });

  return response.data;
};