import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Users,
} from "lucide-react";

import { useState } from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import { useProfile } from "../../context/useProfile";
import { events } from "../../data/events";

export default function EventDetails() {
  const { id } = useParams();

  const { profile } = useProfile();

  const [isRegistered, setIsRegistered] =
    useState(false);

  const event = events.find(
    (item) => item.id === id
  );

  /*
   * الفعالية غير موجودة
   */

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

  /*
   * التحقق من أن الفعالية متاحة للطالب
   */

  const target = event.target;

  const isAvailableForStudent =
    !target ||
    (
      (!target.faculty ||
        target.faculty === profile.faculty) &&
      (!target.program ||
        target.program === profile.program) &&
      (!target.academicYear ||
        target.academicYear ===
          profile.academicYear)
    );

  /*
   * إذا كانت الفعالية مخصصة لطالب آخر
   */

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

  return (
    <main
      className="page-shell event-details-page"
      dir="rtl"
    >

      {/* =====================================================
          BACK
      ===================================================== */}

      <Link
        to="/events"
        className="back-link"
      >
        <ArrowRight size={17} />
        العودة إلى الفعاليات
      </Link>

      {/* =====================================================
          EVENT CARD
      ===================================================== */}

      <section className="event-details-card">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="event-details__header">

          <div className="event-details__icon">
            <CalendarDays size={27} />
          </div>

          <div className="event-details__badges">

            <span className="event-category">
              {event.category}
            </span>

            {event.target && (
              <span className="event-personal-badge">
                مقترحة لك
              </span>
            )}

          </div>

        </div>

        {/* ===================================================
            MAIN CONTENT
        =================================================== */}

        <div className="event-details__content">

          <span className="event-details__eyebrow">
            {event.target
              ? "فعالية مقترحة لك"
              : "فعالية طلابية"}
          </span>

          <h1>
            {event.title}
          </h1>

          <p className="event-details__description">
            {event.description}
          </p>

        </div>

        {/* ===================================================
            PERSONALIZED INFO
        =================================================== */}

        {event.target && (
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

        {/* ===================================================
            EVENT INFORMATION
        =================================================== */}

        <div className="event-details__info">

          <div className="event-details__info-item">

            <div className="event-details__info-icon">
              <CalendarDays size={19} />
            </div>

            <div>

              <span>
                التاريخ
              </span>

              <strong>
                {event.date}
              </strong>

            </div>

          </div>

          <div className="event-details__info-item">

            <div className="event-details__info-icon">
              <Clock3 size={19} />
            </div>

            <div>

              <span>
                الوقت
              </span>

              <strong>
                {event.time}
              </strong>

            </div>

          </div>

          <div className="event-details__info-item">

            <div className="event-details__info-icon">
              <MapPin size={19} />
            </div>

            <div>

              <span>
                المكان
              </span>

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

              <span>
                المشاركون
              </span>

              <strong>
                {event.attendees} طالب
              </strong>

            </div>

          </div>

        </div>

        {/* ===================================================
            REGISTRATION
        =================================================== */}

        <div className="event-details__registration">

          <div>

            <span>
              هل تريد المشاركة؟
            </span>

            <p>
              سجّل الآن للمشاركة في هذه الفعالية الطلابية.
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
              setIsRegistered(
                (value) => !value
              )
            }
          >
            {isRegistered ? (
              <>
                <Check size={17} />
                تم التسجيل
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