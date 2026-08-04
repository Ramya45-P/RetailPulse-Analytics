import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
} from "@mui/material";
import api from "../api/axios";

interface Props {
  open: boolean;
  customerId: number | null;
  onClose: () => void;
}

export default function CustomerDetailsDialog({
  open,
  customerId,
  onClose,
}: Props) {
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    if (open && customerId) {
      api.get(`/customers/${customerId}`).then((res) => {
        setCustomer(res.data);
      });
    }
  }, [open, customerId]);

  if (!customer) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Customer Details</DialogTitle>

      <DialogContent>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <Typography><b>Customer ID:</b> {customer.customer_id}</Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography><b>Name:</b> {customer.full_name}</Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography><b>Email:</b> {customer.email}</Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography><b>Phone:</b> {customer.phone}</Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography><b>Address:</b> {customer.address}</Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography><b>City:</b> {customer.city || "-"}</Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography><b>State:</b> {customer.state || "-"}</Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography><b>Country:</b> {customer.country || "-"}</Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography><b>Customer Type:</b> {customer.customer_type}</Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Sales Channel:</b> {customer.preferred_sales_channel}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Status:</b> {customer.is_active ? "Active" : "Inactive"}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography>
              <b>Created:</b>{" "}
              {new Date(customer.created_at).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}