import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

type AdminSection =
  | "announcements"
  | "events"
  | "requests"
  | "resources"
  | "faculties"
  | "students";

interface AdminPermission {
  id: string;
  admin_id: string;
  section: AdminSection;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface SidebarItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ size?: number }>;
  section?: AdminSection;
}

/* =========================================================
   MAIN ITEMS
========================================================= */

const mainItems: SidebarItem[] = [
  {
    label: "لوحة التحكم",
    to: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "الإعلانات",
    to: "/admin/announcements",
    icon: Megaphone,
    section: "announcements",
  },
  {
    label: "الفعاليات",
    to: "/admin/events",
    icon: CalendarDays,
    section: "events",
  },
  {
    label: "الطلبات",
    to: "/admin/requests",
    icon: ClipboardList,
    section: "requests",
  },
  {
    label: "المصادر",
    to: "/admin/resources",
    icon: BookOpen,
    section: "resources",
  },
];

/* =========================================================
   MANAGEMENT ITEMS
========================================================= */

const managementItems: SidebarItem[] = [
  {
    label: "الكليات والبرامج",
    to: "/admin/faculties",
    icon: Building2,
    section: "faculties",
  },
  {
    label: "الطلاب",
    to: "/admin/students",
    icon: Users,
    section: "students",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminSidebar() {
  const navigate = useNavigate();

  const { profile, signOut } = useAuth();

  const [permissions, setPermissions] = useState<
    AdminPermission[]
  >([]);

  const [loadingPermissions, setLoadingPermissions] =
    useState(true);

  const [logoutLoading, setLogoutLoading] =
    useState(false);

  /* =======================================================
     ROLE
  ======================================================= */

  const isRootAdmin =
    profile?.role === "root_admin";

  /* =======================================================
     LOAD PERMISSIONS
  ======================================================= */

  const loadPermissions = useCallback(async () => {
    if (!profile?.id) {
      setPermissions([]);
      setLoadingPermissions(false);
      return;
    }

    /*
     * Root Admin does not need permissions.
     * Root Admin automatically has full access.
     */

    if (isRootAdmin) {
      setPermissions([]);
      setLoadingPermissions(false);
      return;
    }

    setLoadingPermissions(true);

    try {
      const { data, error } = await supabase
        .from("admin_permissions")
        .select(
          "id, admin_id, section, can_view, can_add, can_edit, can_delete"
        )
        .eq("admin_id", profile.id);

      if (error) {
        throw error;
      }

      setPermissions(
        (data ?? []) as AdminPermission[]
      );
    } catch (error) {
      console.error(
        "Failed to load admin permissions:",
        error
      );

      setPermissions([]);
    } finally {
      setLoadingPermissions(false);
    }
  }, [profile?.id, isRootAdmin]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  /* =======================================================
     VIEW PERMISSION
  ======================================================= */

  const canView = useCallback(
    (section?: AdminSection) => {
      /*
       * Items without a section are available
       * to every admin.
       */

      if (!section) {
        return true;
      }

      /*
       * Root Admin has full access.
       */

      if (isRootAdmin) {
        return true;
      }

      /*
       * Students are Root Admin only.
       *
       * We intentionally do not use admin_permissions
       * for the students section.
       */

      if (section === "students") {
        return false;
      }

      return permissions.some(
        (permission) =>
          permission.section === section &&
          permission.can_view === true
      );
    },
    [isRootAdmin, permissions]
  );

  /* =======================================================
     VISIBLE MAIN ITEMS
  ======================================================= */

  const visibleMainItems = useMemo(() => {
    return mainItems.filter((item) =>
      canView(item.section)
    );
  }, [canView]);

  /* =======================================================
     VISIBLE MANAGEMENT ITEMS
  ======================================================= */

  const visibleManagementItems = useMemo(() => {
    return managementItems.filter((item) =>
      canView(item.section)
    );
  }, [canView]);

  /* =======================================================
     SIGN OUT
  ======================================================= */

  const handleSignOut = async () => {
    if (logoutLoading) {
      return;
    }

    setLogoutLoading(true);

    try {
      await signOut();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Admin sign out error:",
        error
      );

      alert(
        "حدث خطأ أثناء تسجيل الخروج. حاول مرة أخرى."
      );
    } finally {
      setLogoutLoading(false);
    }
  };

  /* =======================================================
     ADMIN IDENTITY
  ======================================================= */

  const adminName =
    profile?.full_name?.trim() ||
    "المشرف";

  const adminRole =
    profile?.role === "root_admin"
      ? "Root Admin"
      : "Admin";

  const adminInitial =
    adminName.charAt(0).toUpperCase();

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <aside
      className="admin-sidebar"
      dir="rtl"
    >
      {/* =================================================
          BRAND
      ================================================= */}

      <div className="admin-sidebar__brand">
        <div className="admin-sidebar__brand-mark">
          T
        </div>

        <div className="admin-sidebar__brand-info">
          <strong>TNU Hub</strong>

          <span>
            لوحة الإدارة
          </span>
        </div>
      </div>

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="admin-sidebar__nav">

        {/* =================================================
            MAIN
        ================================================= */}

        <div className="admin-sidebar__section">
          <span className="admin-sidebar__section-title">
            الإدارة
          </span>

          {loadingPermissions ? (
            <div className="admin-sidebar__loading">
              <LoaderCircle
                size={16}
                className="admin-sidebar__spinner"
              />

              <span>
                جاري تحميل الصلاحيات...
              </span>
            </div>
          ) : (
            visibleMainItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/admin"}
                  className={({ isActive }) =>
                    [
                      "admin-sidebar__link",
                      isActive
                        ? "admin-sidebar__link--active"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                >
                  <Icon size={19} />

                  <span>
                    {item.label}
                  </span>
                </NavLink>
              );
            })
          )}
        </div>

        {/* =================================================
            MANAGEMENT
        ================================================= */}

        {visibleManagementItems.length > 0 && (
          <div className="admin-sidebar__section">
            <span className="admin-sidebar__section-title">
              الإدارة العامة
            </span>

            {visibleManagementItems.map(
              (item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        "admin-sidebar__link",
                        isActive
                          ? "admin-sidebar__link--active"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")
                    }
                  >
                    <Icon size={19} />

                    <span>
                      {item.label}
                    </span>
                  </NavLink>
                );
              }
            )}
          </div>
        )}

        {/* =================================================
            ROOT ADMIN
        ================================================= */}

        {isRootAdmin && (
          <div className="admin-sidebar__section">
            <span className="admin-sidebar__section-title">
              النظام
            </span>

            {/* إدارة المشرفين */}

            <NavLink
              to="/admin/admins"
              className={({ isActive }) =>
                [
                  "admin-sidebar__link",
                  isActive
                    ? "admin-sidebar__link--active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              <ShieldCheck size={19} />

              <span>
                إدارة المشرفين
              </span>
            </NavLink>

            {/* مركز الموافقات */}

            <NavLink
              to="/admin/approvals"
              className={({ isActive }) =>
                [
                  "admin-sidebar__link",
                  isActive
                    ? "admin-sidebar__link--active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              <ClipboardCheck size={19} />

              <span>
                مركز الموافقات
              </span>
            </NavLink>
          </div>
        )}

        {/* =================================================
            BOTTOM
        ================================================= */}

        <div className="admin-sidebar__section admin-sidebar__section--bottom">

          {/* Settings */}

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              [
                "admin-sidebar__link",
                isActive
                  ? "admin-sidebar__link--active"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
          >
            <Settings size={19} />

            <span>
              الإعدادات
            </span>
          </NavLink>

          {/* Logout */}

          <button
            type="button"
            className="admin-sidebar__link admin-sidebar__logout"
            onClick={handleSignOut}
            disabled={logoutLoading}
          >
            {logoutLoading ? (
              <LoaderCircle
                size={19}
                className="admin-sidebar__spinner"
              />
            ) : (
              <LogOut size={19} />
            )}

            <span>
              {logoutLoading
                ? "جاري تسجيل الخروج..."
                : "تسجيل الخروج"}
            </span>
          </button>

          {/* Back to Platform */}

          <button
            type="button"
            className="admin-sidebar__link admin-sidebar__back"
            onClick={() => navigate("/")}
          >
            <ArrowRight size={19} />

            <span>
              العودة للمنصة
            </span>
          </button>
        </div>
      </nav>

      {/* =================================================
          IDENTITY
      ================================================= */}

      <div className="admin-sidebar__identity">
        <div className="admin-sidebar__avatar">
          {adminInitial}
        </div>

        <div className="admin-sidebar__identity-info">
          <strong>
            {adminName}
          </strong>

          <span>
            {adminRole}
          </span>
        </div>
      </div>
    </aside>
  );
}