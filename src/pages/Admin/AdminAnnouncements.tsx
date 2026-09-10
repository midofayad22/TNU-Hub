import {
  CalendarDays,
  Edit3,
  Megaphone,
  Plus,
  Search,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "../../lib/supabase";

interface AnnouncementTarget {
  faculty?: string;
  program?: string;
  academicYear?: string;
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
  const [search, setSearch] = useState("");
  const [announcements, setAnnouncements] = useState<
    AdminAnnouncement[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

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

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا الإعلان؟\n\nلا يمكن التراجع عن هذه العملية."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");

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
        "تعذر حذف الإعلان. تأكد من صلاحيات المشرف ثم حاول مرة أخرى."
      );

      setDeletingId(null);
      return;
    }

    setAnnouncements((current) =>
      current.filter(
        (announcement) => announcement.id !== id
      )
    );

    setDeletingId(null);
  };

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

          <Link
            to="/admin/announcements/new"
            className="admin-primary-button"
          >
            <Plus size={18} />

            <span>إضافة إعلان</span>
          </Link>
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
            ) : (
              <Link
                to="/admin/announcements/new"
                className="admin-primary-button"
              >
                <Plus size={17} />
                <span>إضافة أول إعلان</span>
              </Link>
            )}
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
                        <Link
                          to={`/admin/announcements/${announcement.id}/edit`}
                          className="admin-card-action admin-card-action--edit"
                          aria-label={`تعديل ${announcement.title}`}
                        >
                          <Edit3 size={16} />

                          <span>تعديل</span>
                        </Link>

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
                              ? "جارٍ الحذف..."
                              : "حذف"}
                          </span>
                        </button>
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