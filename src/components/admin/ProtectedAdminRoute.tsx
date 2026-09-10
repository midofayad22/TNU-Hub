import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({
  children,
}: ProtectedAdminRouteProps) {
  const {
    user,
    profile,
    loading,
  } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <div
        className="admin-auth-loading"
        dir="rtl"
      >
        <div className="admin-auth-loading__card">
          <div className="admin-auth-loading__spinner" />

          <p>
            جاري التحقق من الحساب...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  const isAdmin =
    profile?.role === "admin" ||
    profile?.role === "root_admin";

  if (!isAdmin) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <>{children}</>;
}