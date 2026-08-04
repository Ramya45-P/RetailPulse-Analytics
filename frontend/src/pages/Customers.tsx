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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import CustomerDetailsDialog from "../components/CustomerDetailsDialog";


import api from "../api/axios";
import CustomerForm from "../components/CustomerForm";

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
const [viewCustomerId, setViewCustomerId] = useState<number | null>(null);
const [openView, setOpenView] = useState(false);

const [search, setSearch] = useState("");
  
const [typeFilter, setTypeFilter] = useState("All");
const [statusFilter, setStatusFilter] = useState("All");

  const loadCustomers = async () => {
    try {
      const res = await api.get("/customers/");
      setCustomers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/customers/${id}`);
      loadCustomers();
    } catch (err) {
      console.log("Delete failed", err);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpenForm(true);
  };

  const handleAdd = () => {
    setSelectedCustomer(null);
    setOpenForm(true);
  };

  const handleView = (id: number) => {
  setViewCustomerId(id);
  setOpenView(true);
};
 const filteredCustomers = customers.filter((customer) => {
  const matchesSearch =
    customer.full_name.toLowerCase().includes(search.toLowerCase()) ||
    customer.customer_id.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase()) ||
    customer.phone.includes(search);

  const matchesType =
    typeFilter === "All" || customer.customer_type === typeFilter;

  const matchesStatus =
    statusFilter === "All" ||
    (statusFilter === "Active" && customer.is_active) ||
    (statusFilter === "Inactive" && !customer.is_active);

  return matchesSearch && matchesType && matchesStatus;
});

const totalCustomers = customers.length;

const activeCustomers = customers.filter(
  (c) => c.is_active
).length;

const inactiveCustomers = customers.filter(
  (c) => !c.is_active
).length;

const retailCustomers = customers.filter(
  (c) => c.customer_type === "Retail"
).length;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Customer Management
      </Typography>

    <Grid container spacing={2} sx={{ mb: 3 }}>
  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    <Card>
      <CardContent>
        <Typography variant="h6">Total Customers</Typography>
        <Typography variant="h4">{totalCustomers}</Typography>
      </CardContent>
    </Card>
  </Grid>

  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    <Card>
      <CardContent>
        <Typography variant="h6">Active Customers</Typography>
        <Typography variant="h4">{activeCustomers}</Typography>
      </CardContent>
    </Card>
  </Grid>

  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    <Card>
      <CardContent>
        <Typography variant="h6">Inactive Customers</Typography>
        <Typography variant="h4">{inactiveCustomers}</Typography>
      </CardContent>
    </Card>
  </Grid>

  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    <Card>
      <CardContent>
        <Typography variant="h6">Retail Customers</Typography>
        <Typography variant="h4">{retailCustomers}</Typography>
      </CardContent>
    </Card>
  </Grid>
</Grid>  

      <Button
        variant="contained"
        sx={{ mb: 3, mr: 2 }}
        onClick={handleAdd}
      >
        Add Customer
      </Button>

      <Button
        variant="outlined"
        sx={{ mb: 3 }}
        onClick={loadCustomers}
      >
        Refresh
      </Button>

      <Card>
        <CardContent>
            <Box sx={{ overflowX: "auto" }}>
          <TextField
            label="Search Customer"
            placeholder="Name, ID, Email or Phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 3, width: 350 }}
          /> 

          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
  <FormControl sx={{ minWidth: 180 }}>
    <InputLabel>Customer Type</InputLabel>
    <Select
      value={typeFilter}
      label="Customer Type"
      onChange={(e) => setTypeFilter(e.target.value)}
    >
      <MenuItem value="All">All</MenuItem>
      <MenuItem value="Retail">Retail</MenuItem>
      <MenuItem value="Wholesale">Wholesale</MenuItem>
      <MenuItem value="Corporate">Corporate</MenuItem>
    </Select>
  </FormControl>

  <FormControl sx={{ minWidth: 180 }}>
    <InputLabel>Status</InputLabel>
    <Select
      value={statusFilter}
      label="Status"
      onChange={(e) => setStatusFilter(e.target.value)}
    >
      <MenuItem value="All">All</MenuItem>
      <MenuItem value="Active">Active</MenuItem>
      <MenuItem value="Inactive">Inactive</MenuItem>
    </Select>
  </FormControl>
</Box>   
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
              {filteredCustomers.map((customer) => (
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
                  <TableCell sx={{ minWidth: 220 }}>

                    <button
  onClick={() => handleView(customer.id)}
  style={{
    marginRight: "10px",
    padding: "6px 12px",
    cursor: "pointer",
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: "4px",
  }}
>
  View
</button>

  <button
    onClick={() => handleEdit(customer)}
    style={{
      marginRight: "10px",
      padding: "6px 12px",
      cursor: "pointer",
    }}
  >
    Edit
  </button>



  <button
    onClick={() => handleDelete(customer.id)}
    style={{
      padding: "6px 12px",
      cursor: "pointer",
      backgroundColor: "red",
      color: "white",
      border: "none",
      borderRadius: "4px",
    }}
  >
    Delete
  </button>

</TableCell> 
       
  
                  
                </TableRow>
              ))}
            </TableBody>

          </Table>
          </Box>
        </CardContent>
      </Card>

      <CustomerForm
        open={openForm}
        customer={selectedCustomer}
        onClose={() => {
          setOpenForm(false);
          setSelectedCustomer(null);
        }}
        onSaved={loadCustomers}
      />

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