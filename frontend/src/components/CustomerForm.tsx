import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

import api from "../api/axios";

interface Customer {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  customer_type: string;
  is_active: boolean;
}

interface CustomerFormProps {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  open,
  customer,
  onClose,
  onSaved,
}) => {

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    customer_type: "Retail",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (customer) {
      setFormData({
        full_name: customer.full_name,
        email: customer.email,
        phone: customer.phone,
        address: "",
        customer_type: customer.customer_type,
      });
    } else {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        customer_type: "Retail",
      });
    }

    setError("");

  }, [customer, open]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };


  const validate = () => {

    if (!formData.full_name.trim()) {
      setError("Customer name is required");
      return false;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email
      )
    ) {
      setError("Enter valid email");
      return false;
    }

    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return false;
    }

    setError("");
    return true;
  };


  const handleSave = async () => {

    if (!validate()) return;

    try {

      if (customer) {

        await api.put(
          `/customers/${customer.id}`,
          {
            ...formData,
            is_active: true,
          }
        );

      } else {

        await api.post(
          "/customers/",
          formData
        );

      }


      onSaved();
      onClose();


    } catch (err) {

      console.log(err);
      setError("Unable to save customer");

    }

  };


  return (

    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
    >

      <DialogTitle>
        {customer
          ? "Edit Customer"
          : "Add Customer"}
      </DialogTitle>


      <DialogContent>

        <TextField
          margin="dense"
          label="Customer Name"
          name="full_name"
          fullWidth
          value={formData.full_name}
          onChange={handleChange}
        />


        <TextField
          margin="dense"
          label="Email"
          name="email"
          fullWidth
          value={formData.email}
          onChange={handleChange}
        />


        <TextField
          margin="dense"
          label="Phone"
          name="phone"
          fullWidth
          value={formData.phone}
          onChange={handleChange}
        />


        <TextField
          margin="dense"
          label="Customer Type"
          name="customer_type"
          fullWidth
          value={formData.customer_type}
          onChange={handleChange}
        />


        <TextField
          margin="dense"
          label="Address"
          name="address"
          fullWidth
          multiline
          rows={3}
          value={formData.address}
          onChange={handleChange}
        />


        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}

      </DialogContent>


      <DialogActions>

        <Button onClick={onClose}>
          Cancel
        </Button>


        <Button
          variant="contained"
          onClick={handleSave}
        >
          Save
        </Button>

      </DialogActions>


    </Dialog>

  );
};


export default CustomerForm;