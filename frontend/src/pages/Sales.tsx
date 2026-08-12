import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
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

import {
  getSales,
  getSaleDetails,
  deleteSale,
  type SaleDetail,
} from "../api/saleApi";

import SalesForm from "../components/SalesForm";

interface Sale {
  id: number;
  company_id: number;
  customer_id: number | null;
  invoice_number: string;
  customer_name: string;
  sale_date: string;
  sales_channel: string;
  payment_method: string;
  total_amount: number;
  created_at: string;
}

type SortField =
  | "date"
  | "amount"
  | "customer";

export default function Sales() {
  const companyId = Number(
    localStorage.getItem("company_id")
  );

  const [pdfLoading, setPdfLoading] =
    useState(false);

  const [sales, setSales] =
    useState<Sale[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [paymentFilter, setPaymentFilter] =
    useState("All");

  const [sortField, setSortField] =
    useState<SortField>("date");

  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">("desc");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  // -----------------------------
  // Invoice / Sales Details State
  // -----------------------------

  const [selectedSale, setSelectedSale] =
    useState<SaleDetail | null>(null);

  const [editSale, setEditSale] =
  useState<SaleDetail | null>(null);

const [editLoading, setEditLoading] =
  useState(false);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  // -----------------------------
  // Load Sales
  // -----------------------------

  const loadSales = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getSales(companyId);

      console.log(
        "Sales API Data:",
        data
      );

      setSales(data || []);
    } catch (error) {
      console.error(
        "Sales loading failed:",
        error
      );

      setError(
        "Failed to load sales data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  // -----------------------------
  // View Sale Details
  // -----------------------------

  const handleViewDetails = async (
    id: number
  ) => {
    try {
      setDetailsLoading(true);
      setError("");

      const data =
        await getSaleDetails(id);

      console.log(
        "Sale Details:",
        data
      );

      setSelectedSale(data);
      setDetailsOpen(true);
    } catch (error) {
      console.error(
        "Failed to load sale details:",
        error
      );

      setError(
        "Failed to load sale details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedSale(null);
  };

  const handleEdit = async (
  id: number
) => {
  try {
    setEditLoading(true);
    setError("");

    const data =
      await getSaleDetails(id);

    console.log(
      "Sale selected for edit:",
      data
    );

    setEditSale(data);
  } catch (error) {
    console.error(
      "Failed to load sale for editing:",
      error
    );

    setError(
      "Failed to load sale for editing."
    );
  } finally {
    setEditLoading(false);
  }
};

const handleEditComplete = () => {
  setEditSale(null);
  loadSales();
};

  // -----------------------------
  // Delete Sale
  // -----------------------------

  const handleDelete = async (
    id: number
  ) => {
    try {
      setError("");

      await deleteSale(id);

      await loadSales();
    } catch (error) {
      console.error(
        "Delete failed:",
        error
      );

      setError(
        "Failed to delete the sale."
      );
    }
  };

  // -----------------------------
  // Filtering + Sorting
  // -----------------------------

  const filteredSales = useMemo(() => {
    let result = [...sales];

    // Search
    if (search.trim()) {
      const searchValue =
        search.toLowerCase();

      result = result.filter(
        (sale) =>
          sale.invoice_number
            .toLowerCase()
            .includes(searchValue) ||
          sale.customer_name
            .toLowerCase()
            .includes(searchValue)
      );
    }

    // Payment filter
    if (paymentFilter !== "All") {
      result = result.filter(
        (sale) =>
          sale.payment_method ===
          paymentFilter
      );
    }

    // Start date
    if (startDate) {
      result = result.filter(
        (sale) =>
          new Date(
            sale.sale_date
          ) >= new Date(startDate)
      );
    }

    // End date
    if (endDate) {
      const end = new Date(endDate);

      end.setHours(
        23,
        59,
        59,
        999
      );

      result = result.filter(
        (sale) =>
          new Date(
            sale.sale_date
          ) <= end
      );
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === "date") {
        comparison =
          new Date(
            a.sale_date
          ).getTime() -
          new Date(
            b.sale_date
          ).getTime();
      }

      if (sortField === "amount") {
        comparison =
          Number(a.total_amount) -
          Number(b.total_amount);
      }

      if (sortField === "customer") {
        comparison =
          a.customer_name.localeCompare(
            b.customer_name
          );
      }

      return sortOrder === "asc"
        ? comparison
        : -comparison;
    });

    return result;
  }, [
    sales,
    search,
    paymentFilter,
    startDate,
    endDate,
    sortField,
    sortOrder,
  ]);

  // -----------------------------
  // Summary
  // -----------------------------

  const totalRevenue =
    sales.reduce(
      (sum, sale) =>
        sum +
        Number(
          sale.total_amount || 0
        ),
      0
    );

  const totalChannels =
    new Set(
      sales.map(
        (sale) =>
          sale.sales_channel
      )
    ).size;

  // -----------------------------
  // Sort Order
  // -----------------------------

  const toggleSortOrder = () => {
    setSortOrder((previous) =>
      previous === "asc"
        ? "desc"
        : "asc"
    );
  };

  // -----------------------------
  // Invoice Calculations
  // -----------------------------

  const invoiceSubtotal =
    selectedSale?.items.reduce(
      (sum, item) =>
        sum +
        Number(item.unit_price || 0) *
          Number(item.quantity || 0),
      0
    ) || 0;

  const invoiceDiscount =
    selectedSale?.items.reduce(
      (sum, item) =>
        sum +
        Number(item.discount || 0),
      0
    ) || 0;

  const invoiceTax =
    selectedSale?.items.reduce(
      (sum, item) =>
        sum +
        Number(item.tax || 0),
      0
    ) || 0;

  // -----------------------------
  // PDF Export
  // -----------------------------

  const handleExportPDF = async () => {
    if (!selectedSale) return;

    try {
      setPdfLoading(true);

      const invoiceElement =
        document.getElementById(
          "invoice-preview"
        );

      if (!invoiceElement) {
        setError(
          "Invoice preview not found."
        );
        return;
      }

      const canvas =
        await html2canvas(
          invoiceElement,
          {
            scale: 2,
            useCORS: true,
            backgroundColor:
              "#ffffff",
          }
        );

      const imgData =
        canvas.toDataURL("image/png");

      const pdf = new jsPDF(
        "p",
        "mm",
        "a4"
      );

      const pdfWidth = 210;

      const pdfHeight =
        (canvas.height * pdfWidth) /
        canvas.width;

      const pageHeight = 297;

      let heightLeft = pdfHeight;

      let position = 0;

      pdf.addImage(
        imgData,
        "PNG",
        0,
        position,
        pdfWidth,
        pdfHeight
      );

      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;

        pdf.addPage();

        pdf.addImage(
          imgData,
          "PNG",
          0,
          position,
          pdfWidth,
          pdfHeight
        );

        heightLeft -= pageHeight;
      }

      pdf.save(
        `${selectedSale.invoice_number}.pdf`
      );
    } catch (error) {
      console.error(
        "PDF export failed:",
        error
      );

      setError(
        "Failed to export invoice as PDF."
      );
    } finally {
      setPdfLoading(false);
    }
  };

  // -----------------------------
  // CSV Export
  // -----------------------------

  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      setError(
        "No sales available to export."
      );
      return;
    }

    const headers = [
      "Invoice Number",
      "Customer Name",
      "Sale Date",
      "Sales Channel",
      "Payment Method",
      "Total Amount",
    ];

    const rows = filteredSales.map(
      (sale) => [
        sale.invoice_number,
        sale.customer_name,
        new Date(
          sale.sale_date
        ).toLocaleDateString(
          "en-IN"
        ),
        sale.sales_channel,
        sale.payment_method,
        Number(
          sale.total_amount || 0
        ).toFixed(2),
      ]
    );

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const text =
              String(
                value ?? ""
              );

            return `"${text.replace(
              /"/g,
              '""'
            )}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      "sales-report.csv";

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(url);
  };

  // -----------------------------
  // JSX
  // -----------------------------

  return (
    <Box
      sx={{
        p: 4,
        width: "100%",
      }}
    >
      <Typography
        variant="h4"
        sx={{ mb: 3 }}
      >
        Sales Management
      </Typography>

      {/* Error */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          onClose={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      {/* Summary Cards */}

      <Grid
        container
        spacing={3}
        mb={3}
      >
        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Total Orders
              </Typography>

              <Typography variant="h4">
                {sales.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Total Revenue
              </Typography>

              <Typography variant="h4">
                ₹
                {totalRevenue.toLocaleString(
                  "en-IN"
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 4,
          }}
        >
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Sales Channels
              </Typography>

              <Typography variant="h4">
                {totalChannels}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Sale */}

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: 3,
          mb: 4,
        }}
      >
        <CardContent>
          <SalesForm
  refresh={loadSales}
  editSale={editSale}
  onEditComplete={
    handleEditComplete
  }
/>
        </CardContent>
      </Card>

      {/* Filters */}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ mb: 2 }}
          >
            Search & Filters
          </Typography>

          <Grid
            container
            spacing={2}
          >
            {/* Search */}

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <TextField
                fullWidth
                label="Search"
                placeholder="Invoice number or customer name"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />
            </Grid>

            {/* Payment */}

            <Grid
              size={{
                xs: 12,
                md: 2,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Payment Method
                </InputLabel>

                <Select
                  value={
                    paymentFilter
                  }
                  label="Payment Method"
                  onChange={(e) =>
                    setPaymentFilter(
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="All">
                    All
                  </MenuItem>

                  <MenuItem value="Cash">
                    Cash
                  </MenuItem>

                  <MenuItem value="UPI">
                    UPI
                  </MenuItem>

                  <MenuItem value="Card">
                    Card
                  </MenuItem>

                  <MenuItem value="Online">
                    Online
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* From */}

            <Grid
              size={{
                xs: 12,
                md: 2,
              }}
            >
              <TextField
                fullWidth
                type="date"
                label="From"
                InputLabelProps={{
                  shrink: true,
                }}
                value={startDate}
                onChange={(e) =>
                  setStartDate(
                    e.target.value
                  )
                }
              />
            </Grid>

            {/* To */}

            <Grid
              size={{
                xs: 12,
                md: 2,
              }}
            >
              <TextField
                fullWidth
                type="date"
                label="To"
                InputLabelProps={{
                  shrink: true,
                }}
                value={endDate}
                onChange={(e) =>
                  setEndDate(
                    e.target.value
                  )
                }
              />
            </Grid>

            {/* Sort */}

            <Grid
              size={{
                xs: 12,
                md: 2,
              }}
            >
              <FormControl fullWidth>
                <InputLabel>
                  Sort By
                </InputLabel>

                <Select
                  value={sortField}
                  label="Sort By"
                  onChange={(e) =>
                    setSortField(
                      e.target
                        .value as SortField
                    )
                  }
                >
                  <MenuItem value="date">
                    Date
                  </MenuItem>

                  <MenuItem value="amount">
                    Total Amount
                  </MenuItem>

                  <MenuItem value="customer">
                    Customer
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Buttons */}

            <Grid
              size={{
                xs: 12,
                md: 12,
              }}
            >
              <Button
                variant="outlined"
                onClick={
                  toggleSortOrder
                }
              >
                Sort Order:{" "}
                {sortOrder === "asc"
                  ? "Ascending ↑"
                  : "Descending ↓"}
              </Button>

              <Button
                sx={{ ml: 2 }}
                variant="text"
                onClick={() => {
                  setSearch("");
                  setPaymentFilter(
                    "All"
                  );
                  setStartDate("");
                  setEndDate("");
                  setSortField(
                    "date"
                  );
                  setSortOrder(
                    "desc"
                  );
                }}
              >
                Clear Filters
              </Button>

              <Button
                sx={{ ml: 2 }}
                variant="contained"
                onClick={
                  handleExportCSV
                }
                disabled={
                  filteredSales.length ===
                  0
                }
              >
                Export CSV
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sales Table */}

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 3,
          boxShadow: 3,
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent:
                "center",
              alignItems: "center",
              py: 6,
            }}
          >
            <CircularProgress />

            <Typography sx={{ ml: 2 }}>
              Loading sales...
            </Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>
                    Invoice Number
                  </b>
                </TableCell>

                <TableCell>
                  <b>
                    Customer Name
                  </b>
                </TableCell>

                <TableCell>
                  <b>Sale Date</b>
                </TableCell>

                <TableCell>
                  <b>
                    Sales Channel
                  </b>
                </TableCell>

                <TableCell>
                  <b>
                    Payment Method
                  </b>
                </TableCell>

                <TableCell>
                  <b>
                    Total Amount
                  </b>
                </TableCell>

                <TableCell align="center">
                  <b>Actions</b>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredSales.map(
                (sale) => (
                  <TableRow
                    key={sale.id}
                  >
                    <TableCell>
                      {
                        sale.invoice_number
                      }
                    </TableCell>

                    <TableCell>
                      {
                        sale.customer_name
                      }
                    </TableCell>

                    <TableCell>
                      {new Date(
                        sale.sale_date
                      ).toLocaleDateString(
                        "en-IN"
                      )}
                    </TableCell>

                    <TableCell>
                      {
                        sale.sales_channel
                      }
                    </TableCell>

                    <TableCell>
                      {
                        sale.payment_method
                      }
                    </TableCell>

                    <TableCell>
                      ₹
                      {Number(
                        sale.total_amount ||
                          0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </TableCell>

                   <TableCell align="center">
  <Button
    variant="outlined"
    size="small"
    sx={{
      mr: 1,
    }}
    onClick={() =>
      handleViewDetails(
        sale.id
      )
    }
  >
    View
  </Button>

  <Button
    variant="contained"
    color="primary"
    size="small"
    sx={{
      mr: 1,
    }}
    onClick={() =>
      handleEdit(
        sale.id
      )
    }
  >
    Edit
  </Button>

  <Button
    variant="contained"
    color="error"
    size="small"
    onClick={() =>
      handleDelete(
        sale.id
      )
    }
  >
    Delete
  </Button>
</TableCell>
                  </TableRow>
                )
              )}

              {!loading &&
                filteredSales.length ===
                  0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                    >
                      <Typography
                        sx={{
                          py: 4,
                        }}
                      >
                        No sales found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Invoice Preview */}

      <Dialog
        open={detailsOpen}
        onClose={
          handleCloseDetails
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Typography variant="h5">
            Invoice Preview
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {detailsLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "center",
                alignItems: "center",
                py: 6,
              }}
            >
              <CircularProgress />

              <Typography sx={{ ml: 2 }}>
                Loading invoice...
              </Typography>
            </Box>
          ) : selectedSale ? (
            <Box id="invoice-preview">
              {/* Invoice Information */}

              <Typography
                variant="h6"
                sx={{ mb: 2 }}
              >
                Invoice Information
              </Typography>

              <Grid
                container
                spacing={2}
                sx={{ mb: 3 }}
              >
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Typography>
                    <b>
                      Invoice Number:
                    </b>{" "}
                    {
                      selectedSale.invoice_number
                    }
                  </Typography>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Typography>
                    <b>Sale Date:</b>{" "}
                    {new Date(
                      selectedSale.sale_date
                    ).toLocaleDateString(
                      "en-IN"
                    )}
                  </Typography>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Typography>
                    <b>Customer:</b>{" "}
                    {
                      selectedSale.customer_name
                    }
                  </Typography>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Typography>
                    <b>
                      Payment Method:
                    </b>{" "}
                    {
                      selectedSale.payment_method
                    }
                  </Typography>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Typography>
                    <b>
                      Sales Channel:
                    </b>{" "}
                    {
                      selectedSale.sales_channel
                    }
                  </Typography>
                </Grid>

                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                  }}
                >
                  <Typography>
                    <b>Salesperson:</b>{" "}
                    Admin
                  </Typography>
                </Grid>
              </Grid>

              <Divider
                sx={{ mb: 3 }}
              />

              {/* Purchased Products */}

              <Typography
                variant="h6"
                sx={{ mb: 2 }}
              >
                Purchased Products
              </Typography>

              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ mb: 3 }}
              >
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
                        <b>
                          Quantity
                        </b>
                      </TableCell>

                      <TableCell align="right">
                        <b>
                          Unit Price
                        </b>
                      </TableCell>

                      <TableCell align="right">
                        <b>
                          Line Total
                        </b>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {selectedSale.items.map(
                      (item) => (
                        <TableRow
                          key={item.id}
                        >
                          <TableCell>
                            {item.product_name ||
                              "Product"}
                          </TableCell>

                          <TableCell>
                            {item.sku || "-"}
                          </TableCell>

                          <TableCell align="right">
                            {
                              item.quantity
                            }
                          </TableCell>

                          <TableCell align="right">
                            ₹
                            {Number(
                              item.unit_price
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </TableCell>

                          <TableCell align="right">
                            ₹
                            {Number(
                              item.total
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pricing Summary */}

              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                }}
              >
                <Box
                  sx={{
                    width: 320,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 2 }}
                  >
                    Pricing Summary
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography>
                      Subtotal
                    </Typography>

                    <Typography>
                      ₹
                      {invoiceSubtotal.toLocaleString(
                        "en-IN"
                      )}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography>
                      Discount
                    </Typography>

                    <Typography>
                      ₹
                      {invoiceDiscount.toLocaleString(
                        "en-IN"
                      )}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography>
                      Tax
                    </Typography>

                    <Typography>
                      ₹
                      {invoiceTax.toLocaleString(
                        "en-IN"
                      )}
                    </Typography>
                  </Box>

                  <Divider
                    sx={{ my: 1 }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                    }}
                  >
                    <Typography
                      variant="h6"
                    >
                      Grand Total
                    </Typography>

                    <Typography
                      variant="h6"
                    >
                      ₹
                      {Number(
                        selectedSale.total_amount
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography>
              No invoice details
              available.
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={
              handleCloseDetails
            }
          >
            Close
          </Button>

          <Button
            variant="contained"
            onClick={
              handleExportPDF
            }
            disabled={
              pdfLoading ||
              !selectedSale
            }
          >
            {pdfLoading ? (
              <>
                <CircularProgress
                  size={20}
                  sx={{ mr: 1 }}
                />
                Generating PDF...
              </>
            ) : (
              "Export PDF"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}