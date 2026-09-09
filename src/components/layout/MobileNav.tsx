import {
  Home,
  Compass,
  CircleHelp,
  CalendarDays,
  User,
  ShieldCheck,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const items = [
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
    label: "المساعدة",
    to: "/help",
    icon: CircleHelp,
  },
  {
    label: "الفعاليات",
    to: "/events",
    icon: CalendarDays,
  },
  {
    label: "حسابي",
    to: "/profile",
    icon: User,
  },
];

/*
  مؤقتًا false.
  سيتم ربطها لاحقًا بنظام الصلاحيات.
*/
const isAdmin = false;

export default function MobileNav() {
  const mobileItems = isAdmin
    ? [
        ...items.slice(0, 4),
        {
          label: "الإدارة",
          to: "/admin",
          icon: ShieldCheck,
        },
      ]
    : items;

  return (
    <nav className="mobile-nav" dir="rtl">

      {mobileItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `mobile-nav__item ${
                isActive
                  ? "mobile-nav__item--active"
                  : ""
              }`
            }
          >
            <Icon size={20} />

            <span>
              {item.label}
            </span>
          </NavLink>
        );
      })}

    </nav>
  );
}