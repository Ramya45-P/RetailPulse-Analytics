import { useEffect, useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Divider,
} from "@mui/material";

import { getSaleDetails } from "../api/saleApi";

interface Props {
  open: boolean;
  saleId: number | null;
  onClose: () => void;
}

export default function SalesDetailsDialog({
  open,
  saleId,
  onClose,
}: Props) {
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !saleId) {
      return;
    }

    const loadDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getSaleDetails(saleId);

        console.log("Sale Details:", data);

        setSale(data);
      } catch (error) {
        console.error("Failed to load sale details:", error);
        setError("Failed to load invoice details.");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [open, saleId]);

  const calculateSubtotal = () => {
    if (!sale?.items) {
      return 0;
    }

    return sale.items.reduce(
      (sum: number, item: any) =>
        sum + Number(item.quantity) * Number(item.unit_price),
      0
    );
  };

  const calculateDiscount = () => {
    if (!sale?.items) {
      return 0;
    }

    return sale.items.reduce(
      (sum: number, item: any) =>
        sum + Number(item.discount || 0),
      0
    );
  };

  const calculateTax = () => {
    if (!sale?.items) {
      return 0;
    }

    return sale.items.reduce(
      (sum: number, item: any) =>
        sum + Number(item.tax || 0),
      0
    );
  };

  const subtotal = calculateSubtotal();
  const discount = calculateDiscount();
  const tax = calculateTax();

  const grandTotal = Number(
    sale?.total_amount || subtotal - discount + tax
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold">
          Invoice Details
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
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
          <Typography color="error">
            {error}
          </Typography>
        )}

        {!loading && !error && sale && (
          <Box>

            {/* Invoice Header */}

            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
              }}
            >
              <Grid container spacing={2}>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                  >
                    RetailPulse Analytics
                  </Typography>

                  <Typography
                    color="text.secondary"
                  >
                    Sales Invoice
                  </Typography>
                </Grid>

                <Grid
                  size={{ xs: 12, md: 6 }}
                  sx={{
                    textAlign: {
                      xs: "left",
                      md: "right",
                    },
                  }}
                >
                  <Typography fontWeight="bold">
                    Invoice Number
                  </Typography>

                  <Typography>
                    {sale.invoice_number}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {new Date(
                      sale.sale_date
                    ).toLocaleDateString("en-IN")}
                  </Typography>
                </Grid>

              </Grid>
            </Paper>


            {/* Customer / Payment Information */}

            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
              }}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
                mb={2}
              >
                Customer Information
              </Typography>

              <Grid container spacing={2}>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography color="text.secondary">
                    Customer
                  </Typography>

                  <Typography fontWeight="bold">
                    {sale.customer_name}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography color="text.secondary">
                    Payment Method
                  </Typography>

                  <Typography fontWeight="bold">
                    {sale.payment_method}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography color="text.secondary">
                    Sales Channel
                  </Typography>

                  <Typography>
                    {sale.sales_channel}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography color="text.secondary">
                    Salesperson
                  </Typography>

                  <Typography>
                    Not Available
                  </Typography>
                </Grid>

              </Grid>
            </Paper>


            {/* Purchased Products */}

            <Paper
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
              }}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
                mb={2}
              >
                Purchased Products
              </Typography>

              <Table>
                <TableHead>
                  <TableRow>

                    <TableCell>
                      <b>Product</b>
                    </TableCell>

                    <TableCell>
                      <b>SKU</b>
                    </TableCell>

                    <TableCell align="right">
                      <b>Quantity</b>
                    </TableCell>

                    <TableCell align="right">
                      <b>Unit Price</b>
                    </TableCell>

                    <TableCell align="right">
                      <b>Line Total</b>
                    </TableCell>

                  </TableRow>
                </TableHead>

                <TableBody>

                  {sale.items?.map(
                    (item: any) => (
                      <TableRow key={item.id}>

                        <TableCell>
                          {item.product_name ||
                            `Product #${item.product_id}`}
                        </TableCell>

                        <TableCell>
                          {item.sku || "N/A"}
                        </TableCell>

                        <TableCell align="right">
                          {item.quantity}
                        </TableCell>

                        <TableCell align="right">
                          ₹{" "}
                          {Number(
                            item.unit_price
                          ).toLocaleString("en-IN")}
                        </TableCell>

                        <TableCell align="right">
                          ₹{" "}
                          {Number(
                            item.total
                          ).toLocaleString("en-IN")}
                        </TableCell>

                      </TableRow>
                    )
                  )}

                </TableBody>
              </Table>
            </Paper>


            {/* Pricing Summary */}

            <Paper
              sx={{
                p: 3,
                borderRadius: 2,
              }}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
                mb={2}
              >
                Pricing Summary
              </Typography>

              <Box
                sx={{
                  maxWidth: 400,
                  ml: "auto",
                }}
              >

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography>
                    Subtotal
                  </Typography>

                  <Typography>
                    ₹{" "}
                    {subtotal.toLocaleString(
                      "en-IN"
                    )}
                  </Typography>
                </Box>


                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography>
                    Discount
                  </Typography>

                  <Typography>
                    ₹{" "}
                    {discount.toLocaleString(
                      "en-IN"
                    )}
                  </Typography>
                </Box>


                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography>
                    Tax
                  </Typography>

                  <Typography>
                    ₹{" "}
                    {tax.toLocaleString(
                      "en-IN"
                    )}
                  </Typography>
                </Box>


                <Divider sx={{ my: 2 }} />


                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                  >
                    Grand Total
                  </Typography>

                  <Typography
                    variant="h6"
                    fontWeight="bold"
                  >
                    ₹{" "}
                    {grandTotal.toLocaleString(
                      "en-IN"
                    )}
                  </Typography>
                </Box>

              </Box>
            </Paper>

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