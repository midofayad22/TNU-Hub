import {
  CalendarDays,
  Clock3,
  Edit3,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

interface EventTarget {
  faculty?: string;
  program?: string;
  academicYear?: string;
}

interface AdminEvent {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number | null;
  target: EventTarget;
  status: "قادمة" | "منتهية" | "مسودة";
  created_at: string;
  updated_at: string;
}

interface AdminPermission {
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (date: string) => {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
};

const formatTime = (time: string) => {
  if (!time) {
    return "—";
  }

  const [hours, minutes] = time
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return time;
  }

  const date = new Date();

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return new Intl.DateTimeFormat("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const getTargetLabel = (
  target: EventTarget | null | undefined
) => {
  if (
    !target ||
    Object.keys(target).length === 0
  ) {
    return "جميع الطلاب";
  }

  if (target.faculty) {
    return target.faculty;
  }

  if (target.program) {
    return target.program;
  }

  if (target.academicYear) {
    return target.academicYear;
  }

  return "جميع الطلاب";
};

const getStatusClass = (
  status: AdminEvent["status"]
) => {
  if (status === "قادمة") {
    return "admin-status admin-status--completed";
  }

  if (status === "منتهية") {
    return "admin-status admin-status--danger";
  }

  return "admin-status";
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminEvents() {
  const { profile } = useAuth();

  const isRootAdmin =
    profile?.role === "root_admin";

  const [search, setSearch] =
    useState("");

  const [events, setEvents] =
    useState<AdminEvent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingPermissions, setLoadingPermissions] =
    useState(true);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  /* =======================================================
     PERMISSIONS
  ======================================================= */

  const [canView, setCanView] =
    useState(false);

  const [canAdd, setCanAdd] =
    useState(false);

  const [canEdit, setCanEdit] =
    useState(false);

  const [canDelete, setCanDelete] =
    useState(false);

  /* =======================================================
     LOAD PERMISSIONS
  ======================================================= */

  const loadPermissions = useCallback(
    async () => {
      if (!profile?.id) {
        setCanView(false);
        setCanAdd(false);
        setCanEdit(false);
        setCanDelete(false);
        setLoadingPermissions(false);

        return;
      }

      if (isRootAdmin) {
        setCanView(true);
        setCanAdd(true);
        setCanEdit(true);
        setCanDelete(true);
        setLoadingPermissions(false);

        return;
      }

      setLoadingPermissions(true);

      try {
        const {
          data,
          error: permissionError,
        } = await supabase
          .from("admin_permissions")
          .select(
            "can_view, can_add, can_edit, can_delete"
          )
          .eq(
            "admin_id",
            profile.id
          )
          .eq(
            "section",
            "events"
          )
          .maybeSingle();

        if (permissionError) {
          throw permissionError;
        }

        const permissions =
          data as AdminPermission | null;

        setCanView(
          Boolean(permissions?.can_view)
        );

        setCanAdd(
          Boolean(permissions?.can_add)
        );

        setCanEdit(
          Boolean(permissions?.can_edit)
        );

        setCanDelete(
          Boolean(permissions?.can_delete)
        );
      } catch (err) {
        console.error(
          "Failed to load event permissions:",
          err
        );

        setCanView(false);
        setCanAdd(false);
        setCanEdit(false);
        setCanDelete(false);
      } finally {
        setLoadingPermissions(false);
      }
    },
    [profile?.id, isRootAdmin]
  );

  /* =======================================================
     LOAD EVENTS
  ======================================================= */

  const loadEvents = useCallback(
    async () => {
      /*
       * Do not query the table before permissions
       * are resolved.
       */

      if (
        !isRootAdmin &&
        !canView
      ) {
        setEvents([]);
        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        const {
          data,
          error: fetchError,
        } = await supabase
          .from("events")
          .select(
            `
              id,
              title,
              category,
              description,
              date,
              time,
              location,
              capacity,
              target,
              status,
              created_at,
              updated_at
            `
          )
          .order("date", {
            ascending: true,
          })
          .order("time", {
            ascending: true,
          });

        if (fetchError) {
          throw fetchError;
        }

        setEvents(
          (data ?? []).map(
            (event) => ({
              ...event,
              target:
                event.target &&
                typeof event.target ===
                  "object"
                  ? (event.target as EventTarget)
                  : {},
            })
          ) as AdminEvent[]
        );
      } catch (err) {
        console.error(
          "Error loading events:",
          err
        );

        setError(
          "حدث خطأ أثناء تحميل الفعاليات. حاول مرة أخرى."
        );
      } finally {
        setLoading(false);
      }
    },
    [isRootAdmin, canView]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  useEffect(() => {
    if (loadingPermissions) {
      return;
    }

    void loadEvents();
  }, [
    loadingPermissions,
    loadEvents,
  ]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredEvents = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) {
      return events;
    }

    return events.filter(
      (event) =>
        [
          event.title,
          event.category,
          event.description,
          event.location,
          event.status,
          getTargetLabel(event.target),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
    );
  }, [events, search]);

  /* =======================================================
     CREATE DELETE REQUEST
  ======================================================= */

  const createDeleteRequest = async (
    event: AdminEvent
  ) => {
    if (!profile?.id) {
      setError(
        "تعذر تحديد حساب المشرف الحالي."
      );

      return;
    }

    const {
      error: requestError,
    } = await supabase
      .from("admin_action_requests")
      .insert({
        admin_id: profile.id,
        section: "events",
        action: "delete",
        target_id: event.id,
        payload: {
          id: event.id,
          title: event.title,
          category: event.category,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          capacity: event.capacity,
          target: event.target,
          status: event.status,
        },
        reason: `طلب حذف الفعالية: ${event.title}`,
        status: "pending",
      });

    if (requestError) {
      console.error(
        "Failed to create event delete request:",
        requestError
      );

      setError(
        "تعذر إرسال طلب حذف الفعالية. حاول مرة أخرى."
      );

      return false;
    }

    /*
     * =====================================================
     * إشعار Root Admin
     * =====================================================
     *
     * تم إنشاء طلب الحذف بنجاح.
     * الآن نرسل إشعارًا لكل Root Admin.
     *
     * فشل الإشعار لا يلغي الطلب.
     */
    const {
      data: rootAdmins,
      error: rootAdminsError,
    } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "root_admin");

    if (rootAdminsError) {
      console.error(
        "Failed to load root admins for event delete notification:",
        rootAdminsError
      );
    } else if (
      rootAdmins &&
      rootAdmins.length > 0
    ) {
      const notifications =
        rootAdmins.map((rootAdmin) => ({
          user_id: rootAdmin.id,
          title: "طلب موافقة جديد",
          message: `قام أحد المشرفين بإرسال طلب حذف في قسم الفعاليات للفعالية "${event.title}" للمراجعة.`,
          type: "approval",
          is_read: false,
        }));

      const {
        error: notificationsError,
      } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationsError) {
        console.error(
          "Failed to notify root admins about event delete request:",
          notificationsError
        );
      }
    }

    window.alert(
      "تم إرسال طلب حذف الفعالية إلى Root Admin للمراجعة."
    );

    return true;
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete = async (
    id: string
  ) => {
    const event = events.find(
      (item) => item.id === id
    );

    if (!event) {
      return;
    }

    const confirmed =
      window.confirm(
        isRootAdmin
          ? "هل أنت متأكد من حذف هذه الفعالية؟\n\nلا يمكن التراجع عن هذه العملية."
          : "هل أنت متأكد من طلب حذف هذه الفعالية؟\n\nسيتم إرسال الطلب إلى Root Admin للموافقة."
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      /*
       * Sub Admin:
       * create approval request only.
       */

      if (!isRootAdmin) {
        await createDeleteRequest(event);

        setDeletingId(null);

        return;
      }

      /*
       * Root Admin:
       * delete directly.
       */

      const {
        error: deleteError,
      } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setEvents(
        (current) =>
          current.filter(
            (item) =>
              item.id !== id
          )
      );
    } catch (err) {
      console.error(
        "Error deleting event:",
        err
      );

      setError(
        isRootAdmin
          ? "تعذر حذف الفعالية. حاول مرة أخرى."
          : "تعذر إرسال طلب حذف الفعالية. حاول مرة أخرى."
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =======================================================
     PROFILE LOADING
  ======================================================= */

  if (!profile) {
    return null;
  }

  /* =======================================================
     PERMISSION LOADING
  ======================================================= */

  if (loadingPermissions) {
    return (
      <div
        className="admin-page"
        dir="rtl"
      >
        <section className="admin-panel">
          <div className="admin-empty-state">
            <div className="admin-empty-state__icon">
              <RefreshCw
                size={25}
                className="admin-spin"
              />
            </div>

            <h3>
              جاري التحقق من الصلاحيات
            </h3>

            <p>
              يتم الآن التحقق من صلاحيات حسابك في قسم الفعاليات.
            </p>
          </div>
        </section>
      </div>
    );
  }

  /* =======================================================
     ACCESS DENIED
  ======================================================= */

  if (
    !isRootAdmin &&
    !canView
  ) {
    return (
      <div
        className="admin-page"
        dir="rtl"
      >
        <section className="admin-panel admin-panel--empty">
          <div className="admin-empty-state">
            <div className="admin-empty-state__icon">
              <ShieldCheck size={25} />
            </div>

            <h3>
              الوصول غير متاح
            </h3>

            <p>
              لا تملك صلاحية الوصول إلى قسم الفعاليات.
            </p>

            <Link
              to="/admin"
              className="admin-secondary-button"
            >
              العودة للوحة الإدارة
            </Link>
          </div>
        </section>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="admin-page"
      dir="rtl"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="admin-page__header">
        <div>
          <span className="admin-page__kicker">
            إدارة المحتوى
          </span>

          <h1>
            الفعاليات
          </h1>

          <p>
            إدارة فعاليات المنصة وإضافة الفعاليات الجديدة أو تعديلها.
          </p>
        </div>

        <div className="admin-page__header-actions">

          {/* Refresh */}

          <button
            type="button"
            className="admin-secondary-button"
            onClick={() =>
              void loadEvents()
            }
            disabled={loading}
            aria-label="تحديث الفعاليات"
            title="تحديث الفعاليات"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "admin-spin"
                  : ""
              }
            />

            <span>
              تحديث
            </span>
          </button>

          {/* Add */}

          {canAdd && (
            <Link
              to="/admin/events/new"
              className="admin-primary-button"
            >
              <Plus size={18} />

              <span>
                {isRootAdmin
                  ? "إضافة فعالية"
                  : "طلب إضافة فعالية"}
              </span>
            </Link>
          )}
        </div>
      </header>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <span>
            {error}
          </span>

          <button
            type="button"
            className="admin-alert__retry"
            onClick={() =>
              void loadEvents()
            }
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* =================================================
          CONTENT
      ================================================= */}

      <section className="admin-panel">

        <div className="admin-panel__header">
          <div>
            <span className="admin-panel__kicker">
              جميع الفعاليات
            </span>

            <h2>
              {loading
                ? "جاري التحميل..."
                : `${filteredEvents.length} فعالية`}
            </h2>
          </div>

          <div className="admin-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="ابحث عن فعالية..."
              aria-label="البحث عن فعالية"
            />
          </div>
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="admin-empty-state">
            <div className="admin-empty-state__icon">
              <CalendarDays size={25} />
            </div>

            <h3>
              جاري تحميل الفعاليات
            </h3>

            <p>
              يتم الآن جلب الفعاليات من قاعدة البيانات.
            </p>
          </div>

        ) : filteredEvents.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <div className="admin-empty-state">
            <div className="admin-empty-state__icon">
              <CalendarDays size={25} />
            </div>

            <h3>
              {search
                ? "لا توجد نتائج"
                : "لا توجد فعاليات"}
            </h3>

            <p>
              {search
                ? "لم يتم العثور على فعاليات تطابق البحث الحالي."
                : "لم تتم إضافة أي فعاليات حتى الآن."}
            </p>

            {search ? (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() =>
                  setSearch("")
                }
              >
                إظهار جميع الفعاليات
              </button>
            ) : canAdd ? (
              <Link
                to="/admin/events/new"
                className="admin-primary-button"
              >
                <Plus size={17} />

                <span>
                  {isRootAdmin
                    ? "إضافة أول فعالية"
                    : "طلب إضافة أول فعالية"}
                </span>
              </Link>
            ) : null}
          </div>

        ) : (

          /* =================================================
             LIST
          ================================================= */

          <div className="admin-list">

            {filteredEvents.map(
              (event) => (
                <article
                  key={event.id}
                  className="admin-card admin-event-card"
                >
                  <div className="admin-card__header">

                    <div className="admin-card__identity">

                      <div className="admin-card__avatar">
                        <CalendarDays size={19} />
                      </div>

                      <div>
                        <h3>
                          {event.title}
                        </h3>

                        <div className="admin-event-card__meta">
                          <span>
                            {event.category}
                          </span>

                          <span>
                            {getTargetLabel(
                              event.target
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={getStatusClass(
                        event.status
                      )}
                    >
                      {event.status}
                    </span>
                  </div>

                  {event.description && (
                    <p className="admin-event-card__description">
                      {event.description}
                    </p>
                  )}

                  <div className="admin-event-card__info">

                    <span>
                      <CalendarDays size={15} />

                      {formatDate(
                        event.date
                      )}
                    </span>

                    <span>
                      <Clock3 size={15} />

                      {formatTime(
                        event.time
                      )}
                    </span>

                    <span>
                      <MapPin size={15} />

                      {event.location}
                    </span>

                    <span>
                      <Users size={15} />

                      {event.capacity
                        ? `${event.capacity} مقعد`
                        : "سعة غير محددة"}
                    </span>

                  </div>

                  <div className="admin-event-card__footer">

                    <span className="admin-event-card__hint">
                      {isRootAdmin
                        ? "إدارة بيانات الفعالية"
                        : "العمليات تتطلب موافقة Root Admin"}
                    </span>

                    <div className="admin-event-card__actions">

                      {/* Edit */}

                      {canEdit && (
                        <Link
                          to={`/admin/events/${event.id}/edit`}
                          className="admin-card-action admin-card-action--edit"
                          aria-label={`تعديل ${event.title}`}
                        >
                          <Edit3 size={16} />

                          <span>
                            {isRootAdmin
                              ? "تعديل"
                              : "طلب تعديل"}
                          </span>
                        </Link>
                      )}

                      {/* Delete */}

                      {canDelete && (
                        <button
                          type="button"
                          className="admin-card-action admin-card-action--delete"
                          onClick={() =>
                            void handleDelete(
                              event.id
                            )
                          }
                          disabled={
                            deletingId ===
                            event.id
                          }
                          aria-label={`حذف ${event.title}`}
                        >
                          {deletingId ===
                          event.id ? (
                            <RefreshCw
                              size={16}
                              className="admin-spin"
                            />
                          ) : (
                            <Trash2 size={16} />
                          )}

                          <span>
                            {deletingId ===
                            event.id
                              ? isRootAdmin
                                ? "جاري الحذف..."
                                : "جاري إرسال الطلب..."
                              : isRootAdmin
                              ? "حذف"
                              : "طلب حذف"}
                          </span>
                        </button>
                      )}

                    </div>
                  </div>
                </article>
              )
            )}

          </div>
        )}
      </section>
    </div>
  );
}