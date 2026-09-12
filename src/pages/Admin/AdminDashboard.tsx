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
  ClipboardCheck,
  Clock3,
  CheckCircle2,
  XCircle,
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

interface AdminActionRequest {
  id: number;
  admin_id: string;
  section: string;
  action: "add" | "edit" | "delete";
  status: "pending" | "approved" | "rejected";
  payload: Record<string, unknown> | null;
  created_at: string;
}

/* =========================================================
   HELPERS
========================================================= */

function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-EG").format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function getSectionLabel(section: string) {
  const labels: Record<string, string> = {
    announcements: "الإعلانات",
    events: "الفعاليات",
    requests: "الطلبات",
    resources: "المصادر",
    faculties: "الكليات والبرامج",
    students: "الطلاب",
  };

  return labels[section] || section;
}

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    add: "إضافة",
    edit: "تعديل",
    delete: "حذف",
  };

  return labels[action] || action;
}

function getRequestTitle(
  request: AdminActionRequest
) {
  const payload = request.payload;

  if (!payload) {
    return "طلب إداري";
  }

  const possibleTitleKeys = [
    "title",
    "name",
    "event_title",
    "announcement_title",
    "resource_title",
  ];

  for (const key of possibleTitleKeys) {
    const value = payload[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return `${getActionLabel(
    request.action
  )} في ${getSectionLabel(
    request.section
  )}`;
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

  const [adminRequests, setAdminRequests] = useState<
    AdminActionRequest[]
  >([]);

  const [pendingAdminRequestsCount, setPendingAdminRequestsCount] =
    useState(0);

  const [loading, setLoading] = useState(true);

  const [loadingAdminRequests, setLoadingAdminRequests] =
    useState(true);

  const [error, setError] = useState("");

  const isRootAdmin =
    profile?.role === "root_admin";

  /* =======================================================
     LOAD ADMIN ACTION REQUESTS
  ======================================================= */

  const loadAdminRequests = useCallback(async () => {
    if (!profile?.id) {
      return;
    }

    setLoadingAdminRequests(true);

    try {
      let recentQuery = supabase
        .from("admin_action_requests")
        .select(
          "id, admin_id, section, action, status, payload, created_at"
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(4);

      let pendingQuery = supabase
        .from("admin_action_requests")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("status", "pending");

      if (!isRootAdmin) {
        recentQuery = recentQuery.eq(
          "admin_id",
          profile.id
        );

        pendingQuery = pendingQuery.eq(
          "admin_id",
          profile.id
        );
      }

      const [
        recentResult,
        pendingResult,
      ] = await Promise.all([
        recentQuery,
        pendingQuery,
      ]);

      if (recentResult.error) {
        throw recentResult.error;
      }

      if (pendingResult.error) {
        throw pendingResult.error;
      }

      setAdminRequests(
        (recentResult.data ?? []) as AdminActionRequest[]
      );

      setPendingAdminRequestsCount(
        pendingResult.count ?? 0
      );
    } catch (error) {
      console.error(
        "Admin action requests dashboard error:",
        error
      );

      /*
       * مهم:
       * فشل تحميل طلبات الإدارة لا يجب أن يكسر
       * باقي لوحة التحكم.
       */
      setAdminRequests([]);
      setPendingAdminRequestsCount(0);
    } finally {
      setLoadingAdminRequests(false);
    }
  }, [profile?.id, isRootAdmin]);

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

        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "student"),

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

        supabase
          .from("announcements")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("events")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("requests")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("resources")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("faculties")
          .select("id", {
            count: "exact",
            head: true,
          }),
      ]);

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

      setPermissions(
        (permissionsResult.data ??
          []) as AdminPermission[]
      );

      setStats({
        students:
          studentsResult.count ?? 0,
        admins:
          adminsResult.count ?? 0,
        announcements:
          announcementsResult.count ?? 0,
        events:
          eventsResult.count ?? 0,
        requests:
          requestsResult.count ?? 0,
        resources:
          resourcesResult.count ?? 0,
        faculties:
          facultiesResult.count ?? 0,
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

  useEffect(() => {
    loadAdminRequests();
  }, [loadAdminRequests]);

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

    if (canView("resources")) {
      cards.push({
        id: "resources",
        label: "المصادر",
        value: loading
          ? "..."
          : formatNumber(
              stats.resources
            ),
        description:
          "إجمالي المصادر التعليمية",
        icon: BookOpen,
        href: "/admin/resources",
      });
    }

    if (canView("faculties")) {
      cards.push({
        id: "faculties",
        label: "الكليات",
        value: loading
          ? "..."
          : formatNumber(
              stats.faculties
            ),
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
      {/* HEADER */}

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

      {/* ERROR */}

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

      {/* STATS */}

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
          ADMIN ACTION REQUESTS
      =================================================== */}

      <section className="admin-panel admin-action-requests-panel">
        <div className="admin-panel__header">
          <div>
            <span className="admin-panel__kicker">
              {isRootAdmin
                ? "المراجعة"
                : "المتابعة"}
            </span>

            <h2>
              {isRootAdmin
                ? "طلبات الإدارة"
                : "طلباتي الإدارية"}
            </h2>
          </div>

          <Link
            to={
              isRootAdmin
                ? "/admin/approvals"
                : "/admin/my-requests"
            }
            className="admin-panel__header-link"
          >
            عرض الكل
            <ArrowLeft size={15} />
          </Link>
        </div>

        <div className="admin-action-requests-summary">
          <div className="admin-action-requests-summary__icon">
            {isRootAdmin ? (
              <ClipboardCheck size={21} />
            ) : (
              <Clock3 size={21} />
            )}
          </div>

          <div>
            <strong>
              {formatNumber(
                pendingAdminRequestsCount
              )}
            </strong>

            <span>
              {isRootAdmin
                ? "طلبات تنتظر مراجعتك"
                : "طلبات قيد المراجعة"}
            </span>
          </div>
        </div>

        {loadingAdminRequests ? (
          <div className="admin-action-request-empty">
            جاري تحميل الطلبات...
          </div>
        ) : adminRequests.length === 0 ? (
          <div className="admin-action-request-empty">
            <CheckCircle2 size={22} />

            <span>
              {isRootAdmin
                ? "لا توجد طلبات إدارية معلقة حاليًا."
                : "لم تقم بإرسال أي طلبات إدارية بعد."}
            </span>
          </div>
        ) : (
          <div className="admin-action-request-list">
            {adminRequests.map((request) => {
              const statusClass =
                request.status === "pending"
                  ? "pending"
                  : request.status === "approved"
                    ? "approved"
                    : "rejected";

              return (
                <div
                  key={request.id}
                  className="admin-action-request-item"
                >
                  <div className="admin-action-request-item__main">
                    <strong>
                      {getRequestTitle(
                        request
                      )}
                    </strong>

                    <span>
                      {getActionLabel(
                        request.action
                      )}{" "}
                      ·{" "}
                      {getSectionLabel(
                        request.section
                      )}
                    </span>
                  </div>

                  <div className="admin-action-request-item__meta">
                    <span
                      className={`admin-action-request-item__status admin-action-request-item__status--${statusClass}`}
                    >
                      {request.status ===
                        "pending" && (
                        <Clock3 size={14} />
                      )}

                      {request.status ===
                        "approved" && (
                        <CheckCircle2
                          size={14}
                        />
                      )}

                      {request.status ===
                        "rejected" && (
                        <XCircle size={14} />
                      )}

                      {request.status ===
                        "pending"
                        ? "قيد المراجعة"
                        : request.status ===
                            "approved"
                          ? "تمت الموافقة"
                          : "تم الرفض"}
                    </span>

                    <small>
                      {formatDate(
                        request.created_at
                      )}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* EMPTY PERMISSIONS */}

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

      {/* MAIN GRID */}

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