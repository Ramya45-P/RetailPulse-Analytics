import api from "./axios";

export interface InventoryForecastItem {
  product_id: number;
  product_name: string;
  sku: string;
  category_id: number;

  current_stock: number;
  reserved_stock: number;
  available_stock: number;

  total_units_sold: number;
  average_daily_demand: number;

  // Backend field
  predicted_demand: number;

  // Frontend-compatible field
  forecasted_demand: number;

  // Safety stock
  safety_stock: number;

  reorder_point: number;

  // Backend field
  reorder_quantity: number;

  // Frontend-compatible field
  recommended_reorder_quantity: number;

  // Backend field
  stock_status: string;

  // Frontend-compatible field
  stock_risk: string;

  reorder_required: boolean;

  // Optional fields used by the frontend
  days_of_stock_remaining: number | null;
  supplier_name?: string;
  recommendation?: string;
}

export interface InventoryForecastResponse {
  summary: {
    total_products: number;
    products_requiring_reorder: number;
    out_of_stock: number;
    stockout_risk: number;
    low_stock: number;
    overstock: number;
    healthy: number;
  };

  data: InventoryForecastItem[];
}

export const getInventoryRecommendations =
  async (): Promise<InventoryForecastResponse> => {
    const response = await api.get<{
      summary: InventoryForecastResponse["summary"];
      data: any[];
    }>("/inventory/recommendations");

    const backendData = response.data;

    const products: InventoryForecastItem[] =
      (backendData.data ?? []).map((product) => ({
        ...product,

        // Backend → Frontend
        forecasted_demand:
          Number(product.predicted_demand ?? 0),

        recommended_reorder_quantity:
          Number(product.reorder_quantity ?? 0),

        safety_stock:
          Number(product.safety_stock ?? 0),

        stock_risk:
          product.stock_status ?? "Healthy",

        // Calculate days remaining safely
        days_of_stock_remaining:
          Number(product.average_daily_demand ?? 0) > 0
            ? Number(product.available_stock ?? 0) /
              Number(product.average_daily_demand)
            : null,

        supplier_name:
          product.supplier_name ?? "",

        recommendation:
          product.recommendation ??
          (product.reorder_required
            ? "Reorder Required"
            : "No Reorder Needed"),
      }));

    return {
      summary: backendData.summary,
      data: products,
    };
  };