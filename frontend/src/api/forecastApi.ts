import api from "./axios";

export interface ForecastItem {
  id?: number;
  company_id: number;
  product_id: number;
  predicted_demand: number;
  confidence_score: number;
  recommended_stock: number;
  reorder_recommended: string;
  forecast_period: number;
  historical_average_sales: number;
}

export const getForecasts = async (): Promise<ForecastItem[]> => {
  const response = await api.get("/forecast/");
  return response.data;
};