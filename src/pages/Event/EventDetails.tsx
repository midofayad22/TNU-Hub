import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";

import { useEffect, useState } from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import { useProfile } from "../../context/useProfile";
import { supabase } from "../../lib/supabase";

interface EventTarget {
  faculty?: string;
  program?: string;
  academicYear?: string;
}

interface StudentEvent {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number | null;
  target: EventTarget | null;
  status: "قادمة" | "منتهية" | "مسودة";
  created_at: string;
  updated_at: string;
}

const hasTarget = (
  target: EventTarget | null
) => {
  if (!target) return false;

  return Boolean(
    target.faculty ||
      target.program ||
      target.academicYear
  );
};

const formatDate = (date: string) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(
    new Date(`${date}T00:00:00`)
  );
};

const formatTime = (time: string) => {
  if (!time) return "—";

  const [hoursString, minutesString] =
    time.split(":");

  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
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

const isUpcoming = (
  event: StudentEvent
) => {
  if (event.status === "قادمة") return true;

  if (event.status === "منتهية") return false;

  return (
    new Date(
      `${event.date}T${event.time || "00:00"}`
    ).getTime() >= Date.now()
  );
};

export default function EventDetails() {
  const { id } = useParams();

  const { profile } = useProfile();

  const [event, setEvent] =
    useState<StudentEvent | null>(null);

  const [isRegistered, setIsRegistered] =
    useState(false);

  const [registrationLoading, setRegistrationLoading] =
    useState(false);

  const [registrationError, setRegistrationError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadEvent = async () => {
    if (!id) {
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
        .select(`
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
        `)
        .eq("id", id)
        .in("status", [
          "قادمة",
          "منتهية",
        ])
        .single();

      if (fetchError) {
        if (
          fetchError.code === "PGRST116"
        ) {
          setEvent(null);
          return;
        }

        throw fetchError;
      }

      if (!data) {
        setEvent(null);
        return;
      }

      setEvent({
        id: data.id,
        title: data.title,
        category: data.category,
        description: data.description,
        date: data.date,
        time: data.time,
        location: data.location,
        capacity: data.capacity,
        target:
          data.target &&
          typeof data.target === "object"
            ? (data.target as EventTarget)
            : null,
        status:
          data.status as
            | "قادمة"
            | "منتهية"
            | "مسودة",
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
    } catch (err) {
      console.error(
        "Error loading event:",
        err
      );

      setError(
        "تعذر تحميل الفعالية. حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMyRegistration = async () => {
    if (!id) return;

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;

      if (!user) {
        setIsRegistered(false);
        return;
      }

      const {
        data,
        error: registrationError,
      } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", id)
        .eq("student_id", user.id)
        .maybeSingle();

      if (registrationError) {
        throw registrationError;
      }

      setIsRegistered(Boolean(data));
    } catch (err) {
      console.error(
        "Error loading registration:",
        err
      );
    }
  };

  useEffect(() => {
    void loadEvent();
    void loadMyRegistration();
  }, [id]);

  const toggleRegistration = async () => {
    if (!event || !id) return;

    if (!isUpcoming(event)) {
      setRegistrationError(
        "لا يمكن التسجيل في فعالية منتهية."
      );
      return;
    }

    if (registrationLoading) return;

    setRegistrationError("");
    setRegistrationLoading(true);

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;

      if (!user) {
        setRegistrationError(
          "يجب تسجيل الدخول أولًا للتسجيل في الفعالية."
        );
        return;
      }

      /*
       * إلغاء التسجيل:
       * مسموح للطالب بحذف تسجيله فقط
       * حسب RLS الموجود على event_registrations.
       */
      if (isRegistered) {
        const {
          error: deleteError,
        } = await supabase
          .from("event_registrations")
          .delete()
          .eq("event_id", event.id)
          .eq("student_id", user.id);

        if (deleteError) {
          throw deleteError;
        }

        setIsRegistered(false);
        return;
      }

      /*
       * التسجيل الجديد يتم من خلال RPC.
       *
       * الـRPC مسؤول عن:
       * - التأكد من تسجيل الدخول
       * - التأكد أن الفعالية متاحة
       * - التحقق من target
       * - التحقق من التسجيل المكرر
       * - التحقق من capacity بشكل آمن
       * - إنشاء التسجيل
       */
      const {
        error: registrationRpcError,
      } = await supabase.rpc(
        "register_for_event",
        {
          p_event_id: event.id,
        }
      );

      if (registrationRpcError) {
        const errorMessage =
          registrationRpcError.message || "";

        if (
          errorMessage.includes("EVENT_FULL")
        ) {
          setRegistrationError(
            "عذرًا، اكتملت سعة هذه الفعالية."
          );
          return;
        }

        if (
          errorMessage.includes(
            "EVENT_NOT_AVAILABLE"
          )
        ) {
          setRegistrationError(
            "هذه الفعالية لم تعد متاحة للتسجيل."
          );
          return;
        }

        if (
          errorMessage.includes(
            "UNAUTHENTICATED"
          )
        ) {
          setRegistrationError(
            "يجب تسجيل الدخول أولًا للتسجيل في الفعالية."
          );
          return;
        }

        throw registrationRpcError;
      }

      setIsRegistered(true);
    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      setRegistrationError(
        "تعذر تنفيذ التسجيل الآن. حاول مرة أخرى."
      );
    } finally {
      setRegistrationLoading(false);
    }
  };

  if (loading) {
    return (
      <main
        className="page-shell event-details-page"
        dir="rtl"
      >
        <div className="empty-state details-not-found">
          <div className="details-not-found__icon">
            <LoaderCircle
              size={30}
              className="admin-spin"
            />
          </div>

          <h1>
            جاري تحميل الفعالية
          </h1>

          <p>
            يتم الآن جلب بيانات الفعالية من المنصة.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className="page-shell event-details-page"
        dir="rtl"
      >
        <Link
          to="/events"
          className="back-link"
        >
          <ArrowRight size={17} />
          العودة إلى الفعاليات
        </Link>

        <div className="empty-state details-not-found">
          <div className="details-not-found__icon">
            <CalendarDays size={30} />
          </div>

          <h1>حدث خطأ</h1>

          <p>{error}</p>

          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              void loadEvent();
              void loadMyRegistration();
            }}
          >
            <RefreshCw size={16} />
            إعادة المحاولة
          </button>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main
        className="page-shell event-details-page"
        dir="rtl"
      >
        <div className="empty-state details-not-found">
          <div className="details-not-found__icon">
            <CalendarDays size={30} />
          </div>

          <h1>
            الفعالية غير موجودة
          </h1>

          <p>
            لم نتمكن من العثور على الفعالية التي تبحث عنها.
          </p>

          <Link
            to="/events"
            className="button button--primary"
          >
            العودة إلى الفعاليات
          </Link>
        </div>
      </main>
    );
  }

  const target = event.target;

  const isAvailableForStudent =
    !hasTarget(target) ||
    (
      (!target?.faculty ||
        target.faculty === profile.faculty) &&
      (!target?.program ||
        target.program === profile.program) &&
      (!target?.academicYear ||
        target.academicYear ===
          profile.academicYear)
    );

  if (!isAvailableForStudent) {
    return (
      <main
        className="page-shell event-details-page"
        dir="rtl"
      >
        <Link
          to="/events"
          className="back-link"
        >
          <ArrowRight size={17} />
          العودة إلى الفعاليات
        </Link>

        <div className="empty-state details-not-found">
          <div className="details-not-found__icon">
            <CalendarDays size={30} />
          </div>

          <h1>
            هذه الفعالية غير متاحة لك
          </h1>

          <p>
            هذه الفعالية مخصصة لفئة أخرى من الطلاب.
          </p>

          <Link
            to="/events"
            className="button button--primary"
          >
            عرض الفعاليات المتاحة لك
          </Link>
        </div>
      </main>
    );
  }

  const targeted = hasTarget(target);
  const upcoming = isUpcoming(event);

  return (
    <main
      className="page-shell event-details-page"
      dir="rtl"
    >
      <Link
        to="/events"
        className="back-link"
      >
        <ArrowRight size={17} />
        العودة إلى الفعاليات
      </Link>

      {registrationError && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <span>
            {registrationError}
          </span>
        </div>
      )}

      <section className="event-details-card">
        <div className="event-details__header">
          <div className="event-details__icon">
            <CalendarDays size={27} />
          </div>

          <div className="event-details__badges">
            <span className="event-category">
              {event.category}
            </span>

            {targeted && (
              <span className="event-personal-badge">
                مقترحة لك
              </span>
            )}

            {!upcoming && (
              <span className="event-status-badge">
                منتهية
              </span>
            )}
          </div>
        </div>

        <div className="event-details__content">
          <span className="event-details__eyebrow">
            {targeted
              ? "فعالية مقترحة لك"
              : "فعالية طلابية"}
          </span>

          <h1>{event.title}</h1>

          <p className="event-details__description">
            {event.description}
          </p>
        </div>

        {targeted && (
          <div className="event-details__personalized">
            <div className="event-details__personalized-icon">
              <CalendarDays size={18} />
            </div>

            <div>
              <strong>
                هذه الفعالية مقترحة لك
              </strong>

              <p>
                تم اقتراح هذه الفعالية بناءً على بياناتك
                الأكاديمية.
              </p>
            </div>
          </div>
        )}

        <div className="event-details__info">
          <div className="event-details__info-item">
            <div className="event-details__info-icon">
              <CalendarDays size={19} />
            </div>

            <div>
              <span>التاريخ</span>

              <strong>
                {formatDate(event.date)}
              </strong>
            </div>
          </div>

          <div className="event-details__info-item">
            <div className="event-details__info-icon">
              <Clock3 size={19} />
            </div>

            <div>
              <span>الوقت</span>

              <strong>
                {formatTime(event.time)}
              </strong>
            </div>
          </div>

          <div className="event-details__info-item">
            <div className="event-details__info-icon">
              <MapPin size={19} />
            </div>

            <div>
              <span>المكان</span>

              <strong>
                {event.location}
              </strong>
            </div>
          </div>

          <div className="event-details__info-item">
            <div className="event-details__info-icon">
              <Users size={19} />
            </div>

            <div>
              <span>السعة</span>

              <strong>
                {event.capacity !== null
                  ? `${event.capacity} طالب`
                  : "سعة غير محددة"}
              </strong>
            </div>
          </div>
        </div>

        <div className="event-details__registration">
          <div>
            <span>
              {upcoming
                ? isRegistered
                  ? "أنت مسجل في هذه الفعالية"
                  : "هل تريد المشاركة؟"
                : "انتهت هذه الفعالية"}
            </span>

            <p>
              {upcoming
                ? isRegistered
                  ? "يمكنك إلغاء التسجيل في أي وقت قبل انتهاء الفعالية."
                  : "سجّل الآن للمشاركة في هذه الفعالية الطلابية."
                : "لا يمكن التسجيل في فعالية انتهت بالفعل."}
            </p>
          </div>

          <button
            type="button"
            className={`event-details__register ${
              isRegistered
                ? "event-details__register--registered"
                : ""
            }`}
            onClick={() =>
              void toggleRegistration()
            }
            disabled={
              !upcoming ||
              registrationLoading
            }
            aria-busy={registrationLoading}
          >
            {registrationLoading ? (
              <>
                <LoaderCircle
                  size={17}
                  className="admin-spin"
                />
                جاري التنفيذ...
              </>
            ) : isRegistered ? (
              <>
                <Check size={17} />
                إلغاء التسجيل
              </>
            ) : (
              "التسجيل في الفعالية"
            )}
          </button>
        </div>
      </section>
    </main>
  );
}