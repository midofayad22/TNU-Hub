import {
  LayoutDashboard,
  Megaphone,
  CalendarDays,
  ClipboardList,
  BookOpen,
  Building2,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  ArrowRight,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

const mainItems = [
  {
    label: "لوحة التحكم",
    to: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "الإعلانات",
    to: "/admin/announcements",
    icon: Megaphone,
  },
  {
    label: "الفعاليات",
    to: "/admin/events",
    icon: CalendarDays,
  },
  {
    label: "الطلبات",
    to: "/admin/requests",
    icon: ClipboardList,
  },
  {
    label: "المصادر",
    to: "/admin/resources",
    icon: BookOpen,
  },
];

const managementItems = [
  {
    label: "الكليات والبرامج",
    to: "/admin/faculties",
    icon: Building2,
  },
  {
    label: "الطلاب",
    to: "/admin/students",
    icon: Users,
  },
  {
    label: "إدارة المشرفين",
    to: "/admin/admins",
    icon: ShieldCheck,
  },
];

export default function AdminSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="admin-sidebar" dir="rtl">
      {/* Brand */}
      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__brand-mark">
          T
        </div>

        <div className="admin-sidebar__brand-info">
          <strong>TNU Hub</strong>
          <span>لوحة الإدارة</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar__nav">
        <div className="admin-sidebar__section">
          <span className="admin-sidebar__section-title">
            الإدارة
          </span>

          {mainItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                className={({ isActive }) =>
                  `admin-sidebar__link ${
                    isActive
                      ? "admin-sidebar__link--active"
                      : ""
                  }`
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="admin-sidebar__section">
          <span className="admin-sidebar__section-title">
            الإدارة العامة
          </span>

          {managementItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `admin-sidebar__link ${
                    isActive
                      ? "admin-sidebar__link--active"
                      : ""
                  }`
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="admin-sidebar__section admin-sidebar__section--bottom">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `admin-sidebar__link ${
                isActive
                  ? "admin-sidebar__link--active"
                  : ""
              }`
            }
          >
            <Settings size={19} />
            <span>الإعدادات</span>
          </NavLink>

          <button
            type="button"
            className="admin-sidebar__link admin-sidebar__logout"
            onClick={() => {
              navigate("/");
            }}
          >
            <LogOut size={19} />
            <span>العودة للمنصة</span>
          </button>
        </div>
      </nav>

      {/* Admin identity */}
      <div className="admin-sidebar__identity">
        <div className="admin-sidebar__avatar">
          م
        </div>

        <div className="admin-sidebar__identity-info">
          <strong>المشرف الرئيسي</strong>
          <span>Root Admin</span>
        </div>

        <ArrowRight size={16} />
      </div>
    </aside>
  );
}