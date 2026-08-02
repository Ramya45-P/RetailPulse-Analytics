import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import DownloadIcon from "@mui/icons-material/Download";

import { getSales } from "../api/saleApi";

export default function Reports() {
 
  const [sales, setSales] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("All");
  const [payment, setPayment] = useState("All");

  useEffect(() => {
    const loadReports = async () => {
  try {
    const data = await getSales();

    console.log(data);

    setSales(data);
  } catch (error) {
    console.log(error);
  }
};

    loadReports();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const customerMatch =
        sale.customer_name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ?? false;

      const channelMatch =
        channel === "All" || sale.sales_channel === channel;

      const paymentMatch =
        payment === "All" || sale.payment_method === payment;

      return customerMatch && channelMatch && paymentMatch;
    });
  }, [sales, search, channel, payment]);

  const totalRevenue = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.total_amount || 0),
    0
  );

  const averageOrder =
  filteredSales.length > 0
    ? (totalRevenue / filteredSales.length).toFixed(2)
    : "0.00";
    
 
const exportCSV = () => {
  const headers = [
    "Invoice",
    "Customer",
    "Sales Channel",
    "Payment Method",
    "Amount",
  ];

  const rows = filteredSales.map((sale) => [
    sale.invoice_number,
    sale.customer_name,
    sale.sales_channel,
    sale.payment_method,
    sale.total_amount,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "sales_report.csv";
  link.click();

  window.URL.revokeObjectURL(url);
};

return (
  <Box sx={{ p: 3 }}>

    <Typography variant="h4" fontWeight="bold" mb={3}>
      Reports & Analytics
    </Typography>

    {/* Export Button */}
    <Box
      display="flex"
      justifyContent="flex-end"
      mb={2}
    >
      <Button
        variant="contained"
        startIcon={<DownloadIcon />}
        onClick={exportCSV}
      >
        Export CSV
      </Button>
    </Box>

    {/* Search & Filters */}
   <Grid container spacing={2} sx={{ mb: 3 }}>
   <Grid item xs={12} md={4}>
    <TextField
      fullWidth
      label="Search Customer"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </Grid>

  <Grid item xs={12} md={4}>
    <FormControl fullWidth>
      <InputLabel>Sales Channel</InputLabel>
      <Select
        value={channel}
        label="Sales Channel"
        onChange={(e) => setChannel(e.target.value)}
      >
        <MenuItem value="All">All</MenuItem>
        <MenuItem value="Online">Online</MenuItem>
        <MenuItem value="Retail Store">Retail Store</MenuItem>
      </Select>
    </FormControl>
  </Grid>

  <Grid item xs={12} md={4}>
    <FormControl fullWidth>
      <InputLabel>Payment Method</InputLabel>
      <Select
        value={payment}
        label="Payment Method"
        onChange={(e) => setPayment(e.target.value)}
      >
        <MenuItem value="All">All</MenuItem>
        <MenuItem value="Cash">Cash</MenuItem>
        <MenuItem value="UPI">UPI</MenuItem>
        <MenuItem value="Card">Card</MenuItem>
      </Select>
    </FormControl>
  </Grid>
</Grid>

    {/* Summary Cards */}
    <Grid container spacing={3} sx={{ mb: 4 }}>
  <Grid item xs={12} md={4}>
    <Card>
      <CardContent>
        <Typography color="text.secondary">
          Total Orders
        </Typography>

        <Typography variant="h4">
          {filteredSales.length}
        </Typography>
      </CardContent>
    </Card>
  </Grid>

  <Grid item xs={12} md={4}>
    <Card>
      <CardContent>
        <Typography color="text.secondary">
          Total Revenue
        </Typography>

        <Typography variant="h4">
          ₹ {totalRevenue.toLocaleString("en-IN")}
        </Typography>
      </CardContent>
    </Card>
  </Grid>

  <Grid item xs={12} md={4}>
    <Card>
      <CardContent>
        <Typography color="text.secondary">
          Average Order Value
        </Typography>

        <Typography variant="h4">
          ₹ {averageOrder}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
</Grid>

    {/* Sales Report Table */}
    <Card>
      <CardContent>
        <Typography variant="h5" mb={3}>
          Sales Report
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Sales Channel</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Amount</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.invoice_number}</TableCell>
                    <TableCell>{sale.customer_name}</TableCell>
                    <TableCell>{sale.sales_channel}</TableCell>
                    <TableCell>{sale.payment_method}</TableCell>
                    <TableCell>
                      ₹ {Number(sale.total_amount).toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No Sales Found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  </Box>
);
}
   