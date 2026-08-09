import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import WarningIcon from "@mui/icons-material/Warning";

import { getProducts } from "../api/productApi";
import {
  getProductForecast,
  generateForecast,
  getCategoryForecasts,
  getForecastAnalytics,
} from "../api/forecast";

interface Product {
  id: number;
  name: string;
}

interface ForecastData {
  company_id: number;
  product_id: number;
  predicted_demand: number;
  confidence_score: number;
  reorder_recommended: string;
  id: number;
  forecast_period: string;
  average_sales: number;
  recommended_stock: number;
  created_at: string;
}

interface CategoryForecast {
  category_id: number;
  category: string;
  total_historical_sales: number;
  predicted_demand: number;
  expected_growth_percentage: number;
  product_count: number;
}

  const Forecast = () => {
  const companyId = Number(localStorage.getItem("company_id"));

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | "">("");

  const [forecastPeriod, setForecastPeriod] =
    useState("Next 7 Days");

  const [forecast, setForecast] =
    useState<ForecastData | null>(null);

    const [analytics, setAnalytics] = useState<any>(null);
const [loadingAnalytics, setLoadingAnalytics] = useState(false);

   const [categoryForecasts, setCategoryForecasts] =useState<
  CategoryForecast[]
  >([]);

const [loadingCategories, setLoadingCategories] = useState(false); 

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        setError("");

        const data = await getProducts(companyId);

        setProducts(data);
      } catch (err) {
        console.error("Failed to load products:", err);
        setError("Failed to load products.");
      } finally {
        setLoadingProducts(false);
      }
    };

    if (companyId) {
      loadProducts();
    }
  }, [companyId]);

  // Load category forecasts
useEffect(() => {
  const loadCategoryForecasts = async () => {
    if (!companyId) return;

    try {
      setLoadingCategories(true);

      const data = await getCategoryForecasts(
        companyId,
        forecastPeriod
      );

      setCategoryForecasts(data);
    } catch (err) {
      console.error(
        "Failed to load category forecasts:",
        err
      );

      setCategoryForecasts([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  loadCategoryForecasts();
}, [companyId, forecastPeriod]);

  // Load existing forecast when product changes
  useEffect(() => {
    const loadForecast = async () => {
      if (!selectedProduct) {
        setForecast(null);
        return;
      }

      try {
        setLoadingForecast(true);
        setError("");
        setSuccess("");
     const data = await getProductForecast(
       Number(selectedProduct),
       companyId,
       forecastPeriod
   );
       

        setForecast(data);
      } catch (err: any) {
        console.error("Failed to load forecast:", err);

        setForecast(null);

        if (err?.response?.status === 404) {
          setError("No forecast found for this product.");
        } else {
          setError("Unable to load forecast.");
        }
      } finally {
        setLoadingForecast(false);
      }
    };

    if (companyId) {
      loadForecast();
    }
  }, [selectedProduct, companyId, forecastPeriod]);

  // Load forecast analytics
useEffect(() => {
  const loadAnalytics = async () => {
    if (!companyId) return;

    try {
      setLoadingAnalytics(true);

      const data = await getForecastAnalytics(
        companyId,
        forecastPeriod
      );

      console.log("Forecast analytics response:", data);

      setAnalytics(data);
    } catch (err) {
      console.error(
        "Failed to load forecast analytics:",
        err
      );

      setAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  loadAnalytics();
}, [companyId, forecastPeriod]);

  // Generate forecast
  const handleGenerateForecast = async () => {
    if (!selectedProduct) {
      setError("Please select a product first.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      const data = await generateForecast(
  Number(selectedProduct),
  companyId,
  forecastPeriod
);

console.log("Generated forecast response:", data);

setForecast(data?.forecast || data?.data || data);
      setSuccess(
        `${forecastPeriod} forecast generated successfully.`
      );
    } catch (err: any) {
      console.error("Forecast generation failed:", err);

      if (
        err?.response?.data?.detail?.includes(
          "Forecast already exists"
        )
      ) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to generate forecast.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const selectedProductName =
    products.find(
      (product) => product.id === Number(selectedProduct)
    )?.name || "Product";

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Demand Forecasting
        </Typography>

        <Typography color="text.secondary">
          Predict future product demand and identify
          replenishment requirements.
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {/* Forecast Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ mb: 2 }}
          >
            Generate Forecast
          </Typography>

          <Grid container spacing={2} alignItems="center">
            {/* Product */}
            <Grid size={{ xs: 12, md: 5 }}>
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>

                <Select
                  value={selectedProduct}
                  label="Product"
                  onChange={(e) =>
                    setSelectedProduct(
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                    )
                  }
                  disabled={loadingProducts}
                >
                  {loadingProducts ? (
                    <MenuItem disabled>
                      Loading products...
                    </MenuItem>
                  ) : (
                    products.map((product) => (
                      <MenuItem
                        key={product.id}
                        value={product.id}
                      >
                        {product.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Forecast Period */}
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Forecast Period</InputLabel>

                <Select
                  value={forecastPeriod}
                  label="Forecast Period"
                  onChange={(e) =>
                    setForecastPeriod(e.target.value)
                  }
                >
                  <MenuItem value="Next 7 Days">
                    Next 7 Days
                  </MenuItem>

                  <MenuItem value="Next 30 Days">
                    Next 30 Days
                  </MenuItem>

                  <MenuItem value="Next 90 Days">
                    Next 90 Days
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Generate Button */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleGenerateForecast}
                disabled={!selectedProduct || generating}
                startIcon={
                  generating ? (
                    <CircularProgress
                      size={20}
                      color="inherit"
                    />
                  ) : (
                    <TrendingUpIcon />
                  )
                }
              >
                {generating
                  ? "Generating..."
                  : "Generate Forecast"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading */}
      {loadingForecast && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 5,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      {/* Forecast Analytics */}
{!loadingAnalytics && analytics && (
  <>
    <Typography
      variant="h6"
      fontWeight="bold"
      sx={{ mb: 2 }}
    >
      Forecast Analytics
    </Typography>

    <Grid container spacing={2} sx={{ mb: 3 }}>

      {/* Total Predicted Demand */}
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card>
          <CardContent>
            <TrendingUpIcon
              sx={{ fontSize: 35, mb: 1 }}
            />

            <Typography color="text.secondary">
              Total Predicted Demand
            </Typography>

            <Typography variant="h5" fontWeight="bold">
              {analytics.total_predicted_demand ?? 0}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              units
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Products Expected to Run Out */}
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card>
          <CardContent>
            <WarningIcon
              sx={{ fontSize: 35, mb: 1 }}
            />

            <Typography color="text.secondary">
              Products Expected to Run Out
            </Typography>

            <Typography variant="h5" fontWeight="bold">
              {analytics.products_expected_to_run_out ?? 0}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              products
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* High Growth Products */}
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card>
          <CardContent>
            <TrendingUpIcon
              sx={{ fontSize: 35, mb: 1 }}
            />

            <Typography color="text.secondary">
              High Growth Products
            </Typography>

            <Typography variant="h5" fontWeight="bold">
              {analytics.high_growth_products ?? 0}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              products
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Slow Moving Products */}
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card>
          <CardContent>
            <InventoryIcon
              sx={{ fontSize: 35, mb: 1 }}
            />

            <Typography color="text.secondary">
              Slow Moving Products
            </Typography>

            <Typography variant="h5" fontWeight="bold">
              {analytics.slow_moving_products ?? 0}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              products
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Forecast Accuracy */}
      <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
        <Card>
          <CardContent>
            <AssessmentIcon
              sx={{ fontSize: 35, mb: 1 }}
            />

            <Typography color="text.secondary">
              Forecast Accuracy
            </Typography>

            <Typography variant="h5" fontWeight="bold">
              {analytics.forecast_accuracy ?? 0}%
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              confidence
            </Typography>
          </CardContent>
        </Card>
      </Grid>

    </Grid>
  </>
)}

      {/* Forecast Dashboard */}
      {!loadingForecast && forecast && (
        <>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ mb: 2 }}
          >
            Forecast Dashboard
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            {selectedProductName} • {forecast.forecast_period}
          </Typography>

          <Grid container spacing={2}>
            {/* Predicted Demand */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <TrendingUpIcon
                    sx={{ fontSize: 35, mb: 1 }}
                  />

                  <Typography color="text.secondary">
                    Predicted Demand
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight="bold"
                  >
                    {forecast.predicted_demand}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    units
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Confidence */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <AssessmentIcon
                    sx={{ fontSize: 35, mb: 1 }}
                  />

                  <Typography color="text.secondary">
                    Confidence Score
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight="bold"
                  >
                    {forecast.confidence_score}%
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    forecast confidence
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Recommended Stock */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <InventoryIcon
                    sx={{ fontSize: 35, mb: 1 }}
                  />

                  <Typography color="text.secondary">
                    Recommended Stock
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight="bold"
                  >
                    {forecast.recommended_stock}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    units
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Reorder */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <WarningIcon
                    sx={{ fontSize: 35, mb: 1 }}
                  />

                  <Typography color="text.secondary">
                    Reorder Status
                  </Typography>

                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ mt: 1 }}
                  >
                    {forecast.reorder_recommended}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Additional Information */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ mb: 2 }}
              >
                Forecast Details
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography color="text.secondary">
                    Average Sales
                  </Typography>

                  <Typography
                    variant="h6"
                    fontWeight="bold"
                  >
                    {forecast.average_sales}
                    {" units/day"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography color="text.secondary">
                    Forecast Period
                  </Typography>

                  <Typography
                    variant="h6"
                    fontWeight="bold"
                  >
                    {forecast.forecast_period}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography color="text.secondary">
                    Generated At
                  </Typography>

                  <Typography
                    variant="h6"
                    fontWeight="bold"
                  >
                    {forecast.created_at
                       ? new Date(forecast.created_at).toLocaleString()
                       : "Not available"}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}

      {/* Forecast Charts */}
{!loadingCategories && categoryForecasts.length > 0 && (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Typography
        variant="h6"
        fontWeight="bold"
        sx={{ mb: 3 }}
      >
        Historical Sales vs Forecast
      </Typography>

      {categoryForecasts.map((item) => {
        const maxValue = Math.max(
          item.total_historical_sales,
          item.predicted_demand,
          1
        );

        const historicalWidth =
          (item.total_historical_sales / maxValue) * 100;

        const predictedWidth =
          (item.predicted_demand / maxValue) * 100;

        return (
          <Box key={item.category_id} sx={{ mb: 3 }}>
            <Typography
              fontWeight="bold"
              sx={{ mb: 1 }}
            >
              {item.category}
            </Typography>

            {/* Historical Sales */}
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Historical Sales:{" "}
                {item.total_historical_sales} units
              </Typography>

              <Box
                sx={{
                  height: 18,
                  width: "100%",
                  bgcolor: "grey.200",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    width: `${historicalWidth}%`,
                    bgcolor: "grey.600",
                    borderRadius: 1,
                  }}
                />
              </Box>
            </Box>

            {/* Predicted Demand */}
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Predicted Demand:{" "}
                {item.predicted_demand} units
              </Typography>

              <Box
                sx={{
                  height: 18,
                  width: "100%",
                  bgcolor: "grey.200",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    width: `${predictedWidth}%`,
                    bgcolor: "primary.main",
                    borderRadius: 1,
                  }}
                />
              </Box>
            </Box>
          </Box>
        );
      })}
    </CardContent>
  </Card>
)}

      {/* Category Forecast Dashboard */}
<Card sx={{ mt: 3 }}>
  <CardContent>
    <Typography
      variant="h6"
      fontWeight="bold"
      sx={{ mb: 2 }}
    >
      Category Level Forecast
    </Typography>

    <Typography
      color="text.secondary"
      sx={{ mb: 2 }}
    >
      Category-wise demand forecast for{" "}
      {forecastPeriod}
    </Typography>

    {loadingCategories ? (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 4,
        }}
      >
        <CircularProgress />
      </Box>
    ) : categoryForecasts.length === 0 ? (
      <Alert severity="info">
        No category forecasts available for{" "}
        {forecastPeriod}.
      </Alert>
    ) : (
      <Grid container spacing={2}>
        {categoryForecasts.map((category) => (
          <Grid
            size={{ xs: 12, md: 6, lg: 4 }}
            key={category.category_id}
          >
            <Card variant="outlined">
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                >
                  {category.category}
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {category.product_count} products
                </Typography>

                <Typography color="text.secondary">
                  Total Historical Sales
                </Typography>

                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mb: 1 }}
                >
                  {category.total_historical_sales}
                  {" units"}
                </Typography>

                <Typography color="text.secondary">
                  Predicted Demand
                </Typography>

                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mb: 1 }}
                >
                  {category.predicted_demand}
                  {" units"}
                </Typography>

                <Typography color="text.secondary">
                  Expected Growth
                </Typography>

                <Typography
                  variant="h6"
                  fontWeight="bold"
                >
                  {category.expected_growth_percentage}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    )}
  </CardContent>
</Card>

      {/* Empty State */}
      {!loadingForecast &&
        !forecast &&
        !error &&
        !selectedProduct && (
          <Card>
            <CardContent
              sx={{
                textAlign: "center",
                py: 6,
              }}
            >
              <TrendingUpIcon
                sx={{
                  fontSize: 60,
                  mb: 2,
                }}
              />

              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Select a product to view its forecast
              </Typography>

              <Typography color="text.secondary">
                Choose a product and forecast period above
                to generate demand predictions.
              </Typography>
            </CardContent>
          </Card>
        )}
    </Box>
  );
};

export default Forecast;