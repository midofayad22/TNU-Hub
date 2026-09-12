import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Megaphone,
  Plus,
  ShieldCheck,
  Users,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Building2,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

/* =========================================================
  TYPES
========================================================= */

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

interface DashboardStats {
  students: number;
  admins: number;
  announcements: number;
  events: number;
  requests: number;
  resources: number;
  faculties: number;
}

interface DashboardCard {
  id: string;
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  href?: string;
}

/* =========================================================
  HELPERS
========================================================= */

function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-EG").format(value);
}

/* =========================================================
  COMPONENT
========================================================= */

export default function AdminDashboard() {
  const { profile } = useAuth();

  /* =======================================================
    STATE
  ======================================================= */

  const [permissions, setPermissions] = useState<
    AdminPermission[]
  >([]);

  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    admins: 0,
    announcements: 0,
    events: 0,
    requests: 0,
    resources: 0,
    faculties: 0,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const isRootAdmin =
    profile?.role === "root_admin";

  /* =======================================================
    LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = useCallback(async () => {
    if (!profile?.id) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      /* =====================================================
        PERMISSIONS
      ===================================================== */

      const permissionsPromise = isRootAdmin
        ? Promise.resolve({
            data: [],
            error: null,
          })
        : supabase
            .from("admin_permissions")
            .select(
              "id, admin_id, section, can_view, can_add, can_edit, can_delete"
            )
            .eq("admin_id", profile.id);

      /* =====================================================
        ALL DASHBOARD COUNTS
      ===================================================== */

      const [
        permissionsResult,
        studentsResult,
        adminsResult,
        announcementsResult,
        eventsResult,
        requestsResult,
        resourcesResult,
        facultiesResult,
      ] = await Promise.all([
        permissionsPromise,

        /* STUDENTS */
        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "student"),

        /* ADMINS */
        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          })
          .in("role", [
            "admin",
            "root_admin",
          ]),

        /* ANNOUNCEMENTS */
        supabase
          .from("announcements")
          .select("id", {
            count: "exact",
            head: true,
          }),

        /* EVENTS */
        supabase
          .from("events")
          .select("id", {
            count: "exact",
            head: true,
          }),

        /* REQUESTS */
        supabase
          .from("requests")
          .select("id", {
            count: "exact",
            head: true,
          }),

        /* RESOURCES */
        supabase
          .from("resources")
          .select("id", {
            count: "exact",
            head: true,
          }),

        /* FACULTIES */
        supabase
          .from("faculties")
          .select("id", {
            count: "exact",
            head: true,
          }),
      ]);

      /* =====================================================
        ERROR CHECKING
      ===================================================== */

      if (permissionsResult.error) {
        throw permissionsResult.error;
      }

      if (studentsResult.error) {
        throw studentsResult.error;
      }

      if (adminsResult.error) {
        throw adminsResult.error;
      }

      if (announcementsResult.error) {
        throw announcementsResult.error;
      }

      if (eventsResult.error) {
        throw eventsResult.error;
      }

      if (requestsResult.error) {
        throw requestsResult.error;
      }

      if (resourcesResult.error) {
        throw resourcesResult.error;
      }

      if (facultiesResult.error) {
        throw facultiesResult.error;
      }

      /* =====================================================
        SAVE PERMISSIONS
      ===================================================== */

      setPermissions(
        (permissionsResult.data ??
          []) as AdminPermission[]
      );

      /* =====================================================
        SAVE STATS
      ===================================================== */

      setStats({
        students: studentsResult.count ?? 0,
        admins: adminsResult.count ?? 0,
        announcements:
          announcementsResult.count ?? 0,
        events: eventsResult.count ?? 0,
        requests: requestsResult.count ?? 0,
        resources: resourcesResult.count ?? 0,
        faculties: facultiesResult.count ?? 0,
      });
    } catch (err) {
      console.error(
        "Admin dashboard error:",
        err
      );

      setError(
        "تعذر تحميل بيانات لوحة التحكم. حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  }, [profile?.id, isRootAdmin]);

  /* =======================================================
    INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* =======================================================
    PERMISSIONS
  ======================================================= */

  const canView = useCallback(
    (section: AdminSection) => {
      if (isRootAdmin) {
        return true;
      }

      return permissions.some(
        (permission) =>
          permission.section === section &&
          permission.can_view
      );
    },
    [isRootAdmin, permissions]
  );

  const canAdd = useCallback(
    (section: AdminSection) => {
      if (isRootAdmin) {
        return true;
      }

      return permissions.some(
        (permission) =>
          permission.section === section &&
          permission.can_add
      );
    },
    [isRootAdmin, permissions]
  );

  /* =======================================================
    DASHBOARD CARDS
  ======================================================= */

  const dashboardCards = useMemo<
    DashboardCard[]
  >(() => {
    const cards: DashboardCard[] = [];

    /* STUDENTS */

    if (canView("students")) {
      cards.push({
        id: "students",
        label: "الطلاب",
        value: loading
          ? "..."
          : formatNumber(stats.students),
        description:
          "إجمالي الطلاب المسجلين",
        icon: Users,
        href: "/admin/students",
      });
    }

    /* ADMINS */

    if (isRootAdmin) {
      cards.push({
        id: "admins",
        label: "المشرفون",
        value: loading
          ? "..."
          : formatNumber(stats.admins),
        description:
          "إجمالي المشرفين",
        icon: ShieldCheck,
        href: "/admin/admins",
      });
    }

    /* ANNOUNCEMENTS */

    if (canView("announcements")) {
      cards.push({
        id: "announcements",
        label: "الإعلانات",
        value: loading
          ? "..."
          : formatNumber(
              stats.announcements
            ),
        description:
          "إجمالي الإعلانات المنشورة",
        icon: Megaphone,
        href: "/admin/announcements",
      });
    }

    /* EVENTS */

    if (canView("events")) {
      cards.push({
        id: "events",
        label: "الفعاليات",
        value: loading
          ? "..."
          : formatNumber(stats.events),
        description:
          "إجمالي الفعاليات المضافة",
        icon: CalendarDays,
        href: "/admin/events",
      });
    }

    /* REQUESTS */

    if (canView("requests")) {
      cards.push({
        id: "requests",
        label: "الطلبات",
        value: loading
          ? "..."
          : formatNumber(stats.requests),
        description:
          "إجمالي طلبات الطلاب",
        icon: ClipboardList,
        href: "/admin/requests",
      });
    }

    /* RESOURCES */

    if (canView("resources")) {
      cards.push({
        id: "resources",
        label: "المصادر",
        value: loading
          ? "..."
          : formatNumber(stats.resources),
        description:
          "إجمالي المصادر التعليمية",
        icon: BookOpen,
        href: "/admin/resources",
      });
    }

    /* FACULTIES */

    if (canView("faculties")) {
      cards.push({
        id: "faculties",
        label: "الكليات",
        value: loading
          ? "..."
          : formatNumber(stats.faculties),
        description:
          "إجمالي الكليات المسجلة",
        icon: Building2,
        href: "/admin/faculties",
      });
    }

    return cards;
  }, [
    canView,
    isRootAdmin,
    loading,
    stats.students,
    stats.admins,
    stats.announcements,
    stats.events,
    stats.requests,
    stats.resources,
    stats.faculties,
  ]);

  /* =======================================================
    NO PROFILE
  ======================================================= */

  if (!profile) {
    return null;
  }

  /* =======================================================
    RENDER
  ======================================================= */

  return (
    <div
      className="admin-page"
      dir="rtl"
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <section className="admin-page__header">
        <div>
          <span className="admin-page__kicker">
            لوحة الإدارة
          </span>

          <h1>
            مرحبًا بك،{" "}
            {profile.full_name?.trim() ||
              "المشرف"}
          </h1>

          <p>
            تحكم في المنصة وأدر المحتوى والخدمات
            الطلابية من مكان واحد.
          </p>
        </div>

        <div className="admin-page__header-actions">
          {canAdd("announcements") && (
            <Link
              to="/admin/announcements/new"
              className="admin-primary-button"
            >
              <Plus size={18} />

              <span>
                إضافة إعلان
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={loadDashboard}
            className="admin-alert__retry"
          >
            <RefreshCw size={15} />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* ===================================================
          STATS
      =================================================== */}

      <section className="admin-stats-grid">
        {dashboardCards.map((card) => {
          const Icon = card.icon;

          const content = (
            <article
              className="admin-stat-card"
              key={card.id}
            >
              <div className="admin-stat-card__top">
                <span>
                  {card.label}
                </span>

                <div className="admin-stat-card__icon">
                  <Icon size={19} />
                </div>
              </div>

              <div className="admin-stat-card__value">
                {card.value}
              </div>

              <div className="admin-stat-card__bottom">
                <span>
                  {card.description}
                </span>
              </div>
            </article>
          );

          if (card.href) {
            return (
              <Link
                key={card.id}
                to={card.href}
                className="admin-stat-card__link"
              >
                {content}
              </Link>
            );
          }

          return content;
        })}
      </section>

      {/* ===================================================
          EMPTY PERMISSIONS STATE
      =================================================== */}

      {!isRootAdmin &&
        !loading &&
        permissions.length === 0 && (
          <section className="admin-panel admin-panel--empty">
            <div className="admin-empty-state">
              <ShieldCheck size={28} />

              <h2>
                لا توجد صلاحيات مخصصة
              </h2>

              <p>
                حسابك كمشرف لا يحتوي حاليًا على
                صلاحيات للوصول إلى أقسام الإدارة.
              </p>
            </div>
          </section>
        )}

      {/* ===================================================
          MAIN GRID
      =================================================== */}

      <section className="admin-dashboard-grid">
        <div className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <span className="admin-panel__kicker">
                الوصول
              </span>

              <h2>
                الأقسام المتاحة لك
              </h2>
            </div>

            {isRootAdmin && (
              <span className="admin-status admin-status--completed">
                جميع الصلاحيات
              </span>
            )}
          </div>

          <div className="admin-access-list">
            {[
              {
                id: "announcements" as AdminSection,
                label: "الإعلانات",
                icon: Megaphone,
                href: "/admin/announcements",
              },
              {
                id: "events" as AdminSection,
                label: "الفعاليات",
                icon: CalendarDays,
                href: "/admin/events",
              },
              {
                id: "requests" as AdminSection,
                label: "الطلبات",
                icon: ClipboardList,
                href: "/admin/requests",
              },
              {
                id: "resources" as AdminSection,
                label: "المصادر",
                icon: BookOpen,
                href: "/admin/resources",
              },
              {
                id: "faculties" as AdminSection,
                label: "الكليات والبرامج",
                icon: Building2,
                href: "/admin/faculties",
              },
              {
                id: "students" as AdminSection,
                label: "الطلاب",
                icon: Users,
                href: "/admin/students",
              },
            ].map((item) => {
              const Icon = item.icon;

              const allowed =
                canView(item.id);

              if (!allowed) {
                return (
                  <div
                    key={item.id}
                    className="admin-access-item admin-access-item--disabled"
                  >
                    <div className="admin-access-item__icon">
                      <Icon size={18} />
                    </div>

                    <span>
                      {item.label}
                    </span>

                    <small>
                      غير متاح
                    </small>
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className="admin-access-item"
                >
                  <div className="admin-access-item__icon">
                    <Icon size={18} />
                  </div>

                  <span>
                    {item.label}
                  </span>

                  <ArrowLeft size={15} />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}