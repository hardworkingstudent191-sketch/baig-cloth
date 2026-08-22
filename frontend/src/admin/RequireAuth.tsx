import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isTokenValid, clearToken } from "./api";

export default function RequireAuth({ children }: { children: ReactNode }) {
  if (!isTokenValid()) {
    clearToken(); // covers the expired case, where a stale token is still sitting in storage
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
