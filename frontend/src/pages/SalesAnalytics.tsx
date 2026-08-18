import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Alert,
} from "@mui/material";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  getSalesSummary,
  getSalesTrend,
  getProductPerformance,
  getCustomerContribution,
  getPaymentPatterns,
} from "../api/analyticsApi";

export default function SalesAnalytics() {
  const [filterType, setFilterType] = useState("30days");
  const [period, setPeriod] = useState("monthly");

  // =========================================================
  // SALES SUMMARY / KPI QUERY
  // =========================================================

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sales-summary", filterType],
    queryFn: () => getSalesSummary(filterType),
    staleTime: 60000,
  });

  // =========================================================
  // REVENUE TREND QUERY
  // =========================================================

  const {
    data: trendData = [],
    isLoading: trendLoading,
    error: trendError,
  } = useQuery({
    queryKey: ["sales-trend", period, filterType],
    queryFn: () => getSalesTrend(period, filterType),
    staleTime: 60000,
  });

  // =========================================================
  // PRODUCT PERFORMANCE QUERY
  // =========================================================

  const {
    data: productData = [],
    isLoading: productLoading,
    error: productError,
  } = useQuery({
    queryKey: ["sales-products", filterType],
    queryFn: () => getProductPerformance(filterType),
    staleTime: 60000,
  });

  // =========================================================
  // CUSTOMER CONTRIBUTION QUERY
  // =========================================================

  const {
    data: customerData = [],
    isLoading: customerLoading,
    error: customerError,
  } = useQuery({
    queryKey: ["sales-customers", filterType],
    queryFn: () => getCustomerContribution(filterType),
    staleTime: 60000,
  });

  // =========================================================
  // PAYMENT PATTERNS QUERY
  // =========================================================

  const {
    data: paymentData = [],
    isLoading: paymentLoading,
    error: paymentError,
  } = useQuery({
    queryKey: ["sales-payments", filterType],
    queryFn: () => getPaymentPatterns(filterType),
    staleTime: 60000,
  });

  // =========================================================
  // CHART DATA
  // =========================================================

  const chartData = useMemo(
    () =>
      trendData.map((item: any) => ({
        period: item.period,
        revenue: Number(item.revenue ?? 0),
        orders: Number(item.orders ?? 0),
      })),
    [trendData]
  );

  const productChartData = useMemo(
    () =>
      productData.map((item: any) => ({
        product_name: item.product_name,
        quantity_sold: Number(item.quantity_sold ?? 0),
        revenue: Number(item.revenue ?? 0),
      })),
    [productData]
  );

  const customerChartData = useMemo(
    () =>
      customerData.map((item: any) => ({
        customer_name: item.customer_name,
        total_spend: Number(item.total_spend ?? 0),
        orders: Number(item.orders ?? 0),
        average_order_value: Number(
          item.average_order_value ?? 0
        ),
      })),
    [customerData]
  );

  const paymentChartData = useMemo(
    () =>
      paymentData.map((item: any) => ({
        payment_method:
          item.payment_method || "Unknown",
        transactions: Number(
          item.transactions ?? 0
        ),
        revenue: Number(item.revenue ?? 0),
      })),
    [paymentData]
  );

  // =========================================================
  // KPI CARDS
  // =========================================================

  const cards = [
    {
      title: "Total Revenue",
      value: `₹${Number(
        data?.total_revenue ?? 0
      ).toLocaleString("en-IN")}`,
    },
    {
      title: "Total Orders",
      value: data?.total_orders ?? 0,
    },
    {
      title: "Average Order Value",
      value: `₹${Number(
        data?.average_order_value ?? 0
      ).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    },
    {
      title: "Total Items Sold",
      value: data?.total_items_sold ?? 0,
    },
    {
      title: "Total Discount",
      value: `₹${Number(
        data?.total_discount ?? 0
      ).toLocaleString("en-IN")}`,
    },
    {
      title: "Total Tax",
      value: `₹${Number(
        data?.total_tax ?? 0
      ).toLocaleString("en-IN")}`,
    },
  ];

  // =========================================================
  // PAYMENT PIE COLORS
  // =========================================================

  const paymentColors = [
    "#1976d2",
    "#2e7d32",
    "#ed6c02",
    "#9c27b0",
    "#d32f2f",
  ];

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "1600px",
        mx: "auto",
        p: 3,
      }}
    >
      {/* =====================================================
          PAGE TITLE
      ===================================================== */}

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
      >
        Sales Analytics Dashboard
      </Typography>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <Grid
        container
        spacing={2}
        mb={3}
      >
        {/* DATE RANGE */}

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Date Range</InputLabel>

            <Select
              value={filterType}
              label="Date Range"
              onChange={(e) =>
                setFilterType(e.target.value)
              }
            >
              <MenuItem value="today">
                Today
              </MenuItem>

              <MenuItem value="7days">
                Last 7 Days
              </MenuItem>

              <MenuItem value="30days">
                Last 30 Days
              </MenuItem>

              <MenuItem value="90days">
                Last 90 Days
              </MenuItem>

              <MenuItem value="this_month">
                This Month
              </MenuItem>

              <MenuItem value="last_month">
                Last Month
              </MenuItem>

              <MenuItem value="1year">
                Last 1 Year
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* TREND PERIOD */}

        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Trend View</InputLabel>

            <Select
              value={period}
              label="Trend View"
              onChange={(e) =>
                setPeriod(e.target.value)
              }
            >
              <MenuItem value="daily">
                Daily
              </MenuItem>

              <MenuItem value="weekly">
                Weekly
              </MenuItem>

              <MenuItem value="monthly">
                Monthly
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* =====================================================
          SUMMARY ERROR
      ===================================================== */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          Failed to load sales summary.
        </Alert>
      )}

      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <Grid
        container
        spacing={3}
      >
        {cards.map((card) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            lg={2}
            key={card.title}
          >
            <Card
              sx={{
                height: "100%",
                borderRadius: 3,
                boxShadow: 3,
              }}
            >
              <CardContent>
                <Typography
                  color="text.secondary"
                  mb={1}
                  variant="body2"
                >
                  {card.title}
                </Typography>

                {isLoading ? (
                  <Skeleton
                    width="80%"
                    height={40}
                  />
                ) : (
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                  >
                    {card.value}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* =====================================================
          REVENUE TREND
      ===================================================== */}

      <Card
        sx={{
          mt: 4,
          borderRadius: 3,
          boxShadow: 3,
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            mb={3}
          >
            Revenue Trend
          </Typography>

          {trendError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
            >
              Failed to load revenue trend.
            </Alert>
          )}

          {trendLoading ? (
            <Skeleton
              variant="rectangular"
              height={350}
            />
          ) : chartData.length === 0 ? (
            <Alert severity="info">
              No revenue trend data available
              for the selected period.
            </Alert>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="period"
                  type="category"
                  tickFormatter={(value) => {
                    const date = new Date(value);

                    return date.toLocaleDateString(
                      "en-IN",
                      {
                        month: "short",
                        year: "numeric",
                      }
                    );
                  }}
                />

                <YAxis
                  domain={[0, "auto"]}
                  tickFormatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString("en-IN")}`
                  }
                />

                <Tooltip
                  labelFormatter={(value) => {
                    const date = new Date(value);

                    return date.toLocaleDateString(
                      "en-IN",
                      {
                        month: "long",
                        year: "numeric",
                      }
                    );
                  }}
                  formatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString("en-IN")}`
                  }
                />

                <Line
                  type="linear"
                  dataKey="revenue"
                  stroke="#1976d2"
                  strokeWidth={3}
                  dot={{ r: 7 }}
                  activeDot={{ r: 9 }}
                  isAnimationActive={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* =====================================================
          PRODUCT PERFORMANCE
      ===================================================== */}

      <Card
        sx={{
          mt: 4,
          borderRadius: 3,
          boxShadow: 3,
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            mb={3}
          >
            Product Performance
          </Typography>

          {productError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
            >
              Failed to load product performance.
            </Alert>
          )}

          {productLoading ? (
            <Skeleton
              variant="rectangular"
              height={350}
            />
          ) : productChartData.length === 0 ? (
            <Alert severity="info">
              No product performance data
              available.
            </Alert>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <BarChart
                data={productChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="product_name"
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />

                <YAxis
                  tickFormatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString("en-IN")}`
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString("en-IN")}`
                  }
                />

                <Bar
                  dataKey="revenue"
                  fill="#1976d2"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* =====================================================
          CUSTOMER CONTRIBUTION
      ===================================================== */}

      <Card
        sx={{
          mt: 4,
          borderRadius: 3,
          boxShadow: 3,
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            mb={3}
          >
            Customer Contribution
          </Typography>

          {customerError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
            >
              Failed to load customer contribution.
            </Alert>
          )}

          {customerLoading ? (
            <Skeleton
              variant="rectangular"
              height={350}
            />
          ) : customerChartData.length === 0 ? (
            <Alert severity="info">
              No customer contribution data
              available.
            </Alert>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <BarChart
                data={customerChartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 50,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="customer_name"
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />

                <YAxis
                  tickFormatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString("en-IN")}`
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString("en-IN")}`
                  }
                />

                <Bar
                  dataKey="total_spend"
                  fill="#2e7d32"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* =====================================================
          PAYMENT PATTERNS
      ===================================================== */}

      <Card
        sx={{
          mt: 4,
          borderRadius: 3,
          boxShadow: 3,
          mb: 4,
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            mb={3}
          >
            Payment Patterns
          </Typography>

          {paymentError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
            >
              Failed to load payment patterns.
            </Alert>
          )}

          {paymentLoading ? (
            <Skeleton
              variant="rectangular"
              height={350}
            />
          ) : paymentChartData.length === 0 ? (
            <Alert severity="info">
              No payment pattern data
              available.
            </Alert>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <PieChart>
                <Pie
                  data={paymentChartData}
                  dataKey="revenue"
                  nameKey="payment_method"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {paymentChartData.map(
                    (_entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          paymentColors[
                            index %
                              paymentColors.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip
                  formatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString("en-IN")}`
                  }
                />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}