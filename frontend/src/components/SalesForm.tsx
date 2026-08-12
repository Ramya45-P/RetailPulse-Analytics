import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import { getProducts } from "../api/productApi";
import { createSale } from "../api/saleApi";
import api from "../api/axios";

interface SalesFormProps {
  refresh: () => void;
  editSale?: SaleDetail | null;
  onEditComplete?: () => void;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  unit_price: number;
  category_id: number;
  stock_quantity: number;
  status: string;
}

interface Customer {
  id: number;
  full_name: string;
}

interface Category {
  id: number;
  name: string;
}

interface SaleItem {
  id: number;
  product_id: number;
  category_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
  product_name: string | null;
  sku: string | null;
  category_name: string | null;
}

interface SaleDetail {
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
  items: SaleItem[];
}

const SalesForm = ({
  refresh,
  editSale,
  onEditComplete,
}: SalesFormProps) => {
  const companyId = Number(
    localStorage.getItem("company_id")
  );

  const isEditMode = Boolean(editSale);

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [customerId, setCustomerId] =
    useState<number | null>(null);

  const [productId, setProductId] =
    useState<number | null>(null);

  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");

  const [salesChannel, setSalesChannel] =
    useState("Online");

  const [paymentMethod, setPaymentMethod] =
    useState("Cash");

  const [totalAmount, setTotalAmount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [
    unitPrice,
    quantity,
    discount,
    tax,
  ]);

  // Load existing sale when Edit is clicked
  useEffect(() => {
    if (
      editSale &&
      editSale.items &&
      editSale.items.length > 0
    ) {
      const item = editSale.items[0];

      setCustomerId(
        editSale.customer_id
      );

      setProductId(
        item.product_id
      );

      setUnitPrice(
        String(item.unit_price)
      );

      setQuantity(
        String(item.quantity)
      );

      setDiscount(
        String(item.discount)
      );

      setTax(
        String(item.tax)
      );

      setSalesChannel(
        editSale.sales_channel
      );

      setPaymentMethod(
        editSale.payment_method
      );

      setError("");
      setSuccess("");
    }
  }, [editSale]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        productsResponse,
        customersResponse,
        categoriesResponse,
      ] = await Promise.all([
        getProducts(companyId),
        api.get("/customers/"),
        api.get(
          `/categories/?company_id=${companyId}`
        ),
      ]);

      setProducts(
        productsResponse || []
      );

      setCustomers(
        customersResponse.data || []
      );

      setCategories(
        categoriesResponse.data || []
      );
    } catch (err) {
      console.error(
        "Sales form loading error:",
        err
      );

      setError(
        "Failed to load products, customers, or categories."
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const price =
      Number(unitPrice) || 0;

    const qty =
      Number(quantity) || 0;

    const discountValue =
      Number(discount) || 0;

    const taxValue =
      Number(tax) || 0;

    const subtotal =
      price * qty;

    const total =
      subtotal -
      discountValue +
      taxValue;

    setTotalAmount(
      total > 0 ? total : 0
    );
  };

  const selectedProduct =
    products.find(
      (product) =>
        product.id === productId
    );

  const selectedCategory =
    categories.find(
      (category) =>
        category.id ===
        selectedProduct?.category_id
    );

  const subtotal =
    (Number(unitPrice) || 0) *
    (Number(quantity) || 0);

  const quantityNumber =
    Number(quantity);

  const quantityError =
    quantity !== "" &&
    (quantityNumber <= 0 ||
      quantityNumber >
        (selectedProduct?.stock_quantity ??
          Infinity));

  const discountError =
    Number(discount) < 0;

  const taxError =
    Number(tax) < 0;

  const validateForm = () => {
    setError("");

    if (!customerId) {
      setError(
        "Please select a customer."
      );
      return false;
    }

    if (
      !productId ||
      !selectedProduct
    ) {
      setError(
        "Please select a product."
      );
      return false;
    }

    if (
      !quantity ||
      quantityNumber <= 0
    ) {
      setError(
        "Quantity must be greater than 0."
      );
      return false;
    }

    if (
      quantityNumber >
      selectedProduct.stock_quantity
    ) {
      setError(
        `Only ${selectedProduct.stock_quantity} units are available in stock.`
      );
      return false;
    }

    if (Number(unitPrice) <= 0) {
      setError(
        "Unit price must be greater than 0."
      );
      return false;
    }

    if (Number(discount) < 0) {
      setError(
        "Discount cannot be negative."
      );
      return false;
    }

    if (Number(tax) < 0) {
      setError(
        "Tax cannot be negative."
      );
      return false;
    }

    return true;
  };

  const submitSale = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const selectedCustomer =
        customers.find(
          (customer) =>
            customer.id === customerId
        );

      const saleData = {
        customer_id: customerId,
        customer_name:
          selectedCustomer?.full_name ||
          "",
        product_id: productId,
        category_id:
          selectedProduct?.category_id ||
          0,
        quantity: Number(quantity),
        unit_price:
          Number(unitPrice),
        discount:
          Number(discount),
        tax: Number(tax),
        sales_channel:
          salesChannel,
        payment_method:
          paymentMethod,
      };

      console.log(
        isEditMode
          ? "Updating Sale:"
          : "Creating Sale:",
        saleData
      );

      // EDIT SALE
      if (
        isEditMode &&
        editSale
      ) {
        await api.put(
          `/sales/${editSale.id}`,
          saleData
        );

        setSuccess(
          "Sale updated successfully."
        );

        if (onEditComplete) {
          onEditComplete();
        }

        resetForm();

        return;
      }

      // CREATE SALE
      await createSale({
        company_id: companyId,
        ...saleData,
      });

      setSuccess(
        "Sale created successfully."
      );

      resetForm();

      refresh();
    } catch (err: any) {
      console.error(
        "Sale operation failed:",
        err
      );

      const message =
        err?.response?.data?.detail ||
        "Failed to save sale. Please try again.";

      setError(
        Array.isArray(message)
          ? message
              .map(
                (item: any) =>
                  item.msg
              )
              .join(", ")
          : String(message)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCustomerId(null);
    setProductId(null);
    setUnitPrice("");
    setQuantity("1");
    setDiscount("0");
    setTax("0");
    setSalesChannel("Online");
    setPaymentMethod("Cash");
    setTotalAmount(0);
  };

  const handleCancelEdit = () => {
    resetForm();
    setError("");
    setSuccess("");

    if (onEditComplete) {
      onEditComplete();
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 4,
        }}
      >
        <CircularProgress />

        <Typography sx={{ ml: 2 }}>
          Loading sales form...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ mb: 2 }}
      >
        {isEditMode
          ? "Edit Sale Transaction"
          : "Add Sale Transaction"}
      </Typography>

      {isEditMode && editSale && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
        >
          Editing invoice:{" "}
          <strong>
            {editSale.invoice_number}
          </strong>
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() =>
            setSuccess("")
          }
        >
          {success}
        </Alert>
      )}

      {/* CUSTOMER */}

      <TextField
        select
        fullWidth
        label="Customer"
        value={customerId ?? ""}
        onChange={(e) =>
          setCustomerId(
            Number(e.target.value)
          )
        }
        sx={{ mb: 2 }}
      >
        {customers.map(
          (customer) => (
            <MenuItem
              key={customer.id}
              value={customer.id}
            >
              {customer.full_name}
            </MenuItem>
          )
        )}
      </TextField>

      {/* PRODUCT */}

      <TextField
        select
        fullWidth
        label="Product"
        value={productId ?? ""}
        onChange={(e) => {
          const id =
            Number(e.target.value);

          setProductId(id);

          const selected =
            products.find(
              (product) =>
                product.id === id
            );

          if (selected) {
            setUnitPrice(
              String(
                selected.unit_price
              )
            );

            setQuantity("1");
          }
        }}
        sx={{ mb: 2 }}
      >
        {products
          .filter(
            (product) =>
              product.status ===
              "Active"
          )
          .map((product) => (
            <MenuItem
              key={product.id}
              value={product.id}
            >
              {product.name}
            </MenuItem>
          ))}
      </TextField>

      {/* PRODUCT INFORMATION */}

      {selectedProduct && (
        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            backgroundColor:
              "#f5f5f5",
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight="bold"
          >
            Product Information
          </Typography>

          <Typography>
            SKU:{" "}
            {selectedProduct.sku}
          </Typography>

          <Typography>
            Category:{" "}
            {selectedCategory?.name ||
              "Unknown"}
          </Typography>

          <Typography>
            Unit Price: ₹
            {selectedProduct.unit_price.toLocaleString(
              "en-IN"
            )}
          </Typography>

          <Typography>
            Available Stock:{" "}
            {
              selectedProduct.stock_quantity
            }
          </Typography>
        </Box>
      )}

      {/* UNIT PRICE */}

      <TextField
        fullWidth
        label="Unit Price"
        type="number"
        value={unitPrice}
        onChange={(e) =>
          setUnitPrice(
            e.target.value
          )
        }
        inputProps={{
          min: 0,
        }}
        sx={{ mb: 2 }}
      />

      {/* QUANTITY */}

      <TextField
        fullWidth
        label="Quantity"
        type="number"
        value={quantity}
        onChange={(e) =>
          setQuantity(
            e.target.value
          )
        }
        error={quantityError}
        helperText={
          quantityError &&
          selectedProduct
            ? quantityNumber <= 0
              ? "Quantity must be greater than 0."
              : `Only ${selectedProduct.stock_quantity} units available.`
            : selectedProduct
            ? `Available stock: ${selectedProduct.stock_quantity}`
            : ""
        }
        inputProps={{
          min: 1,
        }}
        sx={{ mb: 2 }}
      />

      {/* DISCOUNT */}

      <TextField
        fullWidth
        label="Discount"
        type="number"
        value={discount}
        onChange={(e) =>
          setDiscount(
            e.target.value
          )
        }
        error={discountError}
        helperText={
          discountError
            ? "Discount cannot be negative."
            : ""
        }
        inputProps={{
          min: 0,
        }}
        sx={{ mb: 2 }}
      />

      {/* TAX */}

      <TextField
        fullWidth
        label="Tax"
        type="number"
        value={tax}
        onChange={(e) =>
          setTax(e.target.value)
        }
        error={taxError}
        helperText={
          taxError
            ? "Tax cannot be negative."
            : ""
        }
        inputProps={{
          min: 0,
        }}
        sx={{ mb: 2 }}
      />

      {/* SALES CHANNEL */}

      <TextField
        select
        fullWidth
        label="Sales Channel"
        value={salesChannel}
        onChange={(e) =>
          setSalesChannel(
            e.target.value
          )
        }
        sx={{ mb: 2 }}
      >
        <MenuItem value="Online">
          Online
        </MenuItem>

        <MenuItem value="Store">
          Store
        </MenuItem>

        <MenuItem value="Mobile">
          Mobile
        </MenuItem>
      </TextField>

      {/* PAYMENT METHOD */}

      <TextField
        select
        fullWidth
        label="Payment Method"
        value={paymentMethod}
        onChange={(e) =>
          setPaymentMethod(
            e.target.value
          )
        }
        sx={{ mb: 2 }}
      >
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
      </TextField>

      {/* BILLING SUMMARY */}

      <Box
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: "1px solid #ddd",
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 1 }}
        >
          Billing Summary
        </Typography>

        <Typography>
          Subtotal: ₹
          {subtotal.toLocaleString(
            "en-IN"
          )}
        </Typography>

        <Typography>
          Discount: ₹
          {(
            Number(discount) || 0
          ).toLocaleString(
            "en-IN"
          )}
        </Typography>

        <Typography>
          Tax: ₹
          {(
            Number(tax) || 0
          ).toLocaleString(
            "en-IN"
          )}
        </Typography>

        <Typography
          variant="h6"
          sx={{ mt: 1 }}
        >
          Grand Total: ₹
          {totalAmount.toLocaleString(
            "en-IN"
          )}
        </Typography>
      </Box>

      {/* BUTTONS */}

      <Box
        sx={{
          display: "flex",
          gap: 2,
        }}
      >
        <Button
          variant="contained"
          onClick={submitSale}
          disabled={
            submitting ||
            !customerId ||
            !productId ||
            quantityError ||
            discountError ||
            taxError
          }
        >
          {submitting ? (
            <>
              <CircularProgress
                size={20}
                sx={{ mr: 1 }}
              />

              {isEditMode
                ? "Updating..."
                : "Saving..."}
            </>
          ) : isEditMode ? (
            "Update Sale"
          ) : (
            "Submit Sale"
          )}
        </Button>

        <Button
          variant="outlined"
          onClick={
            isEditMode
              ? handleCancelEdit
              : resetForm
          }
          disabled={submitting}
        >
          {isEditMode
            ? "Cancel Edit"
            : "Reset"}
        </Button>
      </Box>
    </Box>
  );
};

export default SalesForm;