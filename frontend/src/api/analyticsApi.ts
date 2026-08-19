import api from "./axios";

export interface AnalyticsFilters {
  filterType: string;
  startDate?: string;
  endDate?: string;
  productId?: number | "";
  categoryId?: number | "";
  customerId?: number | "";
  paymentMethod?: string;
}

const buildParams = (filters: AnalyticsFilters) => {
  const params: Record<string, string | number> = {
    filter_type: filters.filterType,
  };

  if (filters.filterType === "custom") {
    if (filters.startDate) {
      params.start_date = filters.startDate;
    }

    if (filters.endDate) {
      params.end_date = filters.endDate;
    }
  }

  if (filters.productId !== undefined && filters.productId !== "") {
    params.product_id = filters.productId;
  }

  if (filters.categoryId !== undefined && filters.categoryId !== "") {
    params.category_id = filters.categoryId;
  }

  if (filters.customerId !== undefined && filters.customerId !== "") {
    params.customer_id = filters.customerId;
  }

  if (
    filters.paymentMethod !== undefined &&
    filters.paymentMethod !== ""
  ) {
    params.payment_method = filters.paymentMethod;
  }

  return params;
};

/**
 * Sales Summary / KPI Analytics
 */
export const getSalesSummary = async (
  filters: AnalyticsFilters
) => {
  const { data } = await api.get(
    "/analytics/sales/summary",
    {
      params: buildParams(filters),
    }
  );

  return data;
};

/**
 * Sales Revenue Trend
 */
export const getSalesTrend = async (
  period: string,
  filters: AnalyticsFilters
) => {
  const { data } = await api.get(
    "/analytics/sales/trend",
    {
      params: {
        ...buildParams(filters),
        period,
      },
    }
  );

  return data;
};

/**
 * Product Performance
 */
export const getProductPerformance = async (
  filters: AnalyticsFilters,
  sortBy: string = "revenue"
) => {
  const { data } = await api.get(
    "/analytics/sales/products",
    {
      params: {
        ...buildParams(filters),
        sort_by: sortBy,
      },
    }
  );

  return data;
};

/**
 * Customer Contribution
 */
export const getCustomerContribution = async (
  filters: AnalyticsFilters
) => {
  const { data } = await api.get(
    "/analytics/sales/customers",
    {
      params: buildParams(filters),
    }
  );

  return data;
};

/**
 * Payment Method Analytics
 */
export const getPaymentPatterns = async (
  filters: AnalyticsFilters
) => {
  const { data } = await api.get(
    "/analytics/sales/payment-methods",
    {
      params: buildParams(filters),
    }
  );

  return data;
};