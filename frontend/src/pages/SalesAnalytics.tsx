import { useMemo, useRef, useState } from "react";
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
  Button,
  Stack,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import api from "../api/axios";

export default function SalesAnalytics() {
  // =====================================================
  // FILTER STATE
  // =====================================================

  const [filterType, setFilterType] = useState("30days");
  const [period, setPeriod] = useState("monthly");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [productId, setProductId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const [productSort, setProductSort] = useState("revenue");

  const [exporting, setExporting] = useState(false);

  const dashboardRef = useRef<HTMLDivElement>(null);

  // =====================================================
  // BUILD COMMON ANALYTICS PARAMETERS
  // =====================================================

  const analyticsParams = useMemo(() => {
    const params: Record<string, string | number> = {
      filter_type: filterType,
    };

    if (filterType === "custom") {
      if (startDate) {
        params.start_date = startDate;
      }

      if (endDate) {
        params.end_date = endDate;
      }
    }

    if (productId) {
      params.product_id = Number(productId);
    }

    if (categoryId) {
      params.category_id = Number(categoryId);
    }

    if (customerId) {
      params.customer_id = Number(customerId);
    }

    if (paymentMethod) {
      params.payment_method = paymentMethod;
    }

    return params;
  }, [
    filterType,
    startDate,
    endDate,
    productId,
    categoryId,
    customerId,
    paymentMethod,
  ]);

  // =====================================================
  // FILTER VALIDATION
  // =====================================================

  const customDateError =
    filterType === "custom" &&
    (!startDate ||
      !endDate ||
      startDate > endDate);

  // =====================================================
  // PRODUCTS / CATEGORIES / CUSTOMERS
  // =====================================================

  const {
    data: products = [],
    isLoading: productsLoading,
  } = useQuery({
    queryKey: ["analytics-filter-products"],
    queryFn: async () => {
      const response = await api.get("/products/");
      return Array.isArray(response.data)
        ? response.data
        : response.data?.items ?? [];
    },
    staleTime: 300000,
  });

  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ["analytics-filter-categories"],
    queryFn: async () => {
      const response = await api.get("/categories/");
      return Array.isArray(response.data)
        ? response.data
        : response.data?.items ?? [];
    },
    staleTime: 300000,
  });

  const {
    data: customers = [],
    isLoading: customersLoading,
  } = useQuery({
    queryKey: ["analytics-filter-customers"],
    queryFn: async () => {
      const response = await api.get("/customers/");
      return Array.isArray(response.data)
        ? response.data
        : response.data?.items ?? [];
    },
    staleTime: 300000,
  });

  // =====================================================
  // SALES SUMMARY / KPI
  // =====================================================

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "sales-summary",
      analyticsParams,
    ],
    queryFn: async () => {
      if (customDateError) {
        return null;
      }

      const response = await api.get(
        "/analytics/sales/summary",
        {
          params: analyticsParams,
        }
      );

      return response.data;
    },
    staleTime: 60000,
    enabled: !customDateError,
  });

  // =====================================================
  // SALES TREND
  // =====================================================

  const {
    data: trendData = [],
    isLoading: trendLoading,
    error: trendError,
  } = useQuery({
    queryKey: [
      "sales-trend",
      period,
      analyticsParams,
    ],
    queryFn: async () => {
      if (customDateError) {
        return [];
      }

      const response = await api.get(
        "/analytics/sales/trend",
        {
          params: {
            ...analyticsParams,
            period,
          },
        }
      );

      return Array.isArray(response.data)
        ? response.data
        : [];
    },
    staleTime: 60000,
    enabled: !customDateError,
  });

  // =====================================================
  // PRODUCT PERFORMANCE
  // =====================================================

  const {
    data: productData = [],
    isLoading: productLoading,
    error: productError,
  } = useQuery({
    queryKey: [
      "sales-products",
      analyticsParams,
    ],
    queryFn: async () => {
      if (customDateError) {
        return [];
      }

      const response = await api.get(
        "/analytics/sales/products",
        {
          params: {
            ...analyticsParams,
            sort_by: productSort,
          },
        }
      );

      return Array.isArray(response.data)
        ? response.data
        : [];
    },
    staleTime: 60000,
    enabled: !customDateError,
  });

  // =====================================================
  // CUSTOMER ANALYTICS
  // =====================================================

  const {
    data: customerData = [],
    isLoading: customerLoading,
    error: customerError,
  } = useQuery({
    queryKey: [
      "sales-customers",
      analyticsParams,
    ],
    queryFn: async () => {
      if (customDateError) {
        return [];
      }

      const response = await api.get(
        "/analytics/sales/customers",
        {
          params: analyticsParams,
        }
      );

      return Array.isArray(response.data)
        ? response.data
        : [];
    },
    staleTime: 60000,
    enabled: !customDateError,
  });

  // =====================================================
  // PAYMENT ANALYTICS
  // =====================================================

  const {
    data: paymentData = [],
    isLoading: paymentLoading,
    error: paymentError,
  } = useQuery({
    queryKey: [
      "sales-payments",
      analyticsParams,
    ],
    queryFn: async () => {
      if (customDateError) {
        return [];
      }

      const response = await api.get(
        "/analytics/sales/payment-methods",
        {
          params: analyticsParams,
        }
      );

      return Array.isArray(response.data)
        ? response.data
        : [];
    },
    staleTime: 60000,
    enabled: !customDateError,
  });

  // =====================================================
  // TREND CHART DATA
  // =====================================================

  const chartData = useMemo(() => {
    return trendData.map((item: any) => ({
      period: item.period,
      revenue: Number(item.revenue ?? 0),
      orders: Number(item.orders ?? 0),
    }));
  }, [trendData]);

  // =====================================================
  // PRODUCT CHART DATA
  // =====================================================

  const productChartData = useMemo(() => {
    const items = productData.map((item: any) => ({
      product_id: item.product_id,
      product_name:
        item.product_name || "Unknown Product",
      quantity_sold: Number(
        item.quantity_sold ?? 0
      ),
      revenue: Number(item.revenue ?? 0),
    }));

    return items.sort((a, b) =>
      productSort === "revenue"
        ? b.revenue - a.revenue
        : b.quantity_sold - a.quantity_sold
    );
  }, [productData, productSort]);

  // =====================================================
  // CUSTOMER DATA
  // =====================================================

  const customerChartData = useMemo(() => {
    return customerData
      .map((item: any) => ({
        customer_id: item.customer_id,
        customer_name:
          item.customer_name || "Unknown Customer",
        orders: Number(item.orders ?? 0),
        total_spend: Number(
          item.total_spend ?? 0
        ),
        average_order_value: Number(
          item.average_order_value ?? 0
        ),
      }))
      .sort(
        (a, b) =>
          b.total_spend - a.total_spend
      );
  }, [customerData]);

  // =====================================================
  // PAYMENT DATA
  // =====================================================

  const paymentChartData = useMemo(() => {
    return paymentData.map((item: any) => ({
      payment_method:
        item.payment_method || "Other",
      transactions: Number(
        item.transactions ?? 0
      ),
      revenue: Number(item.revenue ?? 0),
    }));
  }, [paymentData]);

  const paymentColors = [
    "#1976d2",
    "#2e7d32",
    "#ed6c02",
    "#9c27b0",
    "#d32f2f",
    "#00838f",
  ];

  // =====================================================
  // KPI CARDS
  // =====================================================

  const cards = [
    {
      title: "Total Revenue",
      value: `₹${Number(
        data?.total_revenue ?? 0
      ).toLocaleString("en-IN")}`,
    },
    {
      title: "Total Orders",
      value: Number(
        data?.total_orders ?? 0
      ).toLocaleString("en-IN"),
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
      value: Number(
        data?.total_items_sold ?? 0
      ).toLocaleString("en-IN"),
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

  // =====================================================
  // FILTER LABEL
  // =====================================================

  const getFilterLabel = () => {
    const labels: Record<string, string> = {
      today: "Today",
      "7days": "Last 7 Days",
      "30days": "Last 30 Days",
      "90days": "Last 90 Days",
      this_month: "This Month",
      last_month: "Last Month",
      custom: `${startDate || "Start"} to ${
        endDate || "End"
      }`,
    };

    return labels[filterType] || filterType;
  };

  // =====================================================
  // RESET FILTERS
  // =====================================================

  const resetFilters = () => {
    setFilterType("30days");
    setPeriod("monthly");
    setStartDate("");
    setEndDate("");
    setProductId("");
    setCategoryId("");
    setCustomerId("");
    setPaymentMethod("");
    setProductSort("revenue");
  };

  // =====================================================
  // CSV EXPORT
  // =====================================================

  const exportCSV = () => {
    try {
      const rows: string[][] = [];

      rows.push([
        "RetailPulse Sales Analytics",
      ]);

      rows.push([
        "Date Range",
        getFilterLabel(),
      ]);

      rows.push([
        "Trend View",
        period,
      ]);

      if (productId) {
        rows.push([
          "Product ID",
          productId,
        ]);
      }

      if (categoryId) {
        rows.push([
          "Category ID",
          categoryId,
        ]);
      }

      if (customerId) {
        rows.push([
          "Customer ID",
          customerId,
        ]);
      }

      if (paymentMethod) {
        rows.push([
          "Payment Method",
          paymentMethod,
        ]);
      }

      rows.push([]);

      // KPI
      rows.push(["KPI Summary"]);
      rows.push(["Metric", "Value"]);

      rows.push([
        "Total Revenue",
        String(data?.total_revenue ?? 0),
      ]);

      rows.push([
        "Total Orders",
        String(data?.total_orders ?? 0),
      ]);

      rows.push([
        "Average Order Value",
        String(
          data?.average_order_value ?? 0
        ),
      ]);

      rows.push([
        "Total Items Sold",
        String(
          data?.total_items_sold ?? 0
        ),
      ]);

      rows.push([
        "Total Discount",
        String(data?.total_discount ?? 0),
      ]);

      rows.push([
        "Total Tax",
        String(data?.total_tax ?? 0),
      ]);

      rows.push([]);

      // Trend
      rows.push(["Revenue Trend"]);
      rows.push([
        "Period",
        "Revenue",
        "Orders",
      ]);

      chartData.forEach((item: any) => {
        rows.push([
          item.period,
          String(item.revenue),
          String(item.orders),
        ]);
      });

      rows.push([]);

      // Products
      rows.push(["Product Performance"]);
      rows.push([
        "Product",
        "Quantity Sold",
        "Revenue",
      ]);

      productChartData.forEach(
        (item: any) => {
          rows.push([
            item.product_name,
            String(item.quantity_sold),
            String(item.revenue),
          ]);
        }
      );

      rows.push([]);

      // Customers
      rows.push([
        "Customer Revenue Analysis",
      ]);

      rows.push([
        "Customer",
        "Orders",
        "Total Spend",
        "Average Order Value",
      ]);

      customerChartData.forEach(
        (item: any) => {
          rows.push([
            item.customer_name,
            String(item.orders),
            String(item.total_spend),
            String(
              item.average_order_value
            ),
          ]);
        }
      );

      rows.push([]);

      // Payments
      rows.push(["Payment Method Analysis"]);

      rows.push([
        "Payment Method",
        "Transactions",
        "Revenue",
      ]);

      paymentChartData.forEach(
        (item: any) => {
          rows.push([
            item.payment_method,
            String(item.transactions),
            String(item.revenue),
          ]);
        }
      );

      const csvContent = rows
        .map((row) =>
          row
            .map((value) => {
              const escaped = String(
                value
              ).replace(/"/g, '""');

              return `"${escaped}"`;
            })
            .join(",")
        )
        .join("\n");

      const blob = new Blob(
        [csvContent],
        {
          type: "text/csv;charset=utf-8;",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `sales-analytics-${filterType}.csv`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(
        "CSV export failed:",
        err
      );
    }
  };

  // =====================================================
  // PDF EXPORT
  // =====================================================

  const exportPDF = async () => {
    if (!dashboardRef.current) {
      return;
    }

    try {
      setExporting(true);

      const element =
        dashboardRef.current;

      const canvas =
        await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth:
            element.scrollWidth,
        });

      const imageData =
        canvas.toDataURL(
          "image/png",
          1.0
        );

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const margin = 10;

      const imageWidth =
        pageWidth - margin * 2;

      const imageHeight =
        (canvas.height * imageWidth) /
        canvas.width;

      let remainingHeight =
        imageHeight;

      let position = margin;

      pdf.setFontSize(14);

      pdf.text(
        `Sales Analytics - ${getFilterLabel()}`,
        margin,
        7
      );

      pdf.addImage(
        imageData,
        "PNG",
        margin,
        position,
        imageWidth,
        imageHeight
      );

      remainingHeight -=
        pageHeight - margin * 2;

      while (remainingHeight > 0) {
        position =
          remainingHeight -
          imageHeight +
          margin;

        pdf.addPage();

        pdf.addImage(
          imageData,
          "PNG",
          margin,
          position,
          imageWidth,
          imageHeight
        );

        remainingHeight -=
          pageHeight - margin * 2;
      }

      pdf.save(
        `sales-analytics-${filterType}.pdf`
      );
    } catch (err) {
      console.error(
        "PDF export failed:",
        err
      );
    } finally {
      setExporting(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <Box
      ref={dashboardRef}
      sx={{
        width: "100%",
        maxWidth: "1600px",
        mx: "auto",
        p: {
          xs: 1,
          sm: 2,
          md: 3,
        },
        backgroundColor: "#fff",
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={3}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
        >
          Sales Analytics Dashboard
        </Typography>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={2}
        >
          <Button
            variant="outlined"
            onClick={exportCSV}
            disabled={
              isLoading ||
              trendLoading ||
              productLoading ||
              customerLoading ||
              paymentLoading ||
              customDateError
            }
          >
            Export CSV
          </Button>

          <Button
            variant="contained"
            onClick={exportPDF}
            disabled={
              exporting ||
              customDateError
            }
          >
            {exporting
              ? "Generating PDF..."
              : "Export PDF"}
          </Button>
        </Stack>
      </Box>

      {/* =================================================
          FILTERS
      ================================================= */}

      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: 2,
        }}
      >
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            mb={2}
          >
            Sales Filters
          </Typography>

          <Grid
            container
            spacing={2}
          >
            {/* Date Range */}

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Date Range
                </InputLabel>

                <Select
                  value={filterType}
                  label="Date Range"
                  onChange={(e) => {
                    setFilterType(
                      e.target.value
                    );

                    if (
                      e.target.value !==
                      "custom"
                    ) {
                      setStartDate("");
                      setEndDate("");
                    }
                  }}
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

                  <MenuItem value="custom">
                    Custom Range
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Trend */}

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Trend View
                </InputLabel>

                <Select
                  value={period}
                  label="Trend View"
                  onChange={(e) =>
                    setPeriod(
                      e.target.value
                    )
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

            {/* Product */}

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Product
                </InputLabel>

                <Select
                  value={productId}
                  label="Product"
                  onChange={(e) =>
                    setProductId(
                      e.target.value
                    )
                  }
                  disabled={
                    productsLoading
                  }
                >
                  <MenuItem value="">
                    All Products
                  </MenuItem>

                  {products.map(
                    (product: any) => (
                      <MenuItem
                        key={
                          product.id ??
                          product.product_id
                        }
                        value={
                          product.id ??
                          product.product_id
                        }
                      >
                        {product.name ??
                          product.product_name}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Category */}

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Category
                </InputLabel>

                <Select
                  value={categoryId}
                  label="Category"
                  onChange={(e) =>
                    setCategoryId(
                      e.target.value
                    )
                  }
                  disabled={
                    categoriesLoading
                  }
                >
                  <MenuItem value="">
                    All Categories
                  </MenuItem>

                  {categories.map(
                    (category: any) => (
                      <MenuItem
                        key={
                          category.id ??
                          category.category_id
                        }
                        value={
                          category.id ??
                          category.category_id
                        }
                      >
                        {category.name ??
                          category.category_name}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Customer */}

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Customer
                </InputLabel>

                <Select
                  value={customerId}
                  label="Customer"
                  onChange={(e) =>
                    setCustomerId(
                      e.target.value
                    )
                  }
                  disabled={
                    customersLoading
                  }
                >
                  <MenuItem value="">
                    All Customers
                  </MenuItem>

                  {customers.map(
                    (customer: any) => (
                      <MenuItem
                        key={
                          customer.id ??
                          customer.customer_id
                        }
                        value={
                          customer.id ??
                          customer.customer_id
                        }
                      >
                        {customer.name ??
                          customer.customer_name}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Payment */}

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Payment Method
                </InputLabel>

                <Select
                  value={paymentMethod}
                  label="Payment Method"
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="">
                    All Payment Methods
                  </MenuItem>

                  <MenuItem value="Cash">
                    Cash
                  </MenuItem>

                  <MenuItem value="Card">
                    Card
                  </MenuItem>

                  <MenuItem value="UPI">
                    UPI
                  </MenuItem>

                  <MenuItem value="Bank Transfer">
                    Bank Transfer
                  </MenuItem>

                  <MenuItem value="Other">
                    Other
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Custom Start Date */}

            {filterType === "custom" && (
              <>
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3,
                  }}
                >
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date"
                    value={startDate}
                    onChange={(e) =>
                      setStartDate(
                        e.target.value
                      )
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                {/* Custom End Date */}

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3,
                  }}
                >
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date"
                    value={endDate}
                    onChange={(e) =>
                      setEndDate(
                        e.target.value
                      )
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={
                      !!startDate &&
                      !!endDate &&
                      startDate > endDate
                    }
                    helperText={
                      startDate &&
                      endDate &&
                      startDate > endDate
                        ? "End date must be after start date"
                        : ""
                    }
                  />
                </Grid>
              </>
            )}

            {/* Reset */}

            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 3,
              }}
            >
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  height: "56px",
                }}
                onClick={resetFilters}
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>

          {/* Custom date required message */}

          {filterType === "custom" &&
            (!startDate ||
              !endDate) && (
              <Alert
                severity="info"
                sx={{ mt: 2 }}
              >
                Select both Start Date and End
                Date to load analytics.
              </Alert>
            )}

          {customDateError &&
            startDate &&
            endDate && (
              <Alert
                severity="error"
                sx={{ mt: 2 }}
              >
                Invalid date range. End Date
                must be after Start Date.
              </Alert>
            )}
        </CardContent>
      </Card>

      {/* =================================================
          SUMMARY ERROR
      ================================================= */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          Failed to load sales summary.
          Please try again.
        </Alert>
      )}

      {/* =================================================
          KPI CARDS
      ================================================= */}

      <Grid
        container
        spacing={3}
      >
        {cards.map((card) => (
          <Grid
            key={card.title}
            size={{
              xs: 12,
              sm: 6,
              md: 4,
              lg: 2,
            }}
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
                >
                  {card.title}
                </Typography>

                {isLoading ? (
                  <Skeleton
                    width="70%"
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

      {/* =================================================
          REVENUE TREND
      ================================================= */}

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

          {trendError ? (
            <Alert severity="error">
              Failed to load revenue trend.
            </Alert>
          ) : trendLoading ? (
            <Skeleton
              variant="rectangular"
              height={350}
            />
          ) : chartData.length === 0 ? (
            <Alert severity="info">
              No revenue trend data available
              for the selected filters.
            </Alert>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="period"
                  tickFormatter={(value) =>
                    new Date(
                      value
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )
                  }
                />

                <YAxis
                  tickFormatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString(
                      "en-IN"
                    )}`
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString(
                      "en-IN"
                    )}`
                  }
                />

                <Line
                  type="linear"
                  dataKey="revenue"
                  stroke="#1976d2"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* =================================================
          SALES VS ORDERS
      ================================================= */}

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
            Sales vs Orders
          </Typography>

          {trendError ? (
            <Alert severity="error">
              Failed to load sales vs orders.
            </Alert>
          ) : trendLoading ? (
            <Skeleton
              variant="rectangular"
              height={350}
            />
          ) : chartData.length === 0 ? (
            <Alert severity="info">
              No sales and order data available
              for the selected filters.
            </Alert>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="period"
                  tickFormatter={(value) =>
                    new Date(
                      value
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )
                  }
                />

                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) =>
                    `₹${Number(
                      value
                    ).toLocaleString(
                      "en-IN"
                    )}`
                  }
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                />

                <Tooltip />

                <Legend />

                <Line
                  yAxisId="left"
                  dataKey="revenue"
                  stroke="#1976d2"
                  name="Revenue"
                  strokeWidth={3}
                  isAnimationActive={false}
                />

                <Line
                  yAxisId="right"
                  dataKey="orders"
                  stroke="#2e7d32"
                  name="Orders"
                  strokeWidth={3}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* =================================================
          PRODUCT PERFORMANCE
      ================================================= */}

      <Card
        sx={{
          mt: 4,
          borderRadius: 3,
          boxShadow: 3,
        }}
      >
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
            mb={3}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
            >
              Top Performing Products
            </Typography>

            <FormControl
              sx={{
                minWidth: 220,
              }}
            >
              <InputLabel>
                Sort By
              </InputLabel>

              <Select
                value={productSort}
                label="Sort By"
                onChange={(e) =>
                  setProductSort(
                    e.target.value
                  )
                }
              >
                <MenuItem value="revenue">
                  Revenue
                </MenuItem>

                <MenuItem value="quantity">
                  Quantity Sold
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {productError ? (
            <Alert severity="error">
              Failed to load product
              analytics.
            </Alert>
          ) : productLoading ? (
            <Skeleton
              variant="rectangular"
              height={350}
            />
          ) : productChartData.length ===
            0 ? (
            <Alert severity="info">
              No product data available for
              the selected filters.
            </Alert>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <BarChart
                data={productChartData}
                margin={{
                  bottom: 60,
                  left: 20,
                  right: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="product_name"
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />

                <YAxis
                  tickFormatter={(value) =>
                    productSort ===
                    "revenue"
                      ? `₹${Number(
                          value
                        ).toLocaleString(
                          "en-IN"
                        )}`
                      : value
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    productSort ===
                    "revenue"
                      ? `₹${Number(
                          value
                        ).toLocaleString(
                          "en-IN"
                        )}`
                      : `${value} units`
                  }
                />

                <Bar
                  dataKey={
                    productSort ===
                    "revenue"
                      ? "revenue"
                      : "quantity_sold"
                  }
                  fill="#1976d2"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* =================================================
          CUSTOMER REVENUE ANALYSIS
      ================================================= */}

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
            Customer Revenue Analysis
          </Typography>

          {customerError ? (
            <Alert severity="error">
              Failed to load customer
              analytics.
            </Alert>
          ) : customerLoading ? (
            <Skeleton
              variant="rectangular"
              height={350}
            />
          ) : customerChartData.length ===
            0 ? (
            <Alert severity="info">
              No customer data available for
              the selected filters.
            </Alert>
          ) : (
            <>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                mb={2}
              >
                Top Customers
              </Typography>

              <TableContainer
                component={Paper}
                sx={{
                  overflowX: "auto",
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        Customer Name
                      </TableCell>

                      <TableCell align="right">
                        Orders
                      </TableCell>

                      <TableCell align="right">
                        Total Spend
                      </TableCell>

                      <TableCell align="right">
                        Average Order Value
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {customerChartData.map(
                      (customer: any) => (
                        <TableRow
                          key={
                            customer.customer_id ??
                            customer.customer_name
                          }
                        >
                          <TableCell>
                            {
                              customer.customer_name
                            }
                          </TableCell>

                          <TableCell align="right">
                            {
                              customer.orders
                            }
                          </TableCell>

                          <TableCell align="right">
                            ₹
                            {customer.total_spend.toLocaleString(
                              "en-IN"
                            )}
                          </TableCell>

                          <TableCell align="right">
                            ₹
                            {customer.average_order_value.toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box mt={4}>
                <ResponsiveContainer
                  width="100%"
                  height={350}
                >
                  <BarChart
                    data={
                      customerChartData
                    }
                    margin={{
                      bottom: 60,
                      left: 20,
                      right: 20,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="customer_name"
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />

                    <YAxis
                      tickFormatter={(value) =>
                        `₹${Number(
                          value
                        ).toLocaleString(
                          "en-IN"
                        )}`
                      }
                    />

                    <Tooltip
                      formatter={(value) =>
                        `₹${Number(
                          value
                        ).toLocaleString(
                          "en-IN"
                        )}`
                      }
                    />

                    <Bar
                      dataKey="total_spend"
                      fill="#2e7d32"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* =================================================
          PAYMENT METHOD ANALYSIS
      ================================================= */}

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
            Payment Method Analysis
          </Typography>

          {paymentError ? (
            <Alert severity="error">
              Failed to load payment
              analytics.
            </Alert>
          ) : paymentLoading ? (
            <Skeleton
              variant="rectangular"
              height={350}
            />
          ) : paymentChartData.length ===
            0 ? (
            <Alert severity="info">
              No payment data available for
              the selected filters.
            </Alert>
          ) : (
            <>
              <ResponsiveContainer
                width="100%"
                height={350}
              >
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    dataKey="revenue"
                    nameKey="payment_method"
                    outerRadius={120}
                    label
                  >
                    {paymentChartData.map(
                      (
                        _: any,
                        index: number
                      ) => (
                        <Cell
                          key={index}
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
                      ).toLocaleString(
                        "en-IN"
                      )}`
                    }
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              {/* Payment Details Table */}

              <TableContainer
                component={Paper}
                sx={{
                  mt: 3,
                  overflowX: "auto",
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        Payment Method
                      </TableCell>

                      <TableCell align="right">
                        Transactions
                      </TableCell>

                      <TableCell align="right">
                        Revenue
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paymentChartData.map(
                      (payment: any) => (
                        <TableRow
                          key={
                            payment.payment_method
                          }
                        >
                          <TableCell>
                            {
                              payment.payment_method
                            }
                          </TableCell>

                          <TableCell align="right">
                            {
                              payment.transactions
                            }
                          </TableCell>

                          <TableCell align="right">
                            ₹
                            {payment.revenue.toLocaleString(
                              "en-IN"
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}