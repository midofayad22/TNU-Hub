import {
  Bell,
  ChevronDown,
  LogIn,
  LogOut,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../context/useProfile";

export default function Header() {
  const navigate = useNavigate();

  const { user, profile: authProfile, signOut } = useAuth();
  const { profile } = useProfile();

  const studentName =
    authProfile?.full_name?.trim() || profile.name.trim() || "الطالب";

  const studentInitial = studentName.charAt(0) || "؟";

  const isAdmin =
    authProfile?.role === "admin" || authProfile?.role === "root_admin";

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="header" dir="rtl">
      <div className="header__inner">
        {/* Logo */}
        <Link to="/" className="header__logo">
          <span className="header__logo-mark" aria-label="TNU Students">
            <span className="header__logo-mark-main">TNU</span>
            <span className="header__logo-mark-sub">STUDENTS</span>
          </span>

          <span className="header__logo-text">اتحاد الطلاب</span>
        </Link>

        {/* Search */}
        <div className="header__search">
          <Search className="header__search-icon" size={19} />

          <input
            type="search"
            placeholder="ابحث في المنصة..."
            aria-label="البحث في المنصة"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                const value = event.currentTarget.value.trim();

                if (value) {
                  navigate(`/explore?search=${encodeURIComponent(value)}`);
                }
              }
            }}
          />

          <kbd>⌘ K</kbd>
        </div>

        {/* Actions */}
        <div className="header__actions">
          {!user ? (
            /* Login button */
            <button
              type="button"
              className="header__login-button"
              onClick={() => navigate("/login")}
            >
              <LogIn size={18} />
              <span>تسجيل الدخول</span>
            </button>
          ) : (
            <>
              {/* Notifications */}
              <button
                type="button"
                className="header__notification"
                aria-label="الإشعارات"
                onClick={() => navigate("/notifications")}
              >
                <Bell size={20} />

                <span className="header__notification-dot" />
              </button>

              {/* Admin button */}
              {isAdmin && (
                <button
                  type="button"
                  className="header__admin-button"
                  onClick={() => navigate("/admin")}
                >
                  <ShieldCheck size={18} />
                  <span>لوحة الإدارة</span>
                </button>
              )}

              {/* Profile */}
              <button
                type="button"
                className="header__profile"
                aria-label="فتح الملف الشخصي"
                onClick={() => navigate("/profile")}
              >
                <span className="header__avatar">{studentInitial}</span>

                <span className="header__profile-info">
                  <strong>{studentName}</strong>

                  <small>{isAdmin ? "مسؤول" : "طالب"}</small>
                </span>

                <ChevronDown className="header__profile-chevron" size={16} />
              </button>

              {/* Logout */}
              <button
                type="button"
                className="header__logout"
                aria-label="تسجيل الخروج"
                onClick={handleLogout}
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
