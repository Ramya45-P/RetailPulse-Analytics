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

import Layout from "./components/Layout";

import ProtectedRoute from "./routes/ProtectedRoute";


function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* Default */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />


        {/* Public Pages */}
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


        {/* Protected Pages With Sidebar */}
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

        </Route>


      </Routes>

    </BrowserRouter>

  );
}


export default App;