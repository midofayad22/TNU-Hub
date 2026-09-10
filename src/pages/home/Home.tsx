import type {
  CSSProperties,
  KeyboardEvent,
} from "react";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpLeft,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Clock3,
  FileText,
  HelpCircle,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useProfile } from "../../context/useProfile";

import { announcements } from "../../data/announcements";
import { events } from "../../data/events";
import { requests } from "../../data/requests";

const requestStatusIcons = {
  "قيد الانتظار": Clock3,
  "قيد المراجعة": Clock3,
  "تم الحل": CheckCircle2,
};

const requestStatusColors = {
  "قيد الانتظار": "warning",
  "قيد المراجعة": "info",
  "تم الحل": "success",
};

const quickActions = [
  {
    title: "مركز المساعدة",
    description: "تحتاج إلى مساعدة؟ ابدأ من هنا.",
    icon: HelpCircle,
    to: "/help",
  },
  {
    title: "الفعاليات",
    description: "اكتشف ما يحدث داخل المجتمع الطلابي.",
    icon: CalendarDays,
    to: "/events",
  },
  {
    title: "المصادر",
    description: "أدلة ومواد مفيدة خلال رحلتك الجامعية.",
    icon: BookOpen,
    to: "/resources",
  },
  {
    title: "الكليات والبرامج",
    description: "تعرّف على الكليات والبرامج الأكاديمية.",
    icon: Users,
    to: "/faculties",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const [searchValue, setSearchValue] = useState("");

  const studentName = profile.name.trim() || "الطالب";

  const hasAcademicData =
    profile.faculty.trim() !== "" &&
    profile.program.trim() !== "" &&
    profile.academicYear.trim() !== "";

  /* ============================================================
     PERSONALIZATION
     ============================================================ */

  const matchesTarget = (
    target:
      | {
          faculty?: string;
          program?: string;
          academicYear?: string;
        }
      | undefined,
  ) => {
    if (!target) {
      return true;
    }

    if (
      target.faculty &&
      target.faculty !== profile.faculty
    ) {
      return false;
    }

    if (
      target.program &&
      target.program !== profile.program
    ) {
      return false;
    }

    if (
      target.academicYear &&
      target.academicYear !== profile.academicYear
    ) {
      return false;
    }

    return true;
  };

  /* ============================================================
     PERSONALIZED ANNOUNCEMENTS
     ============================================================ */

  const relevantAnnouncements = useMemo(() => {
    return announcements.filter((announcement) =>
      matchesTarget(announcement.target),
    );
  }, [
    profile.faculty,
    profile.program,
    profile.academicYear,
  ]);

  const personalizedAnnouncements = useMemo(() => {
    return relevantAnnouncements.filter(
      (announcement) => Boolean(announcement.target),
    );
  }, [relevantAnnouncements]);

  /* ============================================================
     PERSONALIZED EVENTS
     ============================================================ */

  const relevantEvents = useMemo(() => {
    return events.filter((event) =>
      matchesTarget(event.target),
    );
  }, [
    profile.faculty,
    profile.program,
    profile.academicYear,
  ]);

  const personalizedEvents = useMemo(() => {
    return relevantEvents.filter(
      (event) => Boolean(event.target),
    );
  }, [relevantEvents]);

  /* ============================================================
     ANNOUNCEMENTS TO SHOW
     ============================================================ */

  const latestAnnouncements = useMemo(() => {
    const personalized = relevantAnnouncements.filter(
      (announcement) => Boolean(announcement.target),
    );

    const general = relevantAnnouncements.filter(
      (announcement) => !announcement.target,
    );

    return [...personalized, ...general].slice(0, 3);
  }, [relevantAnnouncements]);

  const featuredAnnouncement =
    personalizedAnnouncements[0] ??
    relevantAnnouncements.find(
      (announcement) => announcement.featured,
    ) ??
    relevantAnnouncements[0] ??
    announcements[0];

  /* ============================================================
     EVENTS TO SHOW
     ============================================================ */

  const latestEvents = useMemo(() => {
    const personalized = relevantEvents.filter(
      (event) => Boolean(event.target),
    );

    const general = relevantEvents.filter(
      (event) => !event.target,
    );

    return [...personalized, ...general].slice(0, 3);
  }, [relevantEvents]);

  const featuredEvent =
    personalizedEvents[0] ??
    relevantEvents.find((event) => event.featured) ??
    relevantEvents[0] ??
    events[0];

  /* ============================================================
     SEARCH
     ============================================================ */

  const handleSearch = () => {
    const value = searchValue.trim();

    if (!value) {
      return;
    }

    navigate(
      `/explore?search=${encodeURIComponent(value)}`,
    );
  };

  const handleSearchKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <main className="page-shell home-page" dir="rtl">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="home-hero">
        <div className="home-hero__background" aria-hidden="true">
          <span className="home-hero__orb home-hero__orb--one" />
          <span className="home-hero__orb home-hero__orb--two" />
          <span className="home-hero__grid" />
        </div>

        <div className="home-hero__main">
          <div className="home-hero__eyebrow">
            <span className="home-hero__eyebrow-line" />

            <span>
              {profile.name.trim()
                ? `مرحبًا بك، ${studentName}`
                : "الحياة الجامعية، في مكان واحد"}
            </span>
          </div>

          <h1>
            كل ما تحتاجه
            <br />
            <span>في رحلتك الجامعية.</span>
          </h1>

          <p>
            {hasAcademicData
              ? `${profile.faculty} · ${profile.program} · ${profile.academicYear}`
              : "أخبار، فعاليات، دعم، مصادر وخدمات طلابية — مصممة لتساعدك على الوصول لما تحتاجه بسهولة."}
          </p>

          <div className="home-search">
            <Search
              size={19}
              aria-hidden="true"
            />

            <input
              type="search"
              value={searchValue}
              onChange={(event) =>
                setSearchValue(event.target.value)
              }
              onKeyDown={handleSearchKeyDown}
              placeholder="ابحث عن فعالية، إعلان، كلية أو خدمة..."
              aria-label="البحث في المنصة"
            />

            {searchValue.trim() && (
              <button
                type="button"
                onClick={handleSearch}
                aria-label="تنفيذ البحث"
              >
                بحث
                <ArrowLeft size={16} />
              </button>
            )}
          </div>

          <div className="home-hero__suggestions">
            <span>اقتراحات:</span>

            <Link to="/events">
              الفعاليات
            </Link>

            <Link to="/announcements">
              الإعلانات
            </Link>

            <Link to="/help">
              المساعدة
            </Link>
          </div>
        </div>

        <div className="home-hero__aside">
          <div className="home-hero__aside-top">
            <span>اتحاد الطلاب</span>

            <Sparkles size={18} />
          </div>

          <div className="home-hero__statement">
            <span className="home-hero__number">
              01
            </span>

            <h2>
              تجربة جامعية
              <br />
              أفضل تبدأ من هنا.
            </h2>

            <p>
              مكان واحد يجمع أهم ما يخص حياتك الجامعية.
            </p>
          </div>

          <div className="home-hero__aside-bottom">
            <span>اكتشف المنصة</span>

            <ArrowUpLeft size={17} />
          </div>
        </div>
      </section>

      {/* =====================================================
          PERSONALIZED SUMMARY
      ===================================================== */}

      {hasAcademicData &&
        (personalizedAnnouncements.length > 0 ||
          personalizedEvents.length > 0) && (
          <section className="home-personalized">
            <div className="home-personalized__icon">
              <Sparkles size={19} />
            </div>

            <div className="home-personalized__content">
              <strong>محتوى مختار لك</strong>

              <p>
                خصصنا لك بعض الإعلانات والفعاليات بناءً على
                بياناتك الأكاديمية.
              </p>
            </div>

            <div className="home-personalized__stats">
              {personalizedAnnouncements.length > 0 && (
                <span>
                  <Bell size={15} />
                  {personalizedAnnouncements.length} إعلانات
                </span>
              )}

              {personalizedEvents.length > 0 && (
                <span>
                  <CalendarDays size={15} />
                  {personalizedEvents.length} فعاليات
                </span>
              )}
            </div>
          </section>
        )}

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section className="home-section home-section--actions">
        <div className="home-section__heading">
          <div>
            <span className="section-overline">
              ابدأ من هنا
            </span>

            <h2>ماذا تحتاج اليوم؟</h2>
          </div>

          <p>
            اختصارات سريعة لأكثر الخدمات استخدامًا.
          </p>
        </div>

        <div className="home-actions-grid">
          {quickActions.map((action, index) => {
            const Icon = action.icon;

            return (
              <Link
                to={action.to}
                className="home-action"
                key={action.title}
                style={
                  {
                    "--home-action-index": index,
                  } as CSSProperties
                }
              >
                <span className="home-action__number">
                  0{index + 1}
                </span>

                <div className="home-action__icon">
                  <Icon size={21} />
                </div>

                <div className="home-action__content">
                  <h3>{action.title}</h3>

                  <p>{action.description}</p>
                </div>

                <ArrowUpLeft
                  className="home-action__arrow"
                  size={19}
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="home-main-grid">
        {/* ===================================================
            ANNOUNCEMENTS
        =================================================== */}

        <section className="home-section">
          <div className="home-section__heading home-section__heading--compact">
            <div>
              <span className="section-overline">
                {personalizedAnnouncements.length > 0
                  ? "مخصص لك"
                  : "ابقَ على اطلاع"}
              </span>

              <h2>
                {personalizedAnnouncements.length > 0
                  ? "إعلانات تهمك"
                  : "آخر الإعلانات"}
              </h2>
            </div>

            <Link
              to="/announcements"
              className="text-link"
            >
              عرض الكل
              <ChevronLeft size={16} />
            </Link>
          </div>

          {featuredAnnouncement ? (
            <Link
              to={`/announcements/${featuredAnnouncement.id}`}
              className="featured-announcement"
            >
              <div className="featured-announcement__top">
                <span className="content-label">
                  {featuredAnnouncement.category}
                </span>

                <time>
                  {featuredAnnouncement.date}
                </time>
              </div>

              <div className="featured-announcement__icon">
                <Bell size={21} />
              </div>

              {featuredAnnouncement.target && (
                <span className="home-personal-badge">
                  مقترح لك
                </span>
              )}

              <h3>
                {featuredAnnouncement.title}
              </h3>

              <p>
                {featuredAnnouncement.description}
              </p>

              <span className="featured-announcement__link">
                قراءة الإعلان
                <ArrowLeft size={15} />
              </span>
            </Link>
          ) : (
            <div className="home-content-empty">
              <Bell size={22} />
              <h3>لا توجد إعلانات حاليًا</h3>
              <p>
                سنعرض أحدث الإعلانات هنا فور توفرها.
              </p>
            </div>
          )}

          <div className="content-list">
            {latestAnnouncements
              .filter(
                (announcement) =>
                  announcement.id !==
                  featuredAnnouncement?.id,
              )
              .map((announcement, index) => (
                <Link
                  to={`/announcements/${announcement.id}`}
                  className="content-list__item"
                  key={announcement.id}
                  style={
                    {
                      "--home-list-index": index,
                    } as CSSProperties
                  }
                >
                  <div className="content-list__icon">
                    <FileText size={18} />
                  </div>

                  <div>
                    <h3>{announcement.title}</h3>

                    <span>
                      {announcement.category}
                      {" · "}
                      {announcement.date}
                    </span>
                  </div>

                  {announcement.target && (
                    <small className="home-list-badge">
                      لك
                    </small>
                  )}

                  <ChevronLeft size={17} />
                </Link>
              ))}
          </div>
        </section>

        {/* ===================================================
            EVENTS
        =================================================== */}

        <section className="home-section">
          <div className="home-section__heading home-section__heading--compact">
            <div>
              <span className="section-overline">
                {personalizedEvents.length > 0
                  ? "مخصص لك"
                  : "شارك معنا"}
              </span>

              <h2>
                {personalizedEvents.length > 0
                  ? "فعاليات تهمك"
                  : "الفعاليات القادمة"}
              </h2>
            </div>

            <Link
              to="/events"
              className="text-link"
            >
              عرض الكل
              <ChevronLeft size={16} />
            </Link>
          </div>

          {featuredEvent ? (
            <Link
              to={`/events/${featuredEvent.id}`}
              className="featured-event"
            >
              <div className="featured-event__date">
                <CalendarDays size={19} />

                <span>{featuredEvent.date}</span>
              </div>

              <span className="content-label">
                {featuredEvent.category}
              </span>

              {featuredEvent.target && (
                <span className="home-personal-badge">
                  مقترحة لك
                </span>
              )}

              <h3>{featuredEvent.title}</h3>

              <p>{featuredEvent.description}</p>

              <div className="featured-event__meta">
                <span>
                  <Clock3 size={15} />
                  {featuredEvent.time}
                </span>

                <span>
                  <Users size={15} />
                  {featuredEvent.attendees} طالب
                </span>
              </div>

              <div className="featured-event__footer">
                <span>{featuredEvent.location}</span>

                <span>
                  التفاصيل
                  <ArrowLeft size={15} />
                </span>
              </div>
            </Link>
          ) : (
            <div className="home-content-empty">
              <CalendarDays size={22} />
              <h3>لا توجد فعاليات حاليًا</h3>
              <p>
                سنعرض الفعاليات القادمة هنا فور إضافتها.
              </p>
            </div>
          )}

          <div className="content-list">
            {latestEvents
              .filter(
                (event) =>
                  event.id !== featuredEvent?.id,
              )
              .map((event, index) => (
                <Link
                  to={`/events/${event.id}`}
                  className="content-list__item"
                  key={event.id}
                  style={
                    {
                      "--home-list-index": index,
                    } as CSSProperties
                  }
                >
                  <div className="content-list__icon">
                    <CalendarDays size={18} />
                  </div>

                  <div>
                    <h3>{event.title}</h3>

                    <span>
                      {event.date}
                      {" · "}
                      {event.time}
                    </span>
                  </div>

                  {event.target && (
                    <small className="home-list-badge">
                      لك
                    </small>
                  )}

                  <ChevronLeft size={17} />
                </Link>
              ))}
          </div>
        </section>
      </div>

      {/* =====================================================
          REQUESTS
      ===================================================== */}

      <section className="home-section home-requests-section">
        <div className="home-section__heading home-section__heading--compact">
          <div>
            <span className="section-overline">
              المتابعة
            </span>

            <h2>طلباتك الأخيرة</h2>
          </div>

          <Link
            to="/requests"
            className="text-link"
          >
            كل الطلبات
            <ChevronLeft size={16} />
          </Link>
        </div>

        {requests.length > 0 ? (
          <div className="home-requests">
            {requests.map((request, index) => {
              const StatusIcon =
                requestStatusIcons[request.status];

              const statusColor =
                requestStatusColors[request.status];

              return (
                <Link
                  to={`/requests/${request.id}`}
                  className="home-request"
                  key={request.id}
                  style={
                    {
                      "--home-request-index": index,
                    } as CSSProperties
                  }
                >
                  <div className="home-request__main">
                    <div className="home-request__icon">
                      <ClipboardList size={18} />
                    </div>

                    <div>
                      <span className="home-request__id">
                        {request.id}
                      </span>

                      <h3>{request.title}</h3>

                      <span>
                        {request.category}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`home-request__status home-request__status--${statusColor}`}
                  >
                    <StatusIcon size={15} />
                    {request.status}
                  </div>

                  <ChevronLeft size={17} />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="home-content-empty home-content-empty--requests">
            <ClipboardList size={22} />
            <h3>لا توجد طلبات بعد</h3>
            <p>
              عندما ترسل طلب مساعدة، ستتمكن من متابعته من هنا.
            </p>

            <Link
              to="/requests/new"
              className="button button--primary"
            >
              إنشاء طلب
              <ArrowLeft size={16} />
            </Link>
          </div>
        )}
      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section className="home-final">
        <div className="home-final__mark" aria-hidden="true">
          ط
        </div>

        <div className="home-final__content">
          <span>تحتاج إلى مساعدة؟</span>

          <h2>لا تعرف من أين تبدأ؟</h2>

          <p>
            مركز المساعدة موجود لمساعدتك في الوصول إلى المكان
            المناسب أو إرسال طلب لفريق اتحاد الطلاب.
          </p>
        </div>

        <Link
          to="/help"
          className="home-final__button"
        >
          ابدأ من مركز المساعدة
          <ArrowLeft size={17} />
        </Link>
      </section>
    </main>
  );
}