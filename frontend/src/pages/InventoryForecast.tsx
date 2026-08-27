// src/pages/InventoryForecast.tsx

import { useMemo, useState } from "react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { useQuery } from "@tanstack/react-query";

import {
  getInventoryRecommendations,
} from "../api/inventoryForecastApi";

import type {
  InventoryForecastItem,
} from "../api/inventoryForecastApi";

import { getForecasts } from "../api/forecastApi";

import type {
  ForecastItem,
} from "../api/forecastApi";

import { getCategories } from "../api/categoriesApi";

const InventoryForecast = () => {
  // =========================
  // FILTER STATES
  // =========================

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [reorderFilter, setReorderFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [supplierFilter, setSupplierFilter] = useState("All");
  const [productFilter, setProductFilter] = useState("All");

  // =========================
  // SORT STATES
  // =========================

  const [sortBy, setSortBy] = useState("Product");
  const [sortOrder, setSortOrder] = useState("asc");

  // =========================
  // COMPARISON PRODUCT
  // =========================

  const [comparisonProductId, setComparisonProductId] =
    useState<string>("");

  // =========================
  // COMPANY ID
  // =========================

  const companyId = Number(
    localStorage.getItem("company_id")
  );

  // =========================
  // INVENTORY RECOMMENDATIONS API
  // =========================

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["inventory-recommendations"],
    queryFn: getInventoryRecommendations,
  });

  // =========================
  // FORECAST API
  // =========================

  const {
    data: forecastData,
    isLoading: isForecastLoading,
    isError: isForecastError,
  } = useQuery<ForecastItem[]>({
    queryKey: ["forecasts"],
    queryFn: getForecasts,
  });

  // =========================
  // CATEGORIES API
  // =========================

  const {
    data: categoryData,
    isLoading: isCategoriesLoading,
  } = useQuery({
    queryKey: ["categories", companyId],
    queryFn: () => getCategories(companyId),
    enabled: !!companyId,
  });

  // =========================
  // DATA
  // =========================

  const products: InventoryForecastItem[] =
    data?.data ?? [];

  const summary = data?.summary;

  const forecasts: ForecastItem[] =
    forecastData ?? [];

  // =========================
  // RESET FILTERS
  // =========================

  const resetFilters = () => {
    setSearch("");
    setRiskFilter("All");
    setReorderFilter("All");
    setCategoryFilter("All");
    setSupplierFilter("All");
    setProductFilter("All");
    setSortBy("Product");
    setSortOrder("asc");
  };

  // =========================
  // TOTAL RECOMMENDED UNITS
  // =========================

  const totalRecommendedUnits = useMemo(() => {
    return products.reduce(
      (total, product) =>
        total +
        (product.recommended_reorder_quantity ?? 0),
      0
    );
  }, [products]);

  // =========================
  // FILTER OPTIONS
  // =========================

  const categories = useMemo(() => {
    if (!Array.isArray(categoryData)) {
      return [];
    }

    return categoryData;
  }, [categoryData]);

  const suppliers = useMemo(() => {
    return [
      ...new Set(
        products
          .map((product) => product.supplier_name)
          .filter(Boolean)
      ),
    ];
  }, [products]);

  const productNames = useMemo(() => {
    return [
      ...new Set(
        products
          .map((product) =>
            String(product.product_name ?? "")
          )
          .filter(
            (name) => name.trim() !== ""
          )
      ),
    ];
  }, [products]);

  // =========================
  // FILTER + SORT
  // =========================

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const searchValue =
        search.trim().toLowerCase();

      const productName = String(
        product.product_name ?? ""
      ).toLowerCase();

      const sku = String(
        product.sku ?? ""
      ).toLowerCase();

      const matchesSearch =
        searchValue === "" ||
        productName.includes(searchValue) ||
        sku.includes(searchValue);

      const matchesRisk =
        riskFilter === "All" ||
        product.stock_risk === riskFilter;

      const reorderRequired =
        product.reorder_required === true;

      const matchesReorder =
        reorderFilter === "All" ||
        (reorderFilter === "Required"
          ? reorderRequired
          : !reorderRequired);

      const matchesCategory =
        categoryFilter === "All" ||
        product.category_id ===
          Number(categoryFilter);

      const matchesSupplier =
        supplierFilter === "All" ||
        product.supplier_name ===
          supplierFilter;

      const matchesProduct =
        productFilter === "All" ||
        product.product_name ===
          productFilter;

      return (
        matchesSearch &&
        matchesRisk &&
        matchesReorder &&
        matchesCategory &&
        matchesSupplier &&
        matchesProduct
      );
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "Product":
          comparison =
            a.product_name.localeCompare(
              b.product_name
            );
          break;

        case "Current Stock":
          comparison =
            a.current_stock -
            b.current_stock;
          break;

        case "Forecast Demand":
          comparison =
            a.forecasted_demand -
            b.forecasted_demand;
          break;

        case "Days Remaining":
          if (
            a.days_of_stock_remaining === null &&
            b.days_of_stock_remaining === null
          ) {
            comparison = 0;
          } else if (
            a.days_of_stock_remaining === null
          ) {
            comparison = 1;
          } else if (
            b.days_of_stock_remaining === null
          ) {
            comparison = -1;
          } else {
            comparison =
              a.days_of_stock_remaining -
              b.days_of_stock_remaining;
          }
          break;

        case "Reorder Point":
          comparison =
            a.reorder_point -
            b.reorder_point;
          break;

        case "Recommended Qty":
          comparison =
            a.recommended_reorder_quantity -
            b.recommended_reorder_quantity;
          break;

        case "Risk": {
          const riskOrder: Record<
            string,
            number
          > = {
            "Out of Stock": 1,
            "Stockout Risk": 2,
            "Low Stock": 3,
            Healthy: 4,
            Overstock: 5,
          };

          comparison =
            (riskOrder[a.stock_risk] ?? 99) -
            (riskOrder[b.stock_risk] ?? 99);

          break;
        }

        default:
          comparison = 0;
      }

      return sortOrder === "asc"
        ? comparison
        : -comparison;
    });
  }, [
    products,
    search,
    riskFilter,
    reorderFilter,
    categoryFilter,
    supplierFilter,
    productFilter,
    sortBy,
    sortOrder,
  ]);

  // =========================
  // CHART DATA
  // =========================

  const chartData = useMemo(() => {
    return filteredProducts.map((product) => ({
      product: product.product_name,
      currentStock: product.current_stock,
      forecastDemand:
        product.forecasted_demand,
      safetyStock: product.safety_stock,
      reorderPoint: product.reorder_point,
    }));
  }, [filteredProducts]);

  // =========================
  // COMPARISON PRODUCT
  // =========================

  const comparisonProduct = useMemo(() => {
    if (!comparisonProductId) {
      return null;
    }

    return (
      products.find(
        (product) =>
          String(product.product_id) ===
          comparisonProductId
      ) ?? null
    );
  }, [
    products,
    comparisonProductId,
  ]);

  // =========================
  // RISK COLOR
  // =========================

  const getRiskColor = (
    risk: string
  ):
    | "error"
    | "warning"
    | "info"
    | "success" => {
    switch (risk) {
      case "Out of Stock":
      case "Stockout Risk":
        return "error";

      case "Low Stock":
        return "warning";

      case "Overstock":
        return "info";

      default:
        return "success";
    }
  };

  // =========================
  // LOADING
  // =========================

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (isError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load inventory forecast.
          {error instanceof Error
            ? ` ${error.message}`
            : ""}
        </Alert>
      </Box>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <Box p={3}>
      <Typography
        variant="h4"
        fontWeight={700}
        mb={3}
      >
        Inventory Forecast
      </Typography>

      {/* =========================
          SUMMARY
          ========================= */}

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Total Products
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
              >
                {summary?.total_products ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Products Requiring Reorder
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
              >
                {summary?.products_requiring_reorder ??
                  0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Stockout Risk
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
              >
                {summary?.stockout_risk ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Overstock
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
              >
                {summary?.overstock ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Recommended Reorder Units
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
              >
                {totalRecommendedUnits}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Healthy Products
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
              >
                {summary?.healthy ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* =========================
          FILTERS
          ========================= */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Search Product / SKU"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </Grid>

            <Grid
              size={{ xs: 12, sm: 6, md: 2 }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Product
                </InputLabel>

                <Select
                  value={productFilter}
                  label="Product"
                  onChange={(e) =>
                    setProductFilter(
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="All">
                    All Products
                  </MenuItem>

                  {productNames.map(
                    (productName) => (
                      <MenuItem
                        key={productName}
                        value={productName}
                      >
                        {productName}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{ xs: 12, sm: 6, md: 2 }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Category
                </InputLabel>

                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) =>
                    setCategoryFilter(
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="All">
                    All Categories
                  </MenuItem>

                  {isCategoriesLoading ? (
                    <MenuItem disabled>
                      Loading categories...
                    </MenuItem>
                  ) : (
                    categories.map(
                      (category: any) => (
                        <MenuItem
                          key={category.id}
                          value={String(
                            category.id
                          )}
                        >
                          {category.name}
                        </MenuItem>
                      )
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{ xs: 12, sm: 6, md: 2 }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Supplier
                </InputLabel>

                <Select
                  value={supplierFilter}
                  label="Supplier"
                  onChange={(e) =>
                    setSupplierFilter(
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="All">
                    All Suppliers
                  </MenuItem>

                  {suppliers.map(
                    (supplier) => (
                      <MenuItem
                        key={supplier}
                        value={supplier}
                      >
                        {supplier}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{ xs: 12, sm: 6, md: 3 }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Stock Risk
                </InputLabel>

                <Select
                  value={riskFilter}
                  label="Stock Risk"
                  onChange={(e) =>
                    setRiskFilter(
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="All">
                    All
                  </MenuItem>

                  <MenuItem value="Out of Stock">
                    Out of Stock
                  </MenuItem>

                  <MenuItem value="Stockout Risk">
                    Stockout Risk
                  </MenuItem>

                  <MenuItem value="Low Stock">
                    Low Stock
                  </MenuItem>

                  <MenuItem value="Healthy">
                    Healthy
                  </MenuItem>

                  <MenuItem value="Overstock">
                    Overstock
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{ xs: 12, sm: 6, md: 3 }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Reorder
                </InputLabel>

                <Select
                  value={reorderFilter}
                  label="Reorder"
                  onChange={(e) =>
                    setReorderFilter(
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="All">
                    All
                  </MenuItem>

                  <MenuItem value="Required">
                    Reorder Required
                  </MenuItem>

                  <MenuItem value="Not Required">
                    No Reorder
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{ xs: 12, sm: 6, md: 3 }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Sort By
                </InputLabel>

                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) =>
                    setSortBy(
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="Product">
                    Product Name
                  </MenuItem>

                  <MenuItem value="Current Stock">
                    Current Stock
                  </MenuItem>

                  <MenuItem value="Forecast Demand">
                    Forecast Demand
                  </MenuItem>

                  <MenuItem value="Days Remaining">
                    Days Remaining
                  </MenuItem>

                  <MenuItem value="Reorder Point">
                    Reorder Point
                  </MenuItem>

                  <MenuItem value="Recommended Qty">
                    Recommended Qty
                  </MenuItem>

                  <MenuItem value="Risk">
                    Risk
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{ xs: 12, sm: 6, md: 3 }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Sort Order
                </InputLabel>

                <Select
                  value={sortOrder}
                  label="Sort Order"
                  onChange={(e) =>
                    setSortOrder(
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="asc">
                    Ascending
                  </MenuItem>

                  <MenuItem value="desc">
                    Descending
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <Button
                fullWidth
                variant="outlined"
                onClick={resetFilters}
                sx={{ height: "56px" }}
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* =========================
          CHART
          ========================= */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={700}
            mb={2}
          >
            Inventory Forecast Overview
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mb={3}
          >
            Current stock compared with
            forecast demand and reorder
            point.
          </Typography>

          <Box
            sx={{
              width: "100%",
              height: 400,
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 10,
                  bottom: 60,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="product"
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />

                <YAxis />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="currentStock"
                  name="Current Stock"
                  fill="#1976d2"
                />

                <Bar
                  dataKey="forecastDemand"
                  name="Forecast Demand"
                  fill="#2e7d32"
                />

                <Bar
                  dataKey="reorderPoint"
                  name="Reorder Point"
                  fill="#ed6c02"
                />

                <Bar
                  dataKey="safetyStock"
                  name="Safety Stock"
                  fill="#9c27b0"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* =========================
          RECOMMENDATION COMPARISON
          ========================= */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={700}
            mb={2}
          >
            Recommendation Comparison
          </Typography>

          <FormControl
            fullWidth
            sx={{ mb: 3 }}
          >
            <InputLabel>
              Select Product
            </InputLabel>

            <Select
              value={comparisonProductId}
              label="Select Product"
              onChange={(e) =>
                setComparisonProductId(
                  e.target.value
                )
              }
            >
              <MenuItem value="">
                Select a product
              </MenuItem>

              {products.map((product) => (
                <MenuItem
                  key={product.product_id}
                  value={String(
                    product.product_id
                  )}
                >
                  {product.product_name} (
                  {product.sku})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {!comparisonProduct ? (
            <Alert severity="info">
              Select a product to compare
              its inventory position and
              reorder recommendation.
            </Alert>
          ) : (
            <>
              <Typography
                variant="h6"
                fontWeight={700}
                mb={2}
              >
                {comparisonProduct.product_name}
              </Typography>

              <Grid container spacing={2}>
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3,
                  }}
                >
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary">
                        Current Stock
                      </Typography>

                      <Typography
                        variant="h5"
                        fontWeight={700}
                      >
                        {
                          comparisonProduct.current_stock
                        }
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3,
                  }}
                >
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary">
                        Forecast Demand
                      </Typography>

                      <Typography
                        variant="h5"
                        fontWeight={700}
                      >
                        {Number(
                          comparisonProduct.forecasted_demand
                        ).toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3,
                  }}
                >
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary">
                        Reorder Point
                      </Typography>

                      <Typography
                        variant="h5"
                        fontWeight={700}
                      >
                        {
                          comparisonProduct.reorder_point
                        }
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3,
                  }}
                >
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary">
                        Recommended Qty
                      </Typography>

                      <Typography
                        variant="h5"
                        fontWeight={700}
                        color={
                          comparisonProduct.reorder_required
                            ? "error.main"
                            : "success.main"
                        }
                      >
                        {
                          comparisonProduct.recommended_reorder_quantity
                        }
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 4,
                  }}
                >
                  <Card variant="outlined">
                    <CardContent>
                      <Typography color="text.secondary">
                        Days Remaining
                      </Typography>

                      <Typography
                        variant="h5"
                        fontWeight={700}
                      >
                        {comparisonProduct.days_of_stock_remaining ===
                        null
                          ? "N/A"
                          : `${Number(
                              comparisonProduct.days_of_stock_remaining
                            ).toFixed(
                              1
                            )} days`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 4,
                  }}
                >
                  <Card variant="outlined">
                    <CardContent>
                      <Typography
                        color="text.secondary"
                        mb={1}
                      >
                        Stock Risk
                      </Typography>

                      <Chip
                        label={
                          comparisonProduct.stock_risk
                        }
                        color={getRiskColor(
                          comparisonProduct.stock_risk
                        )}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 4,
                  }}
                >
                  <Card variant="outlined">
                    <CardContent>
                      <Typography
                        color="text.secondary"
                        mb={1}
                      >
                        Reorder Decision
                      </Typography>

                      <Chip
                        label={
                          comparisonProduct.reorder_required
                            ? "Reorder Required"
                            : "No Reorder Needed"
                        }
                        color={
                          comparisonProduct.reorder_required
                            ? "warning"
                            : "success"
                        }
                      />
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography
                        color="text.secondary"
                        mb={1}
                      >
                        Recommendation
                      </Typography>

                      <Typography
                        variant="body1"
                        fontWeight={600}
                      >
                        {comparisonProduct.reorder_required
                          ? comparisonProduct.recommendation
                          : "No Reorder Needed"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </CardContent>
      </Card>

      {/* =========================
          FORECAST DETAILS
          ========================= */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={700}
            mb={1}
          >
            Forecast Details
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mb={2}
          >
            Forecast predictions generated
            for different forecast periods.
          </Typography>

          {isForecastLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              py={4}
            >
              <CircularProgress />
            </Box>
          ) : isForecastError ? (
            <Alert severity="error">
              Failed to load forecast details.
            </Alert>
          ) : forecasts.length === 0 ? (
            <Alert severity="info">
              No forecast records available.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Product
                    </TableCell>

                    <TableCell>
                      SKU
                    </TableCell>

                    <TableCell>
                      Forecast Period
                    </TableCell>

                    <TableCell>
                      Predicted Demand
                    </TableCell>

                    <TableCell>
                      Historical Avg Sales
                    </TableCell>

                    <TableCell>
                      Confidence
                    </TableCell>

                    <TableCell>
                      Recommended Stock
                    </TableCell>

                    <TableCell>
                      Reorder Recommendation
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {forecasts.map(
                    (
                      forecast,
                      index
                    ) => {
                      const product =
                        products.find(
                          (item) =>
                            item.product_id ===
                            forecast.product_id
                        );

                      return (
                        <TableRow
                          key={
                            forecast.id ??
                            `${forecast.product_id}-${forecast.forecast_period}-${index}`
                          }
                          hover
                        >
                          <TableCell>
                            <Typography fontWeight={600}>
                              {product?.product_name ??
                                `Product ${forecast.product_id}`}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {product?.sku ?? "N/A"}
                          </TableCell>

                          <TableCell>
                            {forecast.forecast_period ===
                            7
                              ? "Next 7 Days"
                              : forecast.forecast_period ===
                                30
                              ? "Next 30 Days"
                              : forecast.forecast_period ===
                                90
                              ? "Next 90 Days"
                              : `${forecast.forecast_period} Days`}
                          </TableCell>

                          <TableCell>
                            {Number(
                              forecast.predicted_demand
                            ).toFixed(2)}
                          </TableCell>

                          <TableCell>
                            {Number.isFinite(
                              Number(
                                forecast.historical_average_sales
                              )
                            )
                              ? Number(
                                  forecast.historical_average_sales
                                ).toFixed(2)
                              : "N/A"}
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={`${forecast.confidence_score}%`}
                              color={
                                forecast.confidence_score >=
                                80
                                  ? "success"
                                  : "warning"
                              }
                              size="small"
                            />
                          </TableCell>

                          <TableCell>
                            {Number(
                              forecast.recommended_stock
                            ).toFixed(2)}
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={
                                forecast.reorder_recommended
                              }
                              color={
                                forecast.reorder_recommended
                                  .toLowerCase()
                                  .includes("no")
                                  ? "success"
                                  : "warning"
                              }
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* =========================
          INVENTORY TABLE
          ========================= */}

      <Card>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight={600}
            mb={2}
          >
            Forecast & Replenishment Analysis
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mb={2}
          >
            Showing{" "}
            {filteredProducts.length} of{" "}
            {products.length} products
          </Typography>

          {filteredProducts.length === 0 ? (
            <Alert severity="info">
              No inventory products match
              the selected filters.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Product
                    </TableCell>

                    <TableCell>
                      SKU
                    </TableCell>

                    <TableCell>
                      Current Stock
                    </TableCell>

                    <TableCell>
                      Avg Daily Sales
                    </TableCell>

                    <TableCell>
                      Forecast Demand
                    </TableCell>

                    <TableCell>
                      Days Remaining
                    </TableCell>

                    <TableCell>
                      Reorder Point
                    </TableCell>

                    <TableCell>
                      Recommended Qty
                    </TableCell>

                    <TableCell>
                      Risk
                    </TableCell>

                    <TableCell>
                      Recommendation
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredProducts.map(
                    (
                      product: InventoryForecastItem
                    ) => (
                      <TableRow
                        key={
                          product.product_id
                        }
                        hover
                      >
                        <TableCell>
                          <Typography fontWeight={600}>
                            {
                              product.product_name
                            }
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {product.sku}
                        </TableCell>

                        <TableCell>
                          {product.current_stock}
                        </TableCell>

                        <TableCell>
                          {Number(
                            product.average_daily_demand
                          ).toFixed(2)}
                        </TableCell>

                        <TableCell>
                          {Number(
                            product.forecasted_demand
                          ).toFixed(2)}
                        </TableCell>

                        <TableCell>
                          {product.days_of_stock_remaining ===
                          null
                            ? "N/A"
                            : `${Number(
                                product.days_of_stock_remaining
                              ).toFixed(
                                1
                              )} days`}
                        </TableCell>

                        <TableCell>
                          {
                            product.reorder_point
                          }
                        </TableCell>

                        <TableCell>
                          <Typography
                            fontWeight={700}
                            color={
                              product.reorder_required
                                ? "error.main"
                                : "success.main"
                            }
                          >
                            {
                              product.recommended_reorder_quantity
                            }
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={
                              product.stock_risk
                            }
                            color={getRiskColor(
                              product.stock_risk
                            )}
                            size="small"
                          />
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={
                              product.reorder_required
                                ? product.recommendation
                                : "No Reorder Needed"
                            }
                            color={
                              product.reorder_required
                                ? "warning"
                                : "success"
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default InventoryForecast;