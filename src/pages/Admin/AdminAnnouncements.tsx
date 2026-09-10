import {
  CalendarDays,
  Edit3,
  Megaphone,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

interface AnnouncementTarget {
  faculty?: string;
  program?: string;
  academicYear?: string;
  type?: "all" | "faculty" | "year";
  value?: string;
}

interface AdminAnnouncement {
  id: string;
  title: string;
  category: string;
  content: string;
  date: string;
  target: AnnouncementTarget;
  status: "منشور" | "مسودة";
  created_at: string;
  updated_at: string;
}

const formatDate = (date: string) => {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

const getTargetLabel = (target: AnnouncementTarget) => {
  if (!target || Object.keys(target).length === 0) {
    return "جميع الطلاب";
  }

  if (target.type === "faculty" && target.value) {
    return target.value;
  }

  if (target.type === "year" && target.value) {
    return target.value;
  }

  const parts: string[] = [];

  if (target.faculty) {
    parts.push(target.faculty);
  }

  if (target.program) {
    parts.push(target.program);
  }

  if (target.academicYear) {
    parts.push(target.academicYear);
  }

  return parts.length > 0 ? parts.join(" • ") : "جميع الطلاب";
};

export default function AdminAnnouncements() {
  const { profile } = useAuth();

  const [search, setSearch] = useState("");
  const [announcements, setAnnouncements] = useState<
    AdminAnnouncement[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");

  const isRootAdmin = profile?.role === "root_admin";

  const [canView, setCanView] = useState(false);
  const [canAdd, setCanAdd] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  const loadPermissions = useCallback(async () => {
    if (!profile?.id) {
      return;
    }

    if (isRootAdmin) {
      setCanView(true);
      setCanAdd(true);
      setCanEdit(true);
      setCanDelete(true);
      return;
    }

    const { data, error: permissionError } = await supabase
      .from("admin_permissions")
      .select(
        "can_view, can_add, can_edit, can_delete"
      )
      .eq("admin_id", profile.id)
      .eq("section", "announcements")
      .maybeSingle();

    if (permissionError) {
      console.error(
        "Failed to load announcement permissions:",
        permissionError
      );

      setCanView(false);
      setCanAdd(false);
      setCanEdit(false);
      setCanDelete(false);

      return;
    }

    setCanView(Boolean(data?.can_view));
    setCanAdd(Boolean(data?.can_add));
    setCanEdit(Boolean(data?.can_edit));
    setCanDelete(Boolean(data?.can_delete));
  }, [profile?.id, isRootAdmin]);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("announcements")
      .select(
        `
          id,
          title,
          category,
          content,
          date,
          target,
          status,
          created_at,
          updated_at
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (fetchError) {
      console.error(
        "Failed to load announcements:",
        fetchError
      );

      setError(
        "حدث خطأ أثناء تحميل الإعلانات. حاول مرة أخرى."
      );

      setAnnouncements([]);
      setLoading(false);
      return;
    }

    setAnnouncements(
      (data ?? []) as AdminAnnouncement[]
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return announcements;
    }

    return announcements.filter((announcement) => {
      const targetLabel = getTargetLabel(
        announcement.target
      );

      return [
        announcement.title,
        announcement.category,
        announcement.content,
        targetLabel,
        announcement.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [announcements, search]);

  const createDeleteRequest = async (
    announcement: AdminAnnouncement
  ) => {
    if (!profile?.id) {
      setError(
        "تعذر تحديد حساب المشرف الحالي."
      );
      return;
    }

    const { error: requestError } = await supabase
      .from("admin_action_requests")
      .insert({
        admin_id: profile.id,
        section: "announcements",
        action: "delete",
        target_id: announcement.id,
        payload: {
          id: announcement.id,
          title: announcement.title,
          category: announcement.category,
          content: announcement.content,
          date: announcement.date,
          target: announcement.target,
          status: announcement.status,
        },
        reason: `طلب حذف الإعلان: ${announcement.title}`,
        status: "pending",
      });

    if (requestError) {
      console.error(
        "Failed to create announcement delete request:",
        requestError
      );

      setError(
        "تعذر إرسال طلب حذف الإعلان. حاول مرة أخرى."
      );

      return;
    }

    window.alert(
      "تم إرسال طلب حذف الإعلان إلى Root Admin للمراجعة."
    );
  };

  const handleDelete = async (id: string) => {
    const announcement = announcements.find(
      (item) => item.id === id
    );

    if (!announcement) {
      return;
    }

    const confirmed = window.confirm(
      "هل أنت متأكد من طلب حذف هذا الإعلان؟\n\nسيتم إرسال الطلب إلى Root Admin للموافقة."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");

    if (!isRootAdmin) {
      await createDeleteRequest(announcement);
      setDeletingId(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(
        "Failed to delete announcement:",
        deleteError
      );

      setError(
        "تعذر حذف الإعلان. حاول مرة أخرى."
      );

      setDeletingId(null);
      return;
    }

    setAnnouncements((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );

    setDeletingId(null);
  };

  if (!profile) {
    return null;
  }

  if (!canView && !isRootAdmin) {
    return (
      <div className="admin-page" dir="rtl">
        <section className="admin-panel admin-panel--empty">
          <div className="admin-empty-state">
            <div className="admin-empty-state__icon">
              <ShieldCheck size={25} />
            </div>

            <h3>الوصول غير متاح</h3>

            <p>
              لا تملك صلاحية الوصول إلى قسم الإعلانات.
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

  return (
    <div className="admin-page" dir="rtl">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="admin-page__header">
        <div>
          <span className="admin-page__kicker">
            إدارة المحتوى
          </span>

          <h1>الإعلانات</h1>

          <p>
            إدارة إعلانات المنصة وإضافة الإعلانات الجديدة أو
            تعديلها.
          </p>
        </div>

        <div className="admin-page__header-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={loadAnnouncements}
            disabled={loading}
            title="تحديث الإعلانات"
          >
            <RefreshCw
              size={17}
              className={loading ? "is-spinning" : ""}
            />

            <span>تحديث</span>
          </button>

          {canAdd && (
            <Link
              to="/admin/announcements/new"
              className="admin-primary-button"
            >
              <Plus size={18} />

              <span>
                {isRootAdmin
                  ? "إضافة إعلان"
                  : "طلب إضافة إعلان"}
              </span>
            </Link>
          )}
        </div>
      </header>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <span>{error}</span>

          <button
            type="button"
            className="admin-alert__retry"
            onClick={loadAnnouncements}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <span className="admin-panel__kicker">
              جميع الإعلانات
            </span>

            <h2>
              {loading
                ? "جارٍ التحميل..."
                : `${filteredAnnouncements.length} إعلان`}
            </h2>
          </div>

          <div className="admin-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="ابحث عن إعلان..."
              aria-label="البحث عن إعلان"
            />
          </div>
        </div>

        {/* ===================================================
            LOADING
        ==================================================== */}

        {loading ? (
          <div className="admin-empty-state">
            <div className="admin-empty-state__icon">
              <RefreshCw
                size={25}
                className="is-spinning"
              />
            </div>

            <h3>جارٍ تحميل الإعلانات</h3>

            <p>
              يتم جلب أحدث البيانات من قاعدة البيانات.
            </p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          /* =================================================
             EMPTY
          ================================================== */

          <div className="admin-empty-state">
            <div className="admin-empty-state__icon">
              <Megaphone size={25} />
            </div>

            <h3>
              {search
                ? "لا توجد نتائج"
                : "لا توجد إعلانات حتى الآن"}
            </h3>

            <p>
              {search
                ? "لم يتم العثور على إعلانات تطابق البحث الحالي."
                : "ابدأ بإضافة أول إعلان إلى المنصة."}
            </p>

            {search ? (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setSearch("")}
              >
                إظهار جميع الإعلانات
              </button>
            ) : canAdd ? (
              <Link
                to="/admin/announcements/new"
                className="admin-primary-button"
              >
                <Plus size={17} />

                <span>
                  {isRootAdmin
                    ? "إضافة أول إعلان"
                    : "طلب إضافة أول إعلان"}
                </span>
              </Link>
            ) : null}
          </div>
        ) : (
          /* =================================================
             LIST
          ================================================== */

          <div className="admin-list">
            {filteredAnnouncements.map(
              (announcement) => {
                const targetLabel =
                  getTargetLabel(
                    announcement.target
                  );

                const isDeleting =
                  deletingId === announcement.id;

                return (
                  <article
                    key={announcement.id}
                    className="admin-card admin-announcement-card"
                  >
                    <div className="admin-card__header">
                      <div className="admin-card__identity">
                        <div className="admin-card__avatar">
                          <Megaphone size={19} />
                        </div>

                        <div>
                          <h3>
                            {announcement.title}
                          </h3>

                          <div className="admin-announcement-card__meta">
                            <span>
                              {announcement.category}
                            </span>

                            <span>
                              {targetLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={
                          announcement.status ===
                          "منشور"
                            ? "admin-status admin-status--completed"
                            : "admin-status"
                        }
                      >
                        {announcement.status}
                      </span>
                    </div>

                    <div className="admin-announcement-card__footer">
                      <div className="admin-announcement-card__date">
                        <CalendarDays size={15} />

                        <span>
                          {formatDate(
                            announcement.created_at
                          )}
                        </span>
                      </div>

                      <div className="admin-announcement-card__actions">
                        {canEdit && (
                          <Link
                            to={`/admin/announcements/${announcement.id}/edit`}
                            className="admin-card-action admin-card-action--edit"
                            aria-label={`تعديل ${announcement.title}`}
                          >
                            <Edit3 size={16} />

                            <span>
                              {isRootAdmin
                                ? "تعديل"
                                : "طلب تعديل"}
                            </span>
                          </Link>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            className="admin-card-action admin-card-action--delete"
                            onClick={() =>
                              handleDelete(
                                announcement.id
                              )
                            }
                            disabled={isDeleting}
                            aria-label={`حذف ${announcement.title}`}
                          >
                            {isDeleting ? (
                              <RefreshCw
                                size={16}
                                className="is-spinning"
                              />
                            ) : (
                              <Trash2 size={16} />
                            )}

                            <span>
                              {isDeleting
                                ? "جارٍ الإرسال..."
                                : isRootAdmin
                                ? "حذف"
                                : "طلب حذف"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}