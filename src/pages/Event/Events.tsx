import {
  CalendarDays,
  Check,
  ChevronLeft,
  Clock3,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useProfile } from "../../context/useProfile";
import { supabase } from "../../lib/supabase";

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

const hasTarget = (target: EventTarget | null) => {
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
  }).format(new Date(`${date}T00:00:00`));
};

const formatTime = (time: string) => {
  if (!time) return "—";

  const [hoursString, minutesString] = time.split(":");

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

const isEventUpcoming = (event: StudentEvent) => {
  if (event.status === "قادمة") return true;

  if (event.status === "منتهية") return false;

  const eventDate = new Date(
    `${event.date}T${event.time || "00:00"}`
  );

  return eventDate.getTime() >= Date.now();
};

export default function Events() {
  const { profile } = useProfile();

  const [events, setEvents] = useState<StudentEvent[]>([]);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState("الكل");
  const [activeType, setActiveType] =
    useState("الكل");

  const [registeredEvents, setRegisteredEvents] =
    useState<string[]>([]);

  const [registrationLoading, setRegistrationLoading] =
    useState<string | null>(null);

  const [registrationError, setRegistrationError] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } =
        await supabase
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
          .in("status", ["قادمة", "منتهية"])
          .order("date", {
            ascending: true,
          })
          .order("time", {
            ascending: true,
          });

      if (fetchError) {
        throw fetchError;
      }

      const normalizedEvents: StudentEvent[] =
        (data ?? []).map((event) => ({
          id: event.id,
          title: event.title,
          category: event.category,
          description: event.description,
          date: event.date,
          time: event.time,
          location: event.location,
          capacity: event.capacity,
          target:
            event.target &&
            typeof event.target === "object"
              ? (event.target as EventTarget)
              : null,
          status:
            event.status as
              | "قادمة"
              | "منتهية"
              | "مسودة",
          created_at: event.created_at,
          updated_at: event.updated_at,
        }));

      setEvents(normalizedEvents);
    } catch (err) {
      console.error(
        "Error loading events:",
        err
      );

      setError(
        "تعذر تحميل الفعاليات. حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMyRegistrations = async () => {
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
        setRegisteredEvents([]);
        return;
      }

      const {
        data,
        error: registrationFetchError,
      } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("student_id", user.id);

      if (registrationFetchError) {
        throw registrationFetchError;
      }

      setRegisteredEvents(
        (data ?? []).map(
          (registration) =>
            registration.event_id
        )
      );
    } catch (err) {
      console.error(
        "Error loading registrations:",
        err
      );

      setRegistrationError(
        "تعذر تحميل حالة التسجيل في الفعاليات."
      );
    }
  };

  useEffect(() => {
    void loadEvents();
    void loadMyRegistrations();
  }, []);

  const matchesStudent = (
    event: StudentEvent
  ) => {
    const target = event.target;

    if (!hasTarget(target)) {
      return true;
    }

    if (
      target?.faculty &&
      target.faculty !== profile.faculty
    ) {
      return false;
    }

    if (
      target?.program &&
      target.program !== profile.program
    ) {
      return false;
    }

    if (
      target?.academicYear &&
      target.academicYear !==
        profile.academicYear
    ) {
      return false;
    }

    return true;
  };

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesTarget =
        matchesStudent(event);

      const matchesCategory =
        activeCategory === "الكل" ||
        event.category === activeCategory;

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

      const upcoming =
        isEventUpcoming(event);

      const matchesType =
        activeType === "الكل" ||
        (activeType === "مقترحة لك" &&
          hasTarget(event.target)) ||
        (activeType === "القادمة" &&
          upcoming) ||
        (activeType === "السابقة" &&
          !upcoming);

      return (
        matchesTarget &&
        matchesCategory &&
        matchesSearch &&
        matchesType
      );
    });
  }, [
    events,
    search,
    activeCategory,
    activeType,
    profile.faculty,
    profile.program,
    profile.academicYear,
  ]);

  const personalizedEvents =
    filteredEvents.filter((event) =>
      hasTarget(event.target)
    );

  const featuredEvent =
    filteredEvents.find((event) =>
      isEventUpcoming(event)
    ) ?? null;

  const regularEvents =
    filteredEvents.filter(
      (event) =>
        event.id !== featuredEvent?.id
    );

  const toggleRegistration = async (
    event: StudentEvent
  ) => {
    if (registrationLoading) return;

    if (!isEventUpcoming(event)) {
      setRegistrationError(
        "لا يمكن التسجيل في فعالية منتهية."
      );
      return;
    }

    setRegistrationError("");
    setRegistrationLoading(event.id);

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

      const isRegistered =
        registeredEvents.includes(event.id);

      /*
       * Cancellation:
       * The student can only delete his own registration
       * because of the existing RLS policy.
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

        setRegisteredEvents((current) =>
          current.filter(
            (id) => id !== event.id
          )
        );

        return;
      }

      /*
       * Registration:
       * Capacity checking and insertion are handled
       * atomically inside PostgreSQL.
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
        const message =
          registrationRpcError.message ?? "";

        if (
          message.includes("EVENT_FULL")
        ) {
          setRegistrationError(
            "عذرًا، اكتملت سعة هذه الفعالية."
          );
          return;
        }

        if (
          message.includes(
            "EVENT_NOT_AVAILABLE"
          )
        ) {
          setRegistrationError(
            "هذه الفعالية لم تعد متاحة للتسجيل."
          );
          return;
        }

        if (
          message.includes(
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

      setRegisteredEvents((current) =>
        current.includes(event.id)
          ? current
          : [...current, event.id]
      );
    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      setRegistrationError(
        "تعذر تنفيذ التسجيل الآن. حاول مرة أخرى."
      );
    } finally {
      setRegistrationLoading(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setActiveCategory("الكل");
    setActiveType("الكل");
  };

  if (loading) {
    return (
      <main
        className="page-shell events-page"
        dir="rtl"
      >
        <section className="events-empty">
          <div className="events-empty__icon">
            <LoaderCircle
              size={25}
              className="admin-spin"
            />
          </div>

          <h3>
            جاري تحميل الفعاليات
          </h3>

          <p>
            يتم الآن جلب أحدث الفعاليات من المنصة.
          </p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className="page-shell events-page"
        dir="rtl"
      >
        <section className="events-empty">
          <div className="events-empty__icon">
            <CalendarDays size={25} />
          </div>

          <h3>
            تعذر تحميل الفعاليات
          </h3>

          <p>{error}</p>

          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              void loadEvents();
              void loadMyRegistrations();
            }}
          >
            <RefreshCw size={16} />
            إعادة المحاولة
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      className="page-shell events-page"
      dir="rtl"
    >
      <section className="page-hero events-hero">
        <div>
          <span className="page-kicker">
            شارك معنا
          </span>

          <h1>الفعاليات</h1>

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

      {registrationError && (
        <section
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <span>{registrationError}</span>

          <button
            type="button"
            onClick={() =>
              setRegistrationError("")
            }
            aria-label="إغلاق التنبيه"
          >
            <X size={16} />
          </button>
        </section>
      )}

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

          <span>فعالية</span>
        </div>

        <button
          type="button"
          className="events-refresh"
          onClick={() => {
            void loadEvents();
            void loadMyRegistrations();
          }}
          aria-label="تحديث الفعاليات"
          title="تحديث الفعاليات"
        >
          <RefreshCw size={17} />
        </button>
      </section>

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
                : activeType === "السابقة"
                ? "الفعاليات السابقة"
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
            {featuredEvent && (
              <article className="event-featured">
                <div className="event-featured__date">
                  <CalendarDays size={18} />

                  <span>
                    {formatDate(
                      featuredEvent.date
                    )}
                  </span>
                </div>

                <div className="event-featured__main">
                  <div className="event-featured__meta">
                    <span>
                      {featuredEvent.category}
                    </span>

                    {hasTarget(
                      featuredEvent.target
                    ) ? (
                      <small>
                        مقترحة لك
                      </small>
                    ) : (
                      <small>
                        فعالية قادمة
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
                      {formatTime(
                        featuredEvent.time
                      )}
                    </span>

                    <span>
                      <MapPin size={15} />
                      {featuredEvent.location}
                    </span>

                    <span>
                      <Users size={15} />
                      {featuredEvent.capacity !== null
                        ? `${featuredEvent.capacity} مقعد`
                        : "سعة غير محددة"}
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

                    {(() => {
                      const isRegistered =
                        registeredEvents.includes(
                          featuredEvent.id
                        );

                      const isLoading =
                        registrationLoading ===
                        featuredEvent.id;

                      return (
                        <button
                          type="button"
                          className={`event-register ${
                            isRegistered
                              ? "event-register--registered"
                              : ""
                          }`}
                          onClick={() =>
                            void toggleRegistration(
                              featuredEvent
                            )
                          }
                          disabled={isLoading}
                          aria-busy={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <LoaderCircle
                                size={16}
                                className="admin-spin"
                              />
                              جاري التنفيذ...
                            </>
                          ) : isRegistered ? (
                            <>
                              <Check size={16} />
                              مسجل بالفعل
                            </>
                          ) : (
                            "التسجيل في الفعالية"
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </article>
            )}

            <div className="event-grid">
              {regularEvents.map((event) => {
                const isRegistered =
                  registeredEvents.includes(
                    event.id
                  );

                const upcoming =
                  isEventUpcoming(event);

                const isLoading =
                  registrationLoading ===
                  event.id;

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
                            {formatDate(
                              event.date
                            )}
                          </span>
                        </div>

                        <div className="event-card__categories">
                          <span className="event-category">
                            {event.category}
                          </span>

                          {hasTarget(
                            event.target
                          ) && (
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

                      <h2>{event.title}</h2>

                      <p>
                        {event.description}
                      </p>

                      <div className="event-card__info">
                        <span>
                          <Clock3 size={14} />
                          {formatTime(event.time)}
                        </span>

                        <span>
                          <MapPin size={14} />
                          {event.location}
                        </span>

                        <span>
                          <Users size={14} />
                          {event.capacity !== null
                            ? `${event.capacity} مقعد`
                            : "سعة غير محددة"}
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

                      {upcoming && (
                        <button
                          type="button"
                          className={`event-register event-register--small ${
                            isRegistered
                              ? "event-register--registered"
                              : ""
                          }`}
                          onClick={() =>
                            void toggleRegistration(
                              event
                            )
                          }
                          disabled={isLoading}
                          aria-busy={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <LoaderCircle
                                size={14}
                                className="admin-spin"
                              />
                              جاري...
                            </>
                          ) : isRegistered ? (
                            <>
                              <Check size={14} />
                              مسجل
                            </>
                          ) : (
                            "سجل الآن"
                          )}
                        </button>
                      )}
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