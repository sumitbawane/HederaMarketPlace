import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Products from "./Pages/Product";
import ListProducts from "./Pages/ListProducts";
import AdminPage from "./Pages/AdminPage";
import OwnerPage from "./Pages/OwnerPage";
import HomePage from "./Pages/HomePage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import "./App.css";
export default function App() {
  return (
    <div>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/HomePage" element={<HomePage/>}/>
        <Route
          path="/listProducts"
          element={
            <ProtectedRoute requireRole="seller">
              <ListProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireRole="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner"
          element={
            <ProtectedRoute requireRole="owner">
              <OwnerPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
    </div>
  );
}

