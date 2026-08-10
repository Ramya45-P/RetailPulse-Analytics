import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
} from "@mui/material";

import api from "../api/axios";

interface Customer {
  id: number;
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
  is_active: boolean;
}

interface CustomerFormProps {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  customer_type: string;
  customer_segment: string;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  open,
  customer,
  onClose,
  onSaved,
}) => {
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    customer_type: "Retail",
    customer_segment: "New",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      const nameParts = customer.full_name.trim().split(/\s+/);

      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ");

      setFormData({
        first_name: firstName,
        last_name: lastName,
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        country: customer.country || "",
        postal_code: customer.postal_code || "",
        customer_type: customer.customer_type || "Retail",
        customer_segment: customer.customer_segment || "New",
      });
    } else {
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        country: "",
        postal_code: "",
        customer_type: "Retail",
        customer_segment: "New",
      });
    }

    setError("");
  }, [customer, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    if (!formData.first_name.trim()) {
      setError("First name is required");
      return false;
    }

    if (!formData.last_name.trim()) {
      setError("Last name is required");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      setError("Enter a valid email address");
      return false;
    }

    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return false;
    }

    if (!/^\+?[0-9]{10,15}$/.test(formData.phone.trim())) {
      setError("Phone number must contain 10 to 15 digits");
      return false;
    }

    if (!formData.address.trim()) {
      setError("Address is required");
      return false;
    }

    if (!formData.city.trim()) {
      setError("City is required");
      return false;
    }

    if (!formData.state.trim()) {
      setError("State is required");
      return false;
    }

    if (!formData.country.trim()) {
      setError("Country is required");
      return false;
    }

    if (!formData.postal_code.trim()) {
      setError("Postal code is required");
      return false;
    }

    if (formData.postal_code.trim().length < 3) {
      setError("Enter a valid postal code");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);
    setError("");

    const fullName =
      `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();

    const payload = {
      full_name: fullName,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      country: formData.country.trim(),
      postal_code: formData.postal_code.trim(),
      customer_type: formData.customer_type,
      customer_segment: formData.customer_segment,
    };

    try {
      if (customer) {
        await api.put(
          `/customers/${customer.id}`,
          {
            ...payload,
            is_active: customer.is_active,
          }
        );
      } else {
        await api.post(
          "/customers/",
          payload
        );
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Customer save failed:", err);

      const detail = err?.response?.data?.detail;

      if (detail) {
        setError(detail);
      } else if (err?.response?.status === 422) {
        setError("Please check all required fields.");
      } else {
        setError(
          "Unable to save customer. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {customer ? "Edit Customer" : "Add Customer"}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert
            severity="error"
            sx={{ mt: 1, mb: 2 }}
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="First Name"
              name="first_name"
              fullWidth
              required
              value={formData.first_name}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Last Name"
              name="last_name"
              fullWidth
              required
              value={formData.last_name}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Email"
              name="email"
              type="email"
              fullWidth
              required
              value={formData.email}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Phone Number"
              name="phone"
              fullWidth
              required
              value={formData.phone}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              label="Address"
              name="address"
              fullWidth
              required
              multiline
              rows={2}
              value={formData.address}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="City"
              name="city"
              fullWidth
              required
              value={formData.city}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="State"
              name="state"
              fullWidth
              required
              value={formData.state}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Country"
              name="country"
              fullWidth
              required
              value={formData.country}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Postal Code"
              name="postal_code"
              fullWidth
              required
              value={formData.postal_code}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Customer Type</InputLabel>

              <Select
                name="customer_type"
                value={formData.customer_type}
                label="Customer Type"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer_type: e.target.value,
                  })
                }
              >
                <MenuItem value="Retail">
                  Retail
                </MenuItem>

                <MenuItem value="Wholesale">
                  Wholesale
                </MenuItem>

                <MenuItem value="Corporate">
                  Corporate
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>
                Customer Segment
              </InputLabel>

              <Select
                name="customer_segment"
                value={formData.customer_segment}
                label="Customer Segment"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer_segment: e.target.value,
                  })
                }
              >
                <MenuItem value="New">
                  New
                </MenuItem>

                <MenuItem value="Regular">
                  Regular
                </MenuItem>

                <MenuItem value="Loyal">
                  Loyal
                </MenuItem>

                <MenuItem value="VIP">
                  VIP
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerForm;