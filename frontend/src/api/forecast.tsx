import api from "./axios";

export const getProductForecast = async (
  productId: number,
  _companyId: number,
  forecastPeriod: string
) => {
  const response = await api.get(
    `/forecast/product/${productId}`,
    {
      params: {
        forecast_period: forecastPeriod,
      },
    }
  );

  return response.data;
};

export const generateForecast = async (
  productId: number,
  _companyId: number,
  forecastPeriod: string
) => {
  const forecastDays =
    forecastPeriod === "Next 7 Days"
      ? 7
      : forecastPeriod === "Next 30 Days"
      ? 30
      : 90;

  const response = await api.post(
    `/forecast/generate/${productId}`,
    null,
    {
      params: {
        forecast_days: forecastDays,
      },
    }
  );

  return response.data;
};

export const getCategoryForecasts = async (
  _companyId: number,
  forecastPeriod: string
) => {
  const response = await api.get(
    "/forecast/category",
    {
      params: {
        forecast_period: forecastPeriod,
      },
    }
  );

  return response.data;
};

export const getForecastAnalytics = async (
  _companyId: number,
  forecastPeriod: string
) => {
  const response = await api.get(
    "/forecast/analytics",
    {
      params: {
        forecast_period: forecastPeriod,
      },
    }
  );

  return response.data;
};