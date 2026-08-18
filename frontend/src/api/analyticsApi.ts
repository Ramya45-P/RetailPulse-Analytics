import api from "./axios";

/**
 * Get Sales Summary / KPI data
 *
 * Returns:
 * - total_revenue
 * - total_orders
 * - average_order_value
 * - total_items_sold
 * - total_discount
 * - total_tax
 */
export const getSalesSummary = async (
  filterType: string = "30days"
) => {
  const { data } = await api.get("/analytics/sales/summary", {
    params: {
      filter_type: filterType,
    },
  });

  return data;
};

/**
 * Get Sales Revenue Trend
 *
 * period:
 * - daily
 * - weekly
 * - monthly
 *
 * filterType:
 * - 7days
 * - 30days
 * - 90days
 * - 1year
 */
export const getSalesTrend = async (
  period: string = "monthly",
  filterType: string = "30days"
) => {
  const { data } = await api.get("/analytics/sales/trend", {
    params: {
      period,
      filter_type: filterType,
    },
  });

  return data;
};

/**
 * Get Product Performance Analytics
 */
export const getProductPerformance = async (
  filterType: string = "30days"
) => {
  const { data } = await api.get("/analytics/sales/products", {
    params: {
      filter_type: filterType,
    },
  });

  return data;
};

/**
 * Get Customer Contribution Analytics
 */
export const getCustomerContribution = async (
  filterType: string = "30days"
) => {
  const { data } = await api.get("/analytics/sales/customers", {
    params: {
      filter_type: filterType,
    },
  });

  return data;
};

/**
 * Get Payment Method Analytics
 */
export const getPaymentPatterns = async (
  filterType: string = "30days"
) => {
  const { data } = await api.get(
    "/analytics/sales/payment-methods",
    {
      params: {
        filter_type: filterType,
      },
    }
  );

  return data;
};
