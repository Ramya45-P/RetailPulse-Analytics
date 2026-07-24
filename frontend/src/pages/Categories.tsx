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


import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/categoryApi";

interface Category {
  id: number;
  name: string;
  description: string;
  status: string;
  company_id: number;
}

export default function Categories() {
  const companyId = 1;

  const emptyForm = {
    name: "",
    description: "",
    status: "Active",
    company_id: companyId,
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const loadCategories = async () => {
    try {
      const res = await getCategories(companyId);

      let data = res.data;

      if (search.trim() !== "") {
        data = data.filter((item: Category) =>
          item.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      setCategories(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      if (editingId === null) {
        await createCategory(form);
      } else {
        await updateCategory(editingId, form);
        setEditingId(null);
      }

      setForm(emptyForm);

      loadCategories();
    } catch (err) {
      console.log(err);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);

    setForm({
      name: category.name,
      description: category.description,
      status: category.status,
      company_id: category.company_id,
    });
  };

  const handleDelete = async (id: number) => {
    await deleteCategory(id);

    loadCategories();
  };

  
   return (
  <Box sx={{ p: 3 }}>
          <Typography variant="h4" mb={3}>
            Category Management
          </Typography>

          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>
                {editingId ? "Update Category" : "Add Category"}
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Category Name"
                    name="name"
                    value={form.name}
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

                <Grid size={{ xs: 12 }}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                  >
                    {editingId
                      ? "Update Category"
                      : "Add Category"}
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
                    label="Search Category"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ height: 56 }}
                    onClick={loadCategories}
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
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      {category.name}
                    </TableCell>

                    <TableCell>
                      {category.description}
                    </TableCell>

                    <TableCell>
                      {category.status}
                    </TableCell>

                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() =>
                          handleEdit(category)
                        }
                      >
                        Edit
                      </Button>

                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() =>
                          handleDelete(category.id)
                        }
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {categories.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                    >
                      No Categories Found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      
  );
}