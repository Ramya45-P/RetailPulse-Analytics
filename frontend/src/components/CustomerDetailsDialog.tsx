import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";

import api from "../api/axios";

interface Customer {
  id: number;
  customer_id: string;
  full_name: string;
  email: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  customer_type: string;
  customer_segment?: string | null;
  preferred_sales_channel?: string | null;
  is_active: boolean;
  created_at: string;
}

interface Sale {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  sale_date?: string;
  total_amount: number;
  payment_method?: string;
}

interface Props {
  open: boolean;
  customerId: number | null;
  onClose: () => void;
}

const getSegmentColor = (
  segment: string
):
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning" => {
  switch (segment) {
    case "New":
      return "primary";

    case "Regular":
      return "secondary";

    case "Loyal":
      return "success";

    case "VIP":
      return "warning";

    default:
      return "default";
  }
};

export default function CustomerDetailsDialog({
  open,
  customerId,
  onClose,
}: Props) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !customerId) {
      return;
    }

    const loadDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const [customerResponse, salesResponse] =
          await Promise.all([
            api.get(`/customers/${customerId}`),
            api.get("/sales/"),
          ]);

        setCustomer(customerResponse.data);

        const allSales: Sale[] =
          salesResponse.data || [];

        const customerSales = allSales.filter(
          (sale) =>
            Number(sale.customer_id) ===
            Number(customerId)
        );

        setSales(customerSales);
      } catch (err) {
        console.error(
          "Failed to load customer details:",
          err
        );

        setError(
          "Unable to load customer details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [open, customerId]);

  const totalOrders = sales.length;

  const totalSpend = sales.reduce(
    (total, sale) =>
      total + Number(sale.total_amount || 0),
    0
  );

  const lastPurchaseDate =
    sales.length > 0
      ? [...sales]
          .sort(
            (a, b) =>
              new Date(
                b.sale_date || 0
              ).getTime() -
              new Date(
                a.sale_date || 0
              ).getTime()
          )[0].sale_date
      : null;

  const segment =
    customer?.customer_segment || "New";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Customer Details
      </DialogTitle>

      <DialogContent>
        {loading && (
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

        {!loading && error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        {!loading && !error && customer && (
          <Box>
            {/* Customer Information */}
            <Typography
              variant="h6"
              sx={{ mb: 2 }}
            >
              Customer Information
            </Typography>

            <Grid
              container
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography>
                  <b>Customer ID:</b>{" "}
                  {customer.customer_id}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography>
                  <b>Name:</b>{" "}
                  {customer.full_name}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography>
                  <b>Customer Type:</b>{" "}
                  {customer.customer_type}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography>
                    <b>Segment:</b>
                  </Typography>

                  <Chip
                    label={segment}
                    color={getSegmentColor(
                      segment
                    )}
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography>
                  <b>Status:</b>{" "}
                  {customer.is_active
                    ? "Active"
                    : "Inactive"}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography>
                  <b>Sales Channel:</b>{" "}
                  {customer.preferred_sales_channel ||
                    "-"}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            {/* Contact Details */}
            <Typography
              variant="h6"
              sx={{ mb: 2 }}
            >
              Contact Details
            </Typography>

            <Grid
              container
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography>
                  <b>Email:</b>{" "}
                  {customer.email}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography>
                  <b>Phone:</b>{" "}
                  {customer.phone}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography>
                  <b>Address:</b>{" "}
                  {customer.address || "-"}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography>
                  <b>City:</b>{" "}
                  {customer.city || "-"}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography>
                  <b>State:</b>{" "}
                  {customer.state || "-"}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography>
                  <b>Country:</b>{" "}
                  {customer.country || "-"}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography>
                  <b>Postal Code:</b>{" "}
                  {customer.postal_code || "-"}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            {/* Customer Analytics */}
            <Typography
              variant="h6"
              sx={{ mb: 2 }}
            >
              Customer Analytics
            </Typography>

            <Grid
              container
              spacing={2}
              sx={{ mb: 3 }}
            >
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid #ddd",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Total Orders
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{ mt: 1 }}
                  >
                    {totalOrders}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid #ddd",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Total Spend
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{ mt: 1 }}
                  >
                    ₹{totalSpend.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Box
                  sx={{
                    p: 2,
                    border: "1px solid #ddd",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Last Purchase
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{ mt: 1 }}
                  >
                    {lastPurchaseDate
                      ? new Date(
                          lastPurchaseDate
                        ).toLocaleDateString()
                      : "No purchases yet"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3 }} />

            {/* Recent Purchase History */}
            <Typography
              variant="h6"
              sx={{ mb: 1 }}
            >
              Recent Purchase History
            </Typography>

            {sales.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ py: 2 }}
              >
                No purchase history available.
              </Typography>
            ) : (
              <List>
                {[...sales]
                  .sort(
                    (a, b) =>
                      new Date(
                        b.sale_date || 0
                      ).getTime() -
                      new Date(
                        a.sale_date || 0
                      ).getTime()
                  )
                  .slice(0, 5)
                  .map((sale) => (
                    <ListItem
                      key={sale.id}
                      divider
                    >
                      <ListItemText
                        primary={
                          sale.invoice_number
                        }
                        secondary={
                          <>
                            {sale.sale_date
                              ? new Date(
                                  sale.sale_date
                                ).toLocaleDateString()
                              : "-"}{" "}
                            •{" "}
                            {sale.payment_method ||
                              "-"}
                          </>
                        }
                      />

                      <Typography
                        sx={{
                          fontWeight: 600,
                        }}
                      >
                        ₹
                        {Number(
                          sale.total_amount || 0
                        ).toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                    </ListItem>
                  ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}