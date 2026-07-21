import { useState } from "react";
import { loginUser } from "../services/auth";
import { useNavigate, Link } from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
} from "@mui/material";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      await loginUser(email, password);

      alert("Login Successful");

      navigate("/dashboard");
    } catch {
      alert("Invalid Email or Password");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 3,
      }}
    >
      <Paper
        elevation={10}
        sx={{
          width: "100%",
          maxWidth: 1100,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Grid container>
          {/* Left Side */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              bgcolor: "#1565c0",
              color: "white",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              p: 6,
            }}
          >
            <Avatar
              sx={{
                width: 90,
                height: 90,
                bgcolor: "white",
                color: "#1565c0",
                mb: 3,
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: 50 }} />
            </Avatar>

            <Typography
              variant="h3"
              fontWeight="bold"
              gutterBottom
            >
              RetailPulse
            </Typography>

            <Typography
              variant="h6"
              align="center"
            >
              Retail Analytics Platform
            </Typography>

            <Typography
              sx={{
                mt: 5,
                textAlign: "center",
                opacity: 0.9,
              }}
            >
              ✔ Sales Analytics
              <br />
              ✔ Inventory Management
              <br />
              ✔ Product Tracking
              <br />
              ✔ Business Reports
            </Typography>
          </Grid>

          {/* Right Side */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              p: 6,
            }}
          >
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
            >
              Welcome Back 👋
            </Typography>

            <Typography
              color="text.secondary"
              mb={4}
            >
              Login to continue
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit}
            >
              <TextField
                fullWidth
                label="Email Address"
                margin="normal"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

              <TextField
                fullWidth
                type="password"
                label="Password"
                margin="normal"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                sx={{
                  mt: 3,
                  py: 1.5,
                  fontSize: 16,
                  borderRadius: 2,
                  fontWeight: "bold",
                }}
              >
                Login
              </Button>

              <Typography
                align="center"
                mt={4}
              >
                Don't have an account?{" "}
                <Link to="/register">
                  Register
                </Link>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default Login;