import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  MapPin,
  Search,
  Users,
  X,
} from "lucide-react";

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useProfile } from "../../context/useProfile";
import { events } from "../../data/events";

const categories = [
  "الكل",
  "ورشة عمل",
  "مسابقة",
  "اجتماعي",
  "أكاديمي",
];

const eventTypes = [
  "الكل",
  "مقترحة لك",
  "القادمة",
  "السابقة",
];

export default function Events() {
  const { profile } = useProfile();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState("الكل");

  const [activeType, setActiveType] =
    useState("الكل");

  const [registeredEvents, setRegisteredEvents] =
    useState<string[]>([]);

  /*
   * هل الفعالية مناسبة للطالب الحالي؟
   */
  const matchesStudent = (
    event: (typeof events)[number]
  ) => {
    const target = event.target;

    /*
     * عدم وجود target = فعالية عامة
     */
    if (!target) {
      return true;
    }

    /*
     * مطابقة الكلية
     */
    if (
      target.faculty &&
      target.faculty !== profile.faculty
    ) {
      return false;
    }

    /*
     * مطابقة البرنامج
     */
    if (
      target.program &&
      target.program !== profile.program
    ) {
      return false;
    }

    /*
     * مطابقة السنة الدراسية
     */
    if (
      target.academicYear &&
      target.academicYear !== profile.academicYear
    ) {
      return false;
    }

    return true;
  };

  /*
   * هل الفعالية مخصصة فعلًا للطالب؟
   */
  const isPersonalizedEvent = (
    event: (typeof events)[number]
  ) => {
    return Boolean(event.target);
  };

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      /*
       * أولًا:
       * نتأكد أن الفعالية متاحة لهذا الطالب.
       */
      const matchesTarget =
        matchesStudent(event);

      /*
       * التصنيف
       */
      const matchesCategory =
        activeCategory === "الكل" ||
        event.category === activeCategory;

      /*
       * البحث
       */
      const searchableText = [
        event.title,
        event.description,
        event.category,
        event.location,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchableText.includes(query);

      /*
       * البيانات الحالية كلها فعاليات قادمة.
       *
       * لاحقًا عندما نضيف تاريخًا حقيقيًا للبيانات،
       * سنستبدل هذا المنطق بمقارنة التاريخ الحالي.
       */
      const isUpcoming = true;

      /*
       * نوع الفعالية
       */
      const matchesType =
        activeType === "الكل" ||
        (
          activeType === "مقترحة لك" &&
          isPersonalizedEvent(event)
        ) ||
        (
          activeType === "القادمة" &&
          isUpcoming
        ) ||
        (
          activeType === "السابقة" &&
          !isUpcoming
        );

      return (
        matchesTarget &&
        matchesCategory &&
        matchesSearch &&
        matchesType
      );
    });
  }, [
    search,
    activeCategory,
    activeType,
    profile.faculty,
    profile.program,
    profile.academicYear,
  ]);

  /*
   * الفعاليات المخصصة المتاحة للطالب
   */
  const personalizedEvents =
    filteredEvents.filter((event) =>
      Boolean(event.target)
    );

  const featuredEvent =
    filteredEvents.find(
      (event) => event.featured
    ) ?? null;

  const regularEvents =
    filteredEvents.filter(
      (event) =>
        event.id !== featuredEvent?.id
    );

  const toggleRegistration = (
    eventId: string
  ) => {
    setRegisteredEvents((current) =>
      current.includes(eventId)
        ? current.filter(
            (id) => id !== eventId
          )
        : [...current, eventId]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setActiveCategory("الكل");
    setActiveType("الكل");
  };

  return (
    <main
      className="page-shell events-page"
      dir="rtl"
    >
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="page-hero events-hero">

        <div>

          <span className="page-kicker">
            شارك معنا
          </span>

          <h1>
            الفعاليات
          </h1>

          <p>
            اكتشف الفعاليات والورش والمسابقات والأنشطة،
            وشارك في الحياة الطلابية بالطريقة التي تناسبك.
          </p>

          {profile.name.trim() && (
            <p className="events-personal-note">
              نعرض لك أيضًا فعاليات مناسبة لكليتك
              وبرنامجك الدراسي.
            </p>
          )}

        </div>

        <div className="page-hero__icon">
          <CalendarDays size={30} />
        </div>

      </section>

      {/* =====================================================
          PERSONALIZED NOTICE
      ===================================================== */}

      {personalizedEvents.length > 0 &&
        profile.faculty && (
          <section className="events-personalized">

            <div className="events-personalized__icon">
              <CalendarDays size={19} />
            </div>

            <div>
              <strong>
                فعاليات مقترحة لك
              </strong>

              <p>
                توجد فعاليات مرتبطة بكليتك أو برنامجك
                أو سنتك الدراسية.
              </p>
            </div>

          </section>
        )}

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <section className="events-toolbar">

        <div className="events-search">

          <Search size={19} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="ابحث عن فعالية، ورشة، مسابقة..."
            aria-label="البحث في الفعاليات"
          />

          {search && (
            <button
              type="button"
              className="events-search__clear"
              onClick={() => setSearch("")}
              aria-label="مسح البحث"
            >
              <X size={16} />
            </button>
          )}

        </div>

        <div className="events-count">

          <strong>
            {filteredEvents.length}
          </strong>

          <span>
            فعالية
          </span>

        </div>

      </section>

      {/* =====================================================
          TYPE FILTER
      ===================================================== */}

      <section className="events-type-tabs">

        {eventTypes.map((type) => {

          const isActive =
            activeType === type;

          return (
            <button
              key={type}
              type="button"
              className={`events-type-tab ${
                isActive
                  ? "events-type-tab--active"
                  : ""
              }`}
              onClick={() =>
                setActiveType(type)
              }
              aria-pressed={isActive}
            >
              {type}
            </button>
          );
        })}

      </section>

      {/* =====================================================
          CATEGORY FILTER
      ===================================================== */}

      <section className="events-filters">

        <span className="events-filters__label">
          نوع الفعالية
        </span>

        <div className="events-filters__list">

          {categories.map((category) => {

            const isActive =
              activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                className={`events-filter ${
                  isActive
                    ? "events-filter--active"
                    : ""
                }`}
                onClick={() =>
                  setActiveCategory(category)
                }
                aria-pressed={isActive}
              >
                {category}
              </button>
            );
          })}

        </div>

      </section>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="events-content">

        <div className="section-heading section-heading--with-action">

          <div>

            <span className="section-heading__eyebrow">
              اكتشف وشارك
            </span>

            <h2>
              {activeType === "مقترحة لك"
                ? "فعاليات مقترحة لك"
                : search ||
                  activeCategory !== "الكل"
                ? "نتائج الفعاليات"
                : "الفعاليات القادمة"}
            </h2>

          </div>

        </div>

        {filteredEvents.length === 0 ? (
          <div className="events-empty">

            <div className="events-empty__icon">
              <Search size={25} />
            </div>

            <h3>
              لا توجد فعاليات مطابقة
            </h3>

            <p>
              جرّب البحث بكلمة مختلفة أو غيّر الفلاتر
              لعرض المزيد من الفعاليات.
            </p>

            <button
              type="button"
              className="button button--primary"
              onClick={clearFilters}
            >
              عرض جميع الفعاليات
            </button>

          </div>
        ) : (
          <>
            {/* =================================================
                FEATURED
            ================================================= */}

            {featuredEvent && (
              <article className="event-featured">

                <div className="event-featured__date">
                  <CalendarDays size={18} />

                  <span>
                    {featuredEvent.date}
                  </span>
                </div>

                <div className="event-featured__main">

                  <div className="event-featured__meta">

                    <span>
                      {featuredEvent.category}
                    </span>

                    {featuredEvent.target && (
                      <small>
                        مقترحة لك
                      </small>
                    )}

                    {!featuredEvent.target && (
                      <small>
                        فعالية مميزة
                      </small>
                    )}

                  </div>

                  <h2>
                    {featuredEvent.title}
                  </h2>

                  <p>
                    {featuredEvent.description}
                  </p>

                  <div className="event-featured__info">

                    <span>
                      <Clock3 size={15} />
                      {featuredEvent.time}
                    </span>

                    <span>
                      <MapPin size={15} />
                      {featuredEvent.location}
                    </span>

                    <span>
                      <Users size={15} />
                      {featuredEvent.attendees} طالب
                    </span>

                  </div>

                  <div className="event-featured__actions">

                    <Link
                      to={`/events/${featuredEvent.id}`}
                      className="event-featured__details"
                    >
                      التفاصيل
                      <ChevronLeft size={16} />
                    </Link>

                    <button
                      type="button"
                      className={`event-register ${
                        registeredEvents.includes(
                          featuredEvent.id
                        )
                          ? "event-register--registered"
                          : ""
                      }`}
                      onClick={() =>
                        toggleRegistration(
                          featuredEvent.id
                        )
                      }
                    >
                      {registeredEvents.includes(
                        featuredEvent.id
                      ) ? (
                        <>
                          <Check size={16} />
                          تم التسجيل
                        </>
                      ) : (
                        "التسجيل في الفعالية"
                      )}
                    </button>

                  </div>

                </div>

              </article>
            )}

            {/* =================================================
                EVENT GRID
            ================================================= */}

            <div className="event-grid">

              {regularEvents.map((event) => {

                const isRegistered =
                  registeredEvents.includes(
                    event.id
                  );

                return (
                  <article
                    className="event-card"
                    key={event.id}
                  >

                    <Link
                      to={`/events/${event.id}`}
                      className="event-card__main-link"
                    >

                      <div className="event-card__top">

                        <div className="event-card__date">

                          <CalendarDays size={17} />

                          <span>
                            {event.date}
                          </span>

                        </div>

                        <div className="event-card__categories">

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

                      <h2>
                        {event.title}
                      </h2>

                      <p>
                        {event.description}
                      </p>

                      <div className="event-card__info">

                        <span>
                          <Clock3 size={14} />
                          {event.time}
                        </span>

                        <span>
                          <MapPin size={14} />
                          {event.location}
                        </span>

                        <span>
                          <Users size={14} />
                          {event.attendees} طالب
                        </span>

                      </div>

                    </Link>

                    <div className="event-card__footer">

                      <Link
                        to={`/events/${event.id}`}
                        className="event-card__details"
                      >
                        التفاصيل
                        <ChevronLeft size={15} />
                      </Link>

                      <button
                        type="button"
                        className={`event-register event-register--small ${
                          isRegistered
                            ? "event-register--registered"
                            : ""
                        }`}
                        onClick={() =>
                          toggleRegistration(
                            event.id
                          )
                        }
                      >
                        {isRegistered ? (
                          <>
                            <Check size={14} />
                            مسجل
                          </>
                        ) : (
                          "سجل الآن"
                        )}
                      </button>

                    </div>

                  </article>
                );
              })}

            </div>
          </>
        )}

      </section>

    </main>
  );
}