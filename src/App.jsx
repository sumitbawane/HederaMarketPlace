// src/App.jsx (update)
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route,useNavigate } from "react-router-dom";
import Login from "./Pages/Login";
import Products from "./Pages/Product";
import ListProducts from "./Pages/ListProducts";
import AdminPage from "./Pages/AdminPage";
import OwnerPage from "./Pages/OwnerPage";
import HomePage from "./Pages/HomePage";
import Transactions from "./Pages/TransactionPage";
import Navbar from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import "./App.css";


function AccountChangeHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.ethereum) {
      const onAccountsChanged = () => {
        navigate("/");
      }
      window.ethereum.on("accountsChanged", onAccountsChanged)
      return () => {
        window.ethereum.removeListener("accountsChanged", onAccountsChanged)
      }
    }
  }, [navigate])
}

export default function App() {
 


  return (
    <div className="min-h-screen bg-gray-50">
      <BrowserRouter>
        <AccountChangeHandler />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="transactions"
            element={
              <>
               <Navbar />
               <Transactions />
              </>
               
              
            }
          />
          <Route 
            path="/HomePage" 
            element={
              <>
                <Navbar />
                <HomePage/>
              </>
            }
          />
          <Route
            path="/listProducts"
            element={
              <ProtectedRoute requireRole="seller">
                <Navbar />
                <ListProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireRole="admin">
                <Navbar />
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner"
            element={
              <ProtectedRoute requireRole="owner">
                <Navbar />
                <OwnerPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}