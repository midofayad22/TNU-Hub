import {
  CalendarDays,
  Clock3,
  Edit3,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

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

const formatDate = (date: string) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
};

const formatTime = (time: string) => {
  if (!time) return "—";

  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("ar-EG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const getTargetLabel = (target: EventTarget | null | undefined) => {
  if (!target || Object.keys(target).length === 0) {
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

export default function AdminEvents() {
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
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
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setEvents(
        (data ?? []).map((event) => ({
          ...event,
          target:
            event.target &&
            typeof event.target === "object"
              ? (event.target as EventTarget)
              : {},
        })) as AdminEvent[]
      );
    } catch (err) {
      console.error("Error loading events:", err);

      setError(
        "حدث خطأ أثناء تحميل الفعاليات. حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return events;
    }

    return events.filter((event) =>
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

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذه الفعالية؟\n\nلا يمكن التراجع عن هذه العملية."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      const { error: deleteError } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setEvents((current) =>
        current.filter((event) => event.id !== id)
      );
    } catch (err) {
      console.error("Error deleting event:", err);

      setError(
        "تعذر حذف الفعالية. تأكد من صلاحياتك ثم حاول مرة أخرى."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="admin-page" dir="rtl">
      {/* Header */}
      <header className="admin-page__header">
        <div>
          <span className="admin-page__kicker">
            إدارة المحتوى
          </span>

          <h1>الفعاليات</h1>

          <p>
            إدارة فعاليات المنصة وإضافة الفعاليات الجديدة
            أو تعديلها.
          </p>
        </div>

        <div className="admin-page__header-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => void loadEvents()}
            disabled={loading}
            aria-label="تحديث الفعاليات"
            title="تحديث الفعاليات"
          >
            <RefreshCw
              size={17}
              className={loading ? "admin-spin" : ""}
            />
            <span>تحديث</span>
          </button>

          <Link
            to="/admin/events/new"
            className="admin-primary-button"
          >
            <Plus size={18} />
            <span>إضافة فعالية</span>
          </Link>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <span>{error}</span>

          <button
            type="button"
            className="admin-alert__retry"
            onClick={() => void loadEvents()}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Content */}
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
                setSearch(event.target.value)
              }
              placeholder="ابحث عن فعالية..."
              aria-label="البحث عن فعالية"
            />
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="admin-empty-state">
            <div className="admin-empty-state__icon">
              <CalendarDays size={25} />
            </div>

            <h3>جاري تحميل الفعاليات</h3>

            <p>
              يتم الآن جلب الفعاليات من قاعدة البيانات.
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty */
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
                onClick={() => setSearch("")}
              >
                إظهار جميع الفعاليات
              </button>
            ) : (
              <Link
                to="/admin/events/new"
                className="admin-primary-button"
              >
                <Plus size={17} />
                إضافة أول فعالية
              </Link>
            )}
          </div>
        ) : (
          /* List */
          <div className="admin-list">
            {filteredEvents.map((event) => (
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
                      <h3>{event.title}</h3>

                      <div className="admin-event-card__meta">
                        <span>{event.category}</span>

                        <span>
                          {getTargetLabel(event.target)}
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
                    {formatDate(event.date)}
                  </span>

                  <span>
                    <Clock3 size={15} />
                    {formatTime(event.time)}
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
                    إدارة بيانات الفعالية
                  </span>

                  <div className="admin-event-card__actions">
                    <Link
                      to={`/admin/events/${event.id}/edit`}
                      className="admin-card-action admin-card-action--edit"
                      aria-label={`تعديل ${event.title}`}
                    >
                      <Edit3 size={16} />
                      <span>تعديل</span>
                    </Link>

                    <button
                      type="button"
                      className="admin-card-action admin-card-action--delete"
                      onClick={() =>
                        void handleDelete(event.id)
                      }
                      disabled={deletingId === event.id}
                      aria-label={`حذف ${event.title}`}
                    >
                      <Trash2 size={16} />

                      <span>
                        {deletingId === event.id
                          ? "جاري الحذف..."
                          : "حذف"}
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}