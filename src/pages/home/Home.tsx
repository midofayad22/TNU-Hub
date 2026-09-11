import type { CSSProperties, KeyboardEvent } from "react";
import { useEffect, useMemo, useState } from "react";
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
  Loader2,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useProfile } from "../../context/useProfile";

import { supabase } from "../../lib/supabase";

import { announcements } from "../../data/announcements";
import { events } from "../../data/events";

interface HomeRequest {
  id: number | string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface HomeSearchResult {
  id: string | number;
  type: "faculty" | "program" | "announcement" | "event" | "resource";
  title: string;
  description: string;
  category: string;
  to: string;
  searchableText: string;
}

const requestStatusIcons: Record<string, typeof Clock3> = {
  "قيد الانتظار": Clock3,
  "قيد المراجعة": Clock3,
  "تم الحل": CheckCircle2,
};

const requestStatusColors: Record<string, string> = {
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

/* ============================================================
   GLOBAL SEARCH HELPERS
============================================================ */

const normalizeArabic = (value: string) => {
  return value
    .toLocaleLowerCase("ar")
    .normalize("NFD")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const getFirstString = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
};

const getRowSearchText = (row: Record<string, unknown>) => {
  return Object.values(row)
    .filter((value) => typeof value === "string" || typeof value === "number")
    .map((value) => String(value))
    .join(" ");
};

const createSearchResult = (
  row: Record<string, unknown>,
  type: HomeSearchResult["type"],
): HomeSearchResult | null => {
  const rawId =
    row.id ??
    row.faculty_id ??
    row.program_id ??
    row.announcement_id ??
    row.event_id ??
    row.resource_id;

  if (rawId === undefined || rawId === null || rawId === "") {
    return null;
  }

  const id =
    typeof rawId === "number" || typeof rawId === "string"
      ? rawId
      : String(rawId);

  let title = "";
  let description = "";
  let category = "";
  let to = "";

  if (type === "faculty") {
    title =
      getFirstString(row, [
        "name",
        "title",
        "faculty_name",
        "faculty",
        "full_name",
      ]) || "كلية";

    description =
      getFirstString(row, [
        "description",
        "short_description",
        "summary",
        "content",
      ]) || "كلية أكاديمية";

    category = "كلية";

    to = `/faculties/${id}`;
  }

  if (type === "program") {
    title =
      getFirstString(row, [
        "name",
        "title",
        "program_name",
        "program",
        "full_name",
      ]) || "برنامج أكاديمي";

    description =
      getFirstString(row, [
        "description",
        "short_description",
        "summary",
        "content",
      ]) || "برنامج أكاديمي";

    category = "برنامج";

    const facultyId = row.faculty_id ?? row.facultyId;

    if (typeof facultyId === "string" || typeof facultyId === "number") {
      to = `/faculties/${facultyId}`;
    } else {
      to = "/faculties";
    }
  }

  if (type === "announcement") {
    title =
      getFirstString(row, ["title", "name", "announcement_title"]) || "إعلان";

    description =
      getFirstString(row, ["description", "content", "body", "summary"]) ||
      "إعلان طلابي";

    category = getFirstString(row, ["category", "type"]) || "إعلان";

    to = `/announcements/${id}`;
  }

  if (type === "event") {
    title = getFirstString(row, ["title", "name", "event_title"]) || "فعالية";

    description =
      getFirstString(row, ["description", "content", "body", "summary"]) ||
      "فعالية طلابية";

    category = getFirstString(row, ["category", "type"]) || "فعالية";

    to = `/events/${id}`;
  }

  if (type === "resource") {
    title = getFirstString(row, ["title", "name", "resource_title"]) || "مصدر";

    description =
      getFirstString(row, ["description", "content", "summary"]) ||
      "مصدر تعليمي";

    category = getFirstString(row, ["category", "type"]) || "مصدر";

    to = "/resources";
  }

  const searchableText = normalizeArabic(
    [title, description, category, getRowSearchText(row)].join(" "),
  );

  return {
    id,
    type,
    title,
    description,
    category,
    to,
    searchableText,
  };
};

const getSearchIcon = (type: HomeSearchResult["type"]) => {
  if (type === "faculty") {
    return Users;
  }

  if (type === "program") {
    return BookOpen;
  }

  if (type === "announcement") {
    return FileText;
  }

  if (type === "event") {
    return CalendarDays;
  }

  return BookOpen;
};

const getSearchTypeLabel = (type: HomeSearchResult["type"]) => {
  if (type === "faculty") {
    return "كلية";
  }

  if (type === "program") {
    return "برنامج";
  }

  if (type === "announcement") {
    return "إعلان";
  }

  if (type === "event") {
    return "فعالية";
  }

  return "مصدر";
};

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const [searchValue, setSearchValue] = useState("");

  const [searchResults, setSearchResults] = useState<HomeSearchResult[]>([]);

  const [searchLoading, setSearchLoading] = useState(false);

  const [searchError, setSearchError] = useState<string | null>(null);

  const [searchIndex, setSearchIndex] = useState<HomeSearchResult[]>([]);

  const [searchIndexLoaded, setSearchIndexLoaded] = useState(false);

  const [searchFocused, setSearchFocused] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  const [studentRequests, setStudentRequests] = useState<HomeRequest[]>([]);

  const [requestsLoading, setRequestsLoading] = useState(true);

  const [requestsError, setRequestsError] = useState<string | null>(null);

  const studentName = profile.name.trim() || "الطالب";

  const hasAcademicData =
    profile.faculty.trim() !== "" &&
    profile.program.trim() !== "" &&
    profile.academicYear.trim() !== "";

  /* ============================================================
     LOAD AUTHENTICATED USER
  ============================================================ */

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      setRequestsLoading(true);
      setRequestsError(null);

      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!mounted) {
          return;
        }

        if (error) {
          console.error("Failed to get current user:", error);

          setUserId(null);
          setStudentRequests([]);
          setRequestsError("تعذر التحقق من حسابك.");

          return;
        }

        if (!user) {
          setUserId(null);
          setStudentRequests([]);
          return;
        }

        setUserId(user.id);
      } catch (error) {
        console.error("Unexpected authentication error:", error);

        if (!mounted) {
          return;
        }

        setUserId(null);
        setStudentRequests([]);
        setRequestsError("حدث خطأ أثناء التحقق من الحساب.");
      } finally {
        if (mounted) {
          setRequestsLoading(false);
        }
      }
    };

    void loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================================
     LOAD SEARCH INDEX
  ============================================================ */

  useEffect(() => {
    let mounted = true;

    const loadSearchIndex = async () => {
      if (searchIndexLoaded) {
        return;
      }

      setSearchLoading(true);
      setSearchError(null);

      try {
        const [
          facultiesResponse,
          programsResponse,
          announcementsResponse,
          eventsResponse,
          resourcesResponse,
        ] = await Promise.all([
          supabase.from("faculties").select("*").limit(100),

          supabase.from("programs").select("*").limit(200),

          supabase.from("announcements").select("*").limit(100),

          supabase.from("events").select("*").limit(100),

          supabase.from("resources").select("*").limit(100),
        ]);

        if (!mounted) {
          return;
        }

        const errors = [
          facultiesResponse.error,
          programsResponse.error,
          announcementsResponse.error,
          eventsResponse.error,
          resourcesResponse.error,
        ].filter(Boolean);

        if (errors.length > 0) {
          console.error("Some search data failed to load:", errors);
        }

        const results: HomeSearchResult[] = [];

        const facultyRows = (facultiesResponse.data ?? []) as Record<
          string,
          unknown
        >[];

        const programRows = (programsResponse.data ?? []) as Record<
          string,
          unknown
        >[];

        const announcementRows = (announcementsResponse.data ?? []) as Record<
          string,
          unknown
        >[];

        const eventRows = (eventsResponse.data ?? []) as Record<
          string,
          unknown
        >[];

        const resourceRows = (resourcesResponse.data ?? []) as Record<
          string,
          unknown
        >[];

        facultyRows.forEach((row) => {
          const result = createSearchResult(row, "faculty");

          if (result) {
            results.push(result);
          }
        });

        programRows.forEach((row) => {
          const result = createSearchResult(row, "program");

          if (result) {
            results.push(result);
          }
        });

        announcementRows.forEach((row) => {
          const result = createSearchResult(row, "announcement");

          if (result) {
            results.push(result);
          }
        });

        eventRows.forEach((row) => {
          const result = createSearchResult(row, "event");

          if (result) {
            results.push(result);
          }
        });

        resourceRows.forEach((row) => {
          const result = createSearchResult(row, "resource");

          if (result) {
            results.push(result);
          }
        });

        setSearchIndex(results);
        setSearchIndexLoaded(true);
      } catch (error) {
        console.error("Failed to load global search index:", error);

        if (!mounted) {
          return;
        }

        setSearchIndex([]);
        setSearchError("تعذر تحميل نتائج البحث حاليًا.");
      } finally {
        if (mounted) {
          setSearchLoading(false);
        }
      }
    };

    if (searchValue.trim()) {
      void loadSearchIndex();
    }

    return () => {
      mounted = false;
    };
  }, [searchValue, searchIndexLoaded]);

  /* ============================================================
     LIVE SEARCH
  ============================================================ */

  useEffect(() => {
    const query = normalizeArabic(searchValue);

    if (!query) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    if (!searchIndexLoaded) {
      return;
    }

    const timer = window.setTimeout(() => {
      const filtered = searchIndex
        .filter((result) => result.searchableText.includes(query))
        .sort((first, second) => {
          const firstTitle = normalizeArabic(first.title);

          const secondTitle = normalizeArabic(second.title);

          const firstStarts = firstTitle.startsWith(query);

          const secondStarts = secondTitle.startsWith(query);

          if (firstStarts && !secondStarts) {
            return -1;
          }

          if (!firstStarts && secondStarts) {
            return 1;
          }

          return 0;
        })
        .slice(0, 8);

      setSearchResults(filtered);
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchValue, searchIndex, searchIndexLoaded]);

  /* ============================================================
     LOAD STUDENT REQUESTS
  ============================================================ */

  useEffect(() => {
    let mounted = true;

    const loadStudentRequests = async () => {
      if (!userId) {
        setStudentRequests([]);
        setRequestsLoading(false);
        return;
      }

      setRequestsLoading(true);
      setRequestsError(null);

      try {
        const { data, error } = await supabase
          .from("requests")
          .select(
            "id, user_id, title, category, description, status, created_at, updated_at",
          )
          .eq("user_id", userId)
          .order("created_at", {
            ascending: false,
          })
          .limit(3);

        if (!mounted) {
          return;
        }

        if (error) {
          console.error("Failed to load student requests:", error);

          setStudentRequests([]);
          setRequestsError("تعذر تحميل طلباتك حاليًا.");

          return;
        }

        setStudentRequests((data ?? []) as HomeRequest[]);
      } catch (error) {
        console.error("Unexpected error while loading requests:", error);

        if (!mounted) {
          return;
        }

        setStudentRequests([]);
        setRequestsError("حدث خطأ أثناء تحميل طلباتك.");
      } finally {
        if (mounted) {
          setRequestsLoading(false);
        }
      }
    };

    void loadStudentRequests();

    return () => {
      mounted = false;
    };
  }, [userId]);

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

    if (target.faculty && target.faculty !== profile.faculty) {
      return false;
    }

    if (target.program && target.program !== profile.program) {
      return false;
    }

    if (target.academicYear && target.academicYear !== profile.academicYear) {
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
  }, [profile.faculty, profile.program, profile.academicYear]);

  const personalizedAnnouncements = useMemo(() => {
    return relevantAnnouncements.filter((announcement) =>
      Boolean(announcement.target),
    );
  }, [relevantAnnouncements]);

  /* ============================================================
     PERSONALIZED EVENTS
  ============================================================ */

  const relevantEvents = useMemo(() => {
    return events.filter((event) => matchesTarget(event.target));
  }, [profile.faculty, profile.program, profile.academicYear]);

  const personalizedEvents = useMemo(() => {
    return relevantEvents.filter((event) => Boolean(event.target));
  }, [relevantEvents]);

  /* ============================================================
     ANNOUNCEMENTS TO SHOW
  ============================================================ */

  const latestAnnouncements = useMemo(() => {
    const personalized = relevantAnnouncements.filter((announcement) =>
      Boolean(announcement.target),
    );

    const general = relevantAnnouncements.filter(
      (announcement) => !announcement.target,
    );

    return [...personalized, ...general].slice(0, 3);
  }, [relevantAnnouncements]);

  const featuredAnnouncement =
    personalizedAnnouncements[0] ??
    relevantAnnouncements.find((announcement) => announcement.featured) ??
    relevantAnnouncements[0] ??
    announcements[0];

  /* ============================================================
     EVENTS TO SHOW
  ============================================================ */

  const latestEvents = useMemo(() => {
    const personalized = relevantEvents.filter((event) =>
      Boolean(event.target),
    );

    const general = relevantEvents.filter((event) => !event.target);

    return [...personalized, ...general].slice(0, 3);
  }, [relevantEvents]);

  const featuredEvent =
    personalizedEvents[0] ??
    relevantEvents.find((event) => event.featured) ??
    relevantEvents[0] ??
    events[0];

  /* ============================================================
     SEARCH ACTIONS
  ============================================================ */

  const handleSearch = () => {
    const value = searchValue.trim();

    if (!value) {
      return;
    }

    setSearchFocused(false);

    navigate(`/explore?search=${encodeURIComponent(value)}`);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }

    if (event.key === "Escape") {
      setSearchFocused(false);
    }
  };

  const handleSearchResultClick = () => {
    setSearchFocused(false);
  };

  const showSearchPanel = searchFocused && Boolean(searchValue.trim());

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

          {/* =================================================
              GLOBAL SEARCH
          ================================================= */}

          <div
            className={`home-search-wrapper${
              showSearchPanel ? " home-search-wrapper--open" : ""
            }`}
          >
            <div className="home-search">
              <Search size={19} aria-hidden="true" />

              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="ابحث عن فعالية، إعلان، كلية أو خدمة..."
                aria-label="البحث في المنصة"
                aria-expanded={showSearchPanel}
                aria-controls="home-search-results"
                autoComplete="off"
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

            {/* =================================================
                LIVE SEARCH RESULTS
            ================================================= */}

            {showSearchPanel && (
              <div
                id="home-search-results"
                className="home-search-results"
                role="listbox"
              >
                {searchLoading && !searchIndexLoaded && (
                  <div className="home-search-results__state">
                    <Loader2 size={19} className="spin" />

                    <span>جاري البحث...</span>
                  </div>
                )}

                {!searchLoading &&
                  searchIndexLoaded &&
                  searchResults.length > 0 && (
                    <>
                      <div className="home-search-results__header">
                        <span>نتائج البحث</span>

                        <small>{searchResults.length} نتيجة</small>
                      </div>

                      <div className="home-search-results__list">
                        {searchResults.map((result) => {
                          const Icon = getSearchIcon(result.type);

                          return (
                            <Link
                              key={`${result.type}-${result.id}`}
                              to={result.to}
                              className="home-search-result"
                              role="option"
                              onClick={handleSearchResultClick}
                            >
                              <span className="home-search-result__icon">
                                <Icon size={18} />
                              </span>

                              <span className="home-search-result__content">
                                <strong>{result.title}</strong>

                                <span>{result.description}</span>
                              </span>

                              <span className="home-search-result__meta">
                                {result.category ||
                                  getSearchTypeLabel(result.type)}

                                <ChevronLeft size={16} />
                              </span>
                            </Link>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        className="home-search-results__all"
                        onClick={handleSearch}
                      >
                        عرض كل النتائج في الاستكشاف
                        <ArrowLeft size={15} />
                      </button>
                    </>
                  )}

                {!searchLoading &&
                  searchIndexLoaded &&
                  searchResults.length === 0 && (
                    <div className="home-search-results__state home-search-results__state--empty">
                      <Search size={20} />

                      <strong>لا توجد نتائج مطابقة</strong>

                      <span>
                        جرّب كلمة أخرى أو ابحث باسم كلية أو برنامج أو فعالية.
                      </span>
                    </div>
                  )}

                {searchError && !searchLoading && (
                  <div className="home-search-results__state home-search-results__state--error">
                    <Search size={20} />

                    <span>{searchError}</span>

                    <button
                      type="button"
                      onClick={() => {
                        setSearchIndexLoaded(false);
                      }}
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="home-hero__suggestions">
            <span>اقتراحات:</span>

            <Link to="/events">الفعاليات</Link>

            <Link to="/announcements">الإعلانات</Link>

            <Link to="/help">المساعدة</Link>
          </div>
        </div>

        <div className="home-hero__aside">
          <div className="home-hero__aside-top">
            <span>اتحاد الطلاب</span>

            <Sparkles size={18} />
          </div>

          <div className="home-hero__statement">
            <span className="home-hero__number">01</span>

            <h2>
              تجربة جامعية
              <br />
              أفضل تبدأ من هنا.
            </h2>

            <p>مكان واحد يجمع أهم ما يخص حياتك الجامعية.</p>
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
                خصصنا لك بعض الإعلانات والفعاليات بناءً على بياناتك الأكاديمية.
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
            <span className="section-overline">ابدأ من هنا</span>

            <h2>ماذا تحتاج اليوم؟</h2>
          </div>

          <p>اختصارات سريعة لأكثر الخدمات استخدامًا.</p>
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
                <span className="home-action__number">0{index + 1}</span>

                <div className="home-action__icon">
                  <Icon size={21} />
                </div>

                <div className="home-action__content">
                  <h3>{action.title}</h3>

                  <p>{action.description}</p>
                </div>

                <ArrowUpLeft className="home-action__arrow" size={19} />
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

            <Link to="/announcements" className="text-link">
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

                <time>{featuredAnnouncement.date}</time>
              </div>

              <div className="featured-announcement__icon">
                <Bell size={21} />
              </div>

              {featuredAnnouncement.target && (
                <span className="home-personal-badge">مقترح لك</span>
              )}

              <h3>{featuredAnnouncement.title}</h3>

              <p>{featuredAnnouncement.description}</p>

              <span className="featured-announcement__link">
                قراءة الإعلان
                <ArrowLeft size={15} />
              </span>
            </Link>
          ) : (
            <div className="home-content-empty">
              <Bell size={22} />

              <h3>لا توجد إعلانات حاليًا</h3>

              <p>سنعرض أحدث الإعلانات هنا فور توفرها.</p>
            </div>
          )}

          <div className="content-list">
            {latestAnnouncements
              .filter(
                (announcement) => announcement.id !== featuredAnnouncement?.id,
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
                    <small className="home-list-badge">لك</small>
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
                {personalizedEvents.length > 0 ? "مخصص لك" : "شارك معنا"}
              </span>

              <h2>
                {personalizedEvents.length > 0
                  ? "فعاليات تهمك"
                  : "الفعاليات القادمة"}
              </h2>
            </div>

            <Link to="/events" className="text-link">
              عرض الكل
              <ChevronLeft size={16} />
            </Link>
          </div>

          {featuredEvent ? (
            <Link to={`/events/${featuredEvent.id}`} className="featured-event">
              <div className="featured-event__date">
                <CalendarDays size={19} />

                <span>{featuredEvent.date}</span>
              </div>

              <span className="content-label">{featuredEvent.category}</span>

              {featuredEvent.target && (
                <span className="home-personal-badge">مقترحة لك</span>
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

              <p>سنعرض الفعاليات القادمة هنا فور إضافتها.</p>
            </div>
          )}

          <div className="content-list">
            {latestEvents
              .filter((event) => event.id !== featuredEvent?.id)
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
                    <small className="home-list-badge">لك</small>
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
            <span className="section-overline">المتابعة</span>

            <h2>طلباتك الأخيرة</h2>
          </div>

          <Link to="/requests" className="text-link">
            كل الطلبات
            <ChevronLeft size={16} />
          </Link>
        </div>

        {requestsLoading ? (
          <div className="home-content-empty home-content-empty--requests">
            <Loader2 size={22} className="spin" />

            <h3>جاري تحميل طلباتك...</h3>

            <p>لحظات ونظهر لك أحدث طلباتك.</p>
          </div>
        ) : requestsError ? (
          <div className="home-content-empty home-content-empty--requests">
            <ClipboardList size={22} />

            <h3>تعذر تحميل الطلبات</h3>

            <p>{requestsError}</p>

            <Link to="/requests" className="button button--primary">
              عرض الطلبات
              <ArrowLeft size={16} />
            </Link>
          </div>
        ) : !userId ? (
          <div className="home-content-empty home-content-empty--requests">
            <ClipboardList size={22} />

            <h3>سجّل الدخول لمتابعة طلباتك</h3>

            <p>بعد تسجيل الدخول ستتمكن من إنشاء طلباتك ومتابعتها من هنا.</p>

            <Link to="/login" className="button button--primary">
              تسجيل الدخول
              <ArrowLeft size={16} />
            </Link>
          </div>
        ) : studentRequests.length > 0 ? (
          <div className="home-requests">
            {studentRequests.map((request, index) => {
              const StatusIcon = requestStatusIcons[request.status] ?? Clock3;

              const statusColor = requestStatusColors[request.status] ?? "info";

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
                      <span className="home-request__id">#{request.id}</span>

                      <h3>{request.title}</h3>

                      <span>{request.category}</span>
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

            <p>عندما ترسل طلب مساعدة، ستتمكن من متابعته من هنا.</p>

            <Link to="/requests/new" className="button button--primary">
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
        <div
          className="home-final__mark"
          aria-label="Tanta University Students Union"
        >
          <span className="home-final__mark-main">TNU</span>
          <span className="home-final__mark-sub">STUDENTS</span>
        </div>

        <div className="home-final__content">
          <span>تحتاج إلى مساعدة؟</span>

          <h2>لا تعرف من أين تبدأ؟</h2>

          <p>
            مركز المساعدة موجود لمساعدتك في الوصول إلى المكان المناسب أو إرسال
            طلب لفريق اتحاد الطلاب.
          </p>
        </div>

        <Link to="/help" className="home-final__button">
          ابدأ من مركز المساعدة
          <ArrowLeft size={17} />
        </Link>
      </section>
    </main>
  );
}
