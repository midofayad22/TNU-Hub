import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({
  children,
}: ProtectedAdminRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // لسه بنتأكد من حالة تسجيل الدخول
  if (loading) {
    return (
      <div className="admin-auth-loading" dir="rtl">
        <div className="admin-auth-loading__card">
          <div className="admin-auth-loading__spinner" />
          <p>جاري التحقق من الحساب...</p>
        </div>
      </div>
    );
  }

  // المستخدم غير مسجل الدخول
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // المستخدم مسجل لكن ليس Admin
  if (
    !profile ||
    (profile.role !== "admin" && profile.role !== "root_admin")
  ) {
    return <Navigate to="/" replace />;
  }

  // Admin أو Root Admin
  return <>{children}</>;
}