import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
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

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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

interface DashboardStats {
  students: number;
  admins: number;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  section?: AdminSection;
  icon: React.ComponentType<{ size?: number }>;
}

const quickActions: QuickAction[] = [
  {
    id: "announcement",
    label: "إضافة إعلان",
    description: "إنشاء إعلان جديد للطلاب",
    href: "/admin/announcements/new",
    section: "announcements",
    icon: Megaphone,
  },
  {
    id: "event",
    label: "إضافة فعالية",
    description: "إنشاء فعالية طلابية جديدة",
    href: "/admin/events/new",
    section: "events",
    icon: CalendarDays,
  },
  {
    id: "requests",
    label: "مراجعة الطلبات",
    description: "متابعة طلبات الطلاب",
    href: "/admin/requests",
    section: "requests",
    icon: ClipboardList,
  },
  {
    id: "resources",
    label: "إدارة المصادر",
    description: "إدارة المصادر والمحتوى التعليمي",
    href: "/admin/resources",
    section: "resources",
    icon: BookOpen,
  },
  {
    id: "faculties",
    label: "الكليات والبرامج",
    description: "إدارة الكليات والبرامج الأكاديمية",
    href: "/admin/faculties",
    section: "faculties",
    icon: Building2,
  },
  {
    id: "students",
    label: "إدارة الطلاب",
    description: "عرض وإدارة بيانات الطلاب",
    href: "/admin/students",
    section: "students",
    icon: Users,
  },
];

interface DashboardCard {
  id: string;
  label: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  href?: string;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ar-EG").format(value);
}

export default function AdminDashboard() {
  const { profile } = useAuth();

  const [permissions, setPermissions] = useState<
    AdminPermission[]
  >([]);

  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    admins: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isRootAdmin = profile?.role === "root_admin";

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
          .in("role", ["admin", "root_admin"]),
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

      setPermissions(
        (permissionsResult.data ?? []) as AdminPermission[]
      );

      setStats({
        students: studentsResult.count ?? 0,
        admins: adminsResult.count ?? 0,
      });
    } catch (err) {
      console.error("Admin dashboard error:", err);

      setError(
        "تعذر تحميل بيانات لوحة التحكم. حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  }, [profile?.id, isRootAdmin]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

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

  const visibleQuickActions = useMemo(() => {
    return quickActions.filter((action) => {
      if (!action.section) {
        return true;
      }

      return (
        canView(action.section) ||
        canAdd(action.section)
      );
    });
  }, [canView, canAdd]);

  const dashboardCards = useMemo<DashboardCard[]>(() => {
    const cards: DashboardCard[] = [];

    if (canView("students")) {
      cards.push({
        id: "students",
        label: "الطلاب",
        value: loading
          ? "..."
          : formatNumber(stats.students),
        description: "إجمالي الطلاب المسجلين",
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
        description: "إجمالي المشرفين",
        icon: ShieldCheck,
        href: "/admin/admins",
      });
    }

    if (canView("announcements")) {
      cards.push({
        id: "announcements",
        label: "الإعلانات",
        value: "—",
        description: "بيانات الإعلانات من قسم الإدارة",
        icon: Megaphone,
        href: "/admin/announcements",
      });
    }

    if (canView("events")) {
      cards.push({
        id: "events",
        label: "الفعاليات",
        value: "—",
        description: "بيانات الفعاليات من قسم الإدارة",
        icon: CalendarDays,
        href: "/admin/events",
      });
    }

    if (canView("requests")) {
      cards.push({
        id: "requests",
        label: "الطلبات",
        value: "—",
        description: "بيانات الطلبات من قسم الإدارة",
        icon: ClipboardList,
        href: "/admin/requests",
      });
    }

    return cards;
  }, [
    canView,
    isRootAdmin,
    loading,
    stats.admins,
    stats.students,
  ]);

  if (!profile) {
    return null;
  }

  return (
    <div className="admin-page" dir="rtl">
      {/* Header */}
      <section className="admin-page__header">
        <div>
          <span className="admin-page__kicker">
            لوحة الإدارة
          </span>

          <h1>
            مرحبًا بك،{" "}
            {profile.full_name?.trim() || "المشرف"}
          </h1>

          <p>
            تحكم في المنصة وأدر المحتوى والخدمات الطلابية
            من مكان واحد.
          </p>
        </div>

        <div className="admin-page__header-actions">
          {canAdd("announcements") && (
            <Link
              to="/admin/announcements/new"
              className="admin-primary-button"
            >
              <Plus size={18} />
              <span>إضافة إعلان</span>
            </Link>
          )}
        </div>
      </section>

      {/* Error */}
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

      {/* Stats */}
      <section className="admin-stats-grid">
        {dashboardCards.map((card) => {
          const Icon = card.icon;

          const content = (
            <article
              className="admin-stat-card"
              key={card.id}
            >
              <div className="admin-stat-card__top">
                <span>{card.label}</span>

                <div className="admin-stat-card__icon">
                  <Icon size={19} />
                </div>
              </div>

              <div className="admin-stat-card__value">
                {card.value}
              </div>

              <div className="admin-stat-card__bottom">
                <span>{card.description}</span>
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

      {/* Empty permissions state */}
      {!isRootAdmin &&
        !loading &&
        permissions.length === 0 && (
          <section className="admin-panel admin-panel--empty">
            <div className="admin-empty-state">
              <ShieldCheck size={28} />

              <h2>لا توجد صلاحيات مخصصة</h2>

              <p>
                حسابك كمشرف لا يحتوي حاليًا على صلاحيات
                للوصول إلى أقسام الإدارة.
              </p>
            </div>
          </section>
        )}

      {/* Main grid */}
      <section className="admin-dashboard-grid">
        {/* Access overview */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <span className="admin-panel__kicker">
                الوصول
              </span>

              <h2>الأقسام المتاحة لك</h2>
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
              const allowed = canView(item.id);

              if (!allowed) {
                return (
                  <div
                    key={item.id}
                    className="admin-access-item admin-access-item--disabled"
                  >
                    <div className="admin-access-item__icon">
                      <Icon size={18} />
                    </div>

                    <span>{item.label}</span>

                    <small>غير متاح</small>
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

                  <span>{item.label}</span>

                  <ArrowLeft size={15} />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <span className="admin-panel__kicker">
                إجراءات سريعة
              </span>

              <h2>ماذا تريد أن تفعل؟</h2>
            </div>
          </div>

          {visibleQuickActions.length > 0 ? (
            <div className="admin-quick-actions">
              {visibleQuickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.id}
                    to={action.href}
                    className="admin-quick-action"
                  >
                    <div className="admin-quick-action__icon">
                      <Icon size={19} />
                    </div>

                    <div>
                      <strong>{action.label}</strong>

                      <span>
                        {action.description}
                      </span>
                    </div>

                    <ArrowLeft size={17} />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty-state admin-empty-state--small">
              <CheckCircle2 size={25} />

              <p>
                لا توجد إجراءات متاحة حسب صلاحيات حسابك.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}