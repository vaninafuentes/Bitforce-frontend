// src/routes/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuth, ready } = useAuth();
  if (!ready) return null;                 // o spinner mínimo
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
}
