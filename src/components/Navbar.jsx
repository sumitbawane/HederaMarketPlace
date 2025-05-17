// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';

export default function Navbar() {
  const { isAdmin, isSeller, isOwner, loading } = useUserRole();
  const navigate = useNavigate();
  
  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/HomePage" className="text-xl font-bold">DappMarket</Link>
          </div>
          
          {!loading && (
            <div className="flex items-center space-x-4">
              <Link to="/HomePage" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition">
                Home
              </Link>
              
              {isSeller && (
                <Link to="/listProducts" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition">
                  List Products
                </Link>
              )}
              
              {isAdmin && (
                <Link to="/admin" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition">
                  Admin
                </Link>
              )}
              
              {isOwner && (
                <Link to="/owner" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition">
                  Owner
                </Link>
              )}
              <Link to="/transactions" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-500 transition">
                Transactions
                </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}