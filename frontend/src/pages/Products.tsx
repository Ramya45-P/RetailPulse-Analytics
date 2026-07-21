import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/productApi";

interface Product {
  id: number;
  name: string;
  sku: string;
  brand: string;
  description: string;
  category_id: number;
  company_id: number;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  unit_of_measure: string;
  status: string;
}

export default function Products() {
  const companyId = 1;

  const emptyForm = {
    name: "",
    sku: "",
    category_id: 1,
    brand: "",
    description: "",
    unit_price: 0,
    cost_price: 0,
    stock_quantity: 0,
    unit_of_measure: "Piece",
    status: "Active",
    company_id: companyId,
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadProducts = async () => {
    try {
      const res = await getProducts(companyId, {
        search,
      });

      setProducts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]:
        name === "unit_price" ||
        name === "cost_price" ||
        name === "stock_quantity"
          ? Number(value)
          : value,
    });
  };

  const handleSave = async () => {
  try {
    if (editingId === null) {
      await createProduct(form);
    } else {
      await updateProduct(editingId, form);
      setEditingId(null);
    }

    setForm(emptyForm);
    loadProducts();
  } catch (err) {
    console.log(err);
  }
};

  const handleDelete = async (id: number) => {
    await deleteProduct(id);
    loadProducts();
  };

  const handleEdit = (product: Product) => {
  setEditingId(product.id);

  setForm({
    name: product.name,
    sku: product.sku,
    category_id: product.category_id,
    brand: product.brand,
    description: product.description,
    unit_price: product.unit_price,
    cost_price: product.cost_price,
    stock_quantity: product.stock_quantity,
    unit_of_measure: product.unit_of_measure,
    status: product.status,
    company_id: product.company_id,
  });
};

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />

      <Box sx={{ flexGrow: 1 }}>
        <Topbar />

        <Box sx={{ p: 3 }}>
          <Typography variant="h4" mb={3}>
            Product Management
          </Typography>

          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Add Product
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="SKU"
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Brand"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Unit Price"
                    name="unit_price"
                    value={form.unit_price}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cost Price"
                    name="cost_price"
                    value={form.cost_price}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Stock Quantity"
                    name="stock_quantity"
                    value={form.stock_quantity}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                  >
                    {editingId ? "Update Product" : "Add Product"}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    fullWidth
                    label="Search Name / SKU / Brand"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ height: 56 }}
                    onClick={loadProducts}
                  >
                    Search
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>{product.unit_price}</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>{product.status}</TableCell>

                   <TableCell align="center">
  <Button
    variant="contained"
    size="small"
    sx={{ mr: 1 }}
    onClick={() => handleEdit(product)}
  >
    Edit
  </Button>

  <Button
    variant="contained"
    color="error"
    size="small"
    onClick={() => handleDelete(product.id)}
  >
    Delete
  </Button>
</TableCell>
                  </TableRow>
                ))}

                {products.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No Products Found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
}