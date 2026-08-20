import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "./api";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
