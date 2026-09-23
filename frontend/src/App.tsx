import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import CompanyRegister from "./pages/CompanyRegister";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import InventoryForecast from "./pages/InventoryForecast";

import Layout from "./components/Layout";
import ProtectedRoute from "./routes/ProtectedRoute";

import Reports from "./pages/Reports";
import Customers from "./pages/Customers";
import Forecast from "./pages/Forecast";
import SalesAnalytics from "./pages/SalesAnalytics";
import DataImport from "./pages/DataImport";
import AuditLogs from "./pages/AuditLogs";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/company-register"
          element={<CompanyRegister />}
        />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/categories"
            element={<Categories />}
          />

          <Route
            path="/sales"
            element={<Sales />}
          />

          <Route
            path="/inventory"
            element={<Inventory />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/analytics"
            element={<SalesAnalytics />}
          />

          <Route
            path="/customers"
            element={<Customers />}
          />

          <Route
            path="/forecast"
            element={<Forecast />}
          />

          <Route
            path="/analytics/sales"
            element={<SalesAnalytics />}
          />

          <Route
            path="/inventory/forecast"
            element={<InventoryForecast />}
          />

          <Route
            path="/data-import"
            element={<DataImport />}
          />

          <Route
            path="/audit-logs"
            element={<AuditLogs />}
          />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;