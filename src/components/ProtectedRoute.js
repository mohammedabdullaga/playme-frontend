import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const key = localStorage.getItem("admin_key");
  return key ? children : <Navigate to="/" />;
}
