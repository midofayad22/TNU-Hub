import {
  Home,
  Compass,
  Building2,
  Megaphone,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  BookOpen,
  User,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navItems = [
  {
    label: "الرئيسية",
    to: "/",
    icon: Home,
  },
  {
    label: "استكشف",
    to: "/explore",
    icon: Compass,
  },
  {
    label: "الكليات والبرامج",
    to: "/faculties",
    icon: Building2,
  },
  {
    label: "الإعلانات",
    to: "/announcements",
    icon: Megaphone,
  },
  {
    label: "الفعاليات",
    to: "/events",
    icon: CalendarDays,
  },
  {
    label: "مركز المساعدة",
    to: "/help",
    icon: CircleHelp,
  },
  {
    label: "طلباتي",
    to: "/requests",
    icon: ClipboardList,
  },
  {
    label: "المصادر",
    to: "/resources",
    icon: BookOpen,
  },
];

const secondaryItems = [
  {
    label: "الملف الشخصي",
    to: "/profile",
    icon: User,
  },
  {
    label: "الإعدادات",
    to: "/settings",
    icon: Settings,
  },
];

/*
  مؤقتًا false

  بعد ما نعمل Authentication + Permissions
  هنستبدلها بمنطق حقيقي مثل:

  const { user, permissions } = useAuth();

  ومن خلالها نحدد مين يشوف لوحة الإدارة.
*/
const isAdmin = false;

export default function Sidebar() {
  return (
    <aside className="sidebar" dir="rtl">

      {/* =========================
          BRAND
          ========================= */}

      <div className="sidebar__brand">

        <span className="sidebar__brand-mark">
          T
        </span>

        <div>
          <strong>TNU Hub</strong>
          <span>اتحاد الطلاب</span>
        </div>

      </div>


      {/* =========================
          MAIN NAVIGATION
          ========================= */}

      <nav className="sidebar__nav">

        <div className="sidebar__section">

          <span className="sidebar__section-title">
            الرئيسية
          </span>

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `sidebar__link ${
                    isActive
                      ? "sidebar__link--active"
                      : ""
                  }`
                }
              >
                <Icon size={19} />

                <span>
                  {item.label}
                </span>
              </NavLink>
            );
          })}

        </div>


        {/* =========================
            ADMIN
            ========================= */}

        {isAdmin && (
          <div className="sidebar__section">

            <span className="sidebar__section-title">
              الإدارة
            </span>

            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `sidebar__link ${
                  isActive
                    ? "sidebar__link--active"
                    : ""
                }`
              }
            >
              <ShieldCheck size={19} />

              <span>
                لوحة الإدارة
              </span>
            </NavLink>

          </div>
        )}


        {/* =========================
            ACCOUNT
            ========================= */}

        <div className="sidebar__section sidebar__section--bottom">

          <span className="sidebar__section-title">
            الحساب
          </span>

          {secondaryItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar__link ${
                    isActive
                      ? "sidebar__link--active"
                      : ""
                  }`
                }
              >
                <Icon size={19} />

                <span>
                  {item.label}
                </span>
              </NavLink>
            );
          })}

        </div>

      </nav>

    </aside>
  );
}