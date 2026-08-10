import { useEffect, useState } from "react";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";

import CustomerDetailsDialog from "../components/CustomerDetailsDialog";
import CustomerForm from "../components/CustomerForm";
import api from "../api/axios";

interface Customer {
  id: number;
  customer_id: string;
  full_name: string;
  email: string;
  phone: string;
  customer_type: string;
  is_active: boolean;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [openForm, setOpenForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [viewCustomerId, setViewCustomerId] =
    useState<number | null>(null);
  const [openView, setOpenView] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // =========================
  // LOAD CUSTOMERS
  // =========================

  const loadCustomers = async () => {
    try {
      const res = await api.get("/customers/");
      setCustomers(res.data);
    } catch (err) {
      console.log("Failed to load customers", err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // =========================
  // DELETE CUSTOMER
  // =========================

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/customers/${id}`);
      await loadCustomers();
    } catch (err) {
      console.log("Delete failed", err);
    }
  };

  // =========================
  // ADD CUSTOMER
  // =========================

  const handleAdd = () => {
    setSelectedCustomer(null);
    setOpenForm(true);
  };

  // =========================
  // EDIT CUSTOMER
  // =========================

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpenForm(true);
  };

  // =========================
  // VIEW CUSTOMER
  // =========================

  const handleView = (id: number) => {
    setViewCustomerId(id);
    setOpenView(true);
  };

  // =========================
  // FILTER CUSTOMERS
  // =========================

  const filteredCustomers = customers.filter((customer) => {
    const searchValue = search.toLowerCase();

    const matchesSearch =
      customer.full_name.toLowerCase().includes(searchValue) ||
      customer.customer_id.toLowerCase().includes(searchValue) ||
      customer.email.toLowerCase().includes(searchValue) ||
      customer.phone.includes(searchValue);

    const matchesType =
      typeFilter === "All" ||
      customer.customer_type === typeFilter;

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && customer.is_active) ||
      (statusFilter === "Inactive" && !customer.is_active);

    return matchesSearch && matchesType && matchesStatus;
  });

  // =========================
  // CUSTOMER STATISTICS
  // =========================

  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(
    (customer) => customer.is_active
  ).length;

  const inactiveCustomers = customers.filter(
    (customer) => !customer.is_active
  ).length;

  const retailCustomers = customers.filter(
    (customer) => customer.customer_type === "Retail"
  ).length;

  return (
    <Box sx={{ p: 4 }}>
      {/* PAGE TITLE */}

      <Typography
        variant="h4"
        fontWeight="bold"
        textAlign="center"
        sx={{ mb: 4 }}
      >
        Customer Management
      </Typography>

      {/* CUSTOMER STATISTICS */}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">
                Total Customers
              </Typography>

              <Typography variant="h4" fontWeight="bold">
                {totalCustomers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">
                Active Customers
              </Typography>

              <Typography variant="h4" fontWeight="bold">
                {activeCustomers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">
                Inactive Customers
              </Typography>

              <Typography variant="h4" fontWeight="bold">
                {inactiveCustomers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6">
                Retail Customers
              </Typography>

              <Typography variant="h4" fontWeight="bold">
                {retailCustomers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ACTION BUTTONS */}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          sx={{ mr: 2 }}
          onClick={handleAdd}
        >
          Add Customer
        </Button>

        <Button
          variant="outlined"
          onClick={loadCustomers}
        >
          Refresh
        </Button>
      </Box>

      {/* CUSTOMER TABLE */}

      <Card>
        <CardContent>
          {/* SEARCH */}

          <TextField
            label="Search Customer"
            placeholder="Name, ID, Email or Phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 3, width: 350 }}
          />

          {/* FILTERS */}

          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 3,
              flexWrap: "wrap",
            }}
          >
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Customer Type</InputLabel>

              <Select
                value={typeFilter}
                label="Customer Type"
                onChange={(e) =>
                  setTypeFilter(e.target.value)
                }
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Retail">Retail</MenuItem>
                <MenuItem value="Wholesale">
                  Wholesale
                </MenuItem>
                <MenuItem value="Corporate">
                  Corporate
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Status</InputLabel>

              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
              >
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">
                  Inactive
                </MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* TABLE */}

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <b>ID</b>
                  </TableCell>

                  <TableCell>
                    <b>Name</b>
                  </TableCell>

                  <TableCell>
                    <b>Email</b>
                  </TableCell>

                  <TableCell>
                    <b>Phone</b>
                  </TableCell>

                  <TableCell>
                    <b>Type</b>
                  </TableCell>

                  <TableCell>
                    <b>Status</b>
                  </TableCell>

                  <TableCell>
                    <b>Actions</b>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        {customer.customer_id}
                      </TableCell>

                      <TableCell>
                        {customer.full_name}
                      </TableCell>

                      <TableCell>
                        {customer.email}
                      </TableCell>

                      <TableCell>
                        {customer.phone}
                      </TableCell>

                      <TableCell>
                        {customer.customer_type}
                      </TableCell>

                      <TableCell>
                        {customer.is_active
                          ? "Active"
                          : "Inactive"}
                      </TableCell>

                      <TableCell
                        sx={{
                          minWidth: 230,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {/* VIEW */}

                        <Button
                          variant="contained"
                          size="small"
                          onClick={() =>
                            handleView(customer.id)
                          }
                          sx={{ mr: 1 }}
                        >
                          View
                        </Button>

                        {/* EDIT */}

                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() =>
                            handleEdit(customer)
                          }
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>

                        {/* DELETE */}

                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() =>
                            handleDelete(customer.id)
                          }
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                    >
                      No customers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ADD / EDIT CUSTOMER */}

      <CustomerForm
        open={openForm}
        customer={selectedCustomer}
        onClose={() => {
          setOpenForm(false);
          setSelectedCustomer(null);
        }}
        onSaved={loadCustomers}
      />

      {/* CUSTOMER DETAILS */}

      <CustomerDetailsDialog
        open={openView}
        customerId={viewCustomerId}
        onClose={() => {
          setOpenView(false);
          setViewCustomerId(null);
        }}
      />
    </Box>
  );
}