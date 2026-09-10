import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  CircleHelp,
  GraduationCap,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

import { supabase } from "../../lib/supabase";

type ExploreSection = {
  title: string;
  description: string;
  icon: typeof GraduationCap;
  to: string;
  category: string;
  keywords: string[];
};

type SearchResult = {
  id: string;
  title: string;
  description: string;
  category: string;
  to: string;
  icon: typeof GraduationCap;
  source: string;
};

type DatabaseRow = Record<string, unknown>;

/* =========================================================
   PLATFORM SECTIONS
   ========================================================= */

const sections: ExploreSection[] = [
  {
    title: "الكليات والبرامج",
    description:
      "استكشف الكليات والبرامج الأكاديمية وتعرّف على تخصصاتها.",
    icon: GraduationCap,
    to: "/faculties",
    category: "أكاديمي",
    keywords: [
      "كليات",
      "كلية",
      "برامج",
      "برنامج",
      "تخصصات",
      "تخصص",
      "دراسة",
      "أكاديمي",
      "تعليم",
      "جامعة",
      "هندسة",
      "حاسب",
      "حاسبات",
      "برمجة",
    ],
  },
  {
    title: "الفعاليات",
    description:
      "اكتشف الأنشطة والورش والمسابقات والفعاليات القادمة.",
    icon: CalendarDays,
    to: "/events",
    category: "الحياة الطلابية",
    keywords: [
      "فعاليات",
      "فعالية",
      "أنشطة",
      "نشاط",
      "ورش",
      "ورشة",
      "مسابقات",
      "مسابقة",
      "أحداث",
      "حدث",
      "طلاب",
    ],
  },
  {
    title: "الإعلانات",
    description:
      "تابع آخر الأخبار والتنبيهات والمستجدات المهمة.",
    icon: Bell,
    to: "/announcements",
    category: "المستجدات",
    keywords: [
      "إعلانات",
      "إعلان",
      "أخبار",
      "خبر",
      "تنبيهات",
      "تنبيه",
      "مستجدات",
      "مستجد",
      "أخبار الجامعة",
    ],
  },
  {
    title: "مركز المساعدة",
    description:
      "ابحث عن إجابة أو احصل على الدعم عندما تحتاج إليه.",
    icon: CircleHelp,
    to: "/help",
    category: "الدعم",
    keywords: [
      "مساعدة",
      "دعم",
      "أسئلة",
      "سؤال",
      "مشكلة",
      "استفسار",
      "faq",
      "حل",
      "مركز المساعدة",
    ],
  },
  {
    title: "المصادر",
    description:
      "الوصول إلى الأدلة والمصادر المفيدة خلال رحلتك الجامعية.",
    icon: BookOpen,
    to: "/resources",
    category: "المصادر",
    keywords: [
      "مصادر",
      "مصدر",
      "أدلة",
      "دليل",
      "ملفات",
      "ملف",
      "مراجع",
      "مرجع",
      "تعلم",
      "معلومات",
      "كتب",
      "كتاب",
    ],
  },
  {
    title: "طلبات الدعم",
    description:
      "أنشئ طلبًا وتابع حالته وتعرّف على آخر تحديثاته.",
    icon: Users,
    to: "/requests",
    category: "الدعم",
    keywords: [
      "طلبات",
      "طلب",
      "طلبات الدعم",
      "دعم",
      "مشكلة",
      "استفسار",
      "متابعة",
      "حالة الطلب",
      "اتحاد الطلاب",
    ],
  },
  {
    title: "الحياة الطلابية",
    description:
      "شارك في الأنشطة وتعرّف على الفرص والمجتمع الطلابي.",
    icon: Users,
    to: "/events",
    category: "المجتمع",
    keywords: [
      "طلاب",
      "طالب",
      "مجتمع",
      "حياة جامعية",
      "أنشطة",
      "نشاط",
      "مشاركة",
      "اتحاد",
      "تطوع",
      "فرص",
    ],
  },
];

const categories = [
  "الكل",
  "أكاديمي",
  "الحياة الطلابية",
  "المستجدات",
  "الدعم",
  "المصادر",
  "المجتمع",
];

/* =========================================================
   SEARCH HELPERS
   ========================================================= */

const normalizeArabic = (value: string) => {
  return value
    .toLocaleLowerCase("ar")
    .normalize("NFKC")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const getString = (
  row: DatabaseRow,
  keys: string[],
) => {
  for (const key of keys) {
    const value = row[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }

    if (
      typeof value === "number"
    ) {
      return String(value);
    }
  }

  return "";
};

const getRowId = (
  row: DatabaseRow,
) => {
  const value =
    row.id ??
    row.uuid ??
    row.faculty_id ??
    row.program_id;

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return "";
};

/* =========================================================
   DATABASE SEARCH
   ========================================================= */

async function loadDatabaseSearchResults(): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  const [
    facultiesResponse,
    programsResponse,
    announcementsResponse,
    eventsResponse,
    resourcesResponse,
  ] = await Promise.all([
    supabase
      .from("faculties")
      .select("*"),

    supabase
      .from("programs")
      .select("*"),

    supabase
      .from("announcements")
      .select("*"),

    supabase
      .from("events")
      .select("*"),

    supabase
      .from("resources")
      .select("*"),
  ]);

  /* =======================================================
     FACULTIES
     ======================================================= */

  if (
    !facultiesResponse.error &&
    facultiesResponse.data
  ) {
    for (const row of facultiesResponse.data as DatabaseRow[]) {
      const id = getRowId(row);

      const title = getString(row, [
        "name",
        "title",
        "faculty_name",
      ]);

      const description = getString(row, [
        "description",
        "short_description",
        "details",
      ]);

      if (!title || !id) {
        continue;
      }

      results.push({
        id: `faculty-${id}`,
        title,
        description:
          description ||
          "كلية أكاديمية داخل جامعة طنطا الأهلية.",
        category: "أكاديمي",
        to: `/faculties/${id}`,
        icon: GraduationCap,
        source: "كلية",
      });
    }
  } else if (facultiesResponse.error) {
    console.error(
      "Failed to load faculties for search:",
      facultiesResponse.error,
    );
  }

  /* =======================================================
     PROGRAMS
     ======================================================= */

  if (
    !programsResponse.error &&
    programsResponse.data
  ) {
    for (const row of programsResponse.data as DatabaseRow[]) {
      const id = getRowId(row);

      const title = getString(row, [
        "name",
        "title",
        "program_name",
      ]);

      const description = getString(row, [
        "description",
        "short_description",
        "details",
      ]);

      if (!title || !id) {
        continue;
      }

      /*
       * البرامج ليس لها صفحة مستقلة بالضرورة،
       * لذلك نعيد المستخدم إلى صفحة الكليات.
       */
      results.push({
        id: `program-${id}`,
        title,
        description:
          description ||
          "برنامج أكاديمي متاح ضمن برامج الجامعة.",
        category: "أكاديمي",
        to: "/faculties",
        icon: GraduationCap,
        source: "برنامج أكاديمي",
      });
    }
  } else if (programsResponse.error) {
    console.error(
      "Failed to load programs for search:",
      programsResponse.error,
    );
  }

  /* =======================================================
     ANNOUNCEMENTS
     ======================================================= */

  if (
    !announcementsResponse.error &&
    announcementsResponse.data
  ) {
    for (const row of announcementsResponse.data as DatabaseRow[]) {
      const id = getRowId(row);

      const title = getString(row, [
        "title",
        "name",
      ]);

      const description = getString(row, [
        "description",
        "content",
        "body",
        "details",
      ]);

      if (!title || !id) {
        continue;
      }

      results.push({
        id: `announcement-${id}`,
        title,
        description:
          description ||
          "إعلان ومستجد من منصة TNU Hub.",
        category: "المستجدات",
        to: `/announcements/${id}`,
        icon: Bell,
        source: "إعلان",
      });
    }
  } else if (announcementsResponse.error) {
    console.error(
      "Failed to load announcements for search:",
      announcementsResponse.error,
    );
  }

  /* =======================================================
     EVENTS
     ======================================================= */

  if (
    !eventsResponse.error &&
    eventsResponse.data
  ) {
    for (const row of eventsResponse.data as DatabaseRow[]) {
      const id = getRowId(row);

      const title = getString(row, [
        "title",
        "name",
        "event_name",
      ]);

      const description = getString(row, [
        "description",
        "content",
        "details",
      ]);

      if (!title || !id) {
        continue;
      }

      results.push({
        id: `event-${id}`,
        title,
        description:
          description ||
          "فعالية طلابية داخل مجتمع TNU Hub.",
        category: "الحياة الطلابية",
        to: `/events/${id}`,
        icon: CalendarDays,
        source: "فعالية",
      });
    }
  } else if (eventsResponse.error) {
    console.error(
      "Failed to load events for search:",
      eventsResponse.error,
    );
  }

  /* =======================================================
     RESOURCES
     ======================================================= */

  if (
    !resourcesResponse.error &&
    resourcesResponse.data
  ) {
    for (const row of resourcesResponse.data as DatabaseRow[]) {
      const id = getRowId(row);

      const title = getString(row, [
        "title",
        "name",
        "resource_name",
      ]);

      const description = getString(row, [
        "description",
        "content",
        "details",
      ]);

      if (!title || !id) {
        continue;
      }

      results.push({
        id: `resource-${id}`,
        title,
        description:
          description ||
          "مصدر مفيد متاح على منصة TNU Hub.",
        category: "المصادر",
        to: "/resources",
        icon: BookOpen,
        source: "مصدر",
      });
    }
  } else if (resourcesResponse.error) {
    console.error(
      "Failed to load resources for search:",
      resourcesResponse.error,
    );
  }

  return results;
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function Explore() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const urlSearch =
    searchParams.get("search") ?? "";

  const [search, setSearch] =
    useState(urlSearch);

  const [activeCategory, setActiveCategory] =
    useState("الكل");

  const [databaseResults, setDatabaseResults] =
    useState<SearchResult[]>([]);

  const [databaseLoading, setDatabaseLoading] =
    useState(true);

  /* =======================================================
     LOAD SEARCHABLE CONTENT
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadSearchableContent = async () => {
      setDatabaseLoading(true);

      try {
        const results =
          await loadDatabaseSearchResults();

        if (!mounted) {
          return;
        }

        setDatabaseResults(results);
      } catch (error) {
        console.error(
          "Unexpected error while loading searchable content:",
          error,
        );

        if (mounted) {
          setDatabaseResults([]);
        }
      } finally {
        if (mounted) {
          setDatabaseLoading(false);
        }
      }
    };

    void loadSearchableContent();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     URL → INPUT
     ======================================================= */

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  /* =======================================================
     NORMALIZED SEARCH
     ======================================================= */

  const normalizedSearch =
    normalizeArabic(search);

  /* =======================================================
     STATIC SECTION SEARCH
     ======================================================= */

  const filteredSections = useMemo(() => {
    return sections.filter((section) => {
      const matchesCategory =
        activeCategory === "الكل" ||
        section.category === activeCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = normalizeArabic(
        [
          section.title,
          section.description,
          section.category,
          ...section.keywords,
        ].join(" "),
      );

      return searchableText.includes(
        normalizedSearch,
      );
    });
  }, [
    normalizedSearch,
    activeCategory,
  ]);

  /* =======================================================
     DATABASE RESULTS SEARCH
     ======================================================= */

  const filteredDatabaseResults =
    useMemo(() => {
      if (!normalizedSearch) {
        return [];
      }

      return databaseResults.filter(
        (result) => {
          const searchableText =
            normalizeArabic(
              [
                result.title,
                result.description,
                result.category,
                result.source,
              ].join(" "),
            );

          const matchesSearch =
            searchableText.includes(
              normalizedSearch,
            );

          const matchesCategory =
            activeCategory === "الكل" ||
            result.category ===
              activeCategory;

          return (
            matchesSearch &&
            matchesCategory
          );
        },
      );
    }, [
      databaseResults,
      normalizedSearch,
      activeCategory,
    ]);

  /* =======================================================
     COMBINED RESULTS
     ======================================================= */

  const combinedResults =
    useMemo(() => {
      if (!normalizedSearch) {
        return [];
      }

      const sectionResults: SearchResult[] =
        filteredSections.map(
          (section) => ({
            id: `section-${section.title}`,
            title: section.title,
            description:
              section.description,
            category:
              section.category,
            to: section.to,
            icon: section.icon,
            source: "قسم",
          }),
        );

      /*
       * نضع النتائج الحقيقية أولًا،
       * ثم الأقسام العامة.
       */
      return [
        ...filteredDatabaseResults,
        ...sectionResults,
      ];
    }, [
      normalizedSearch,
      filteredSections,
      filteredDatabaseResults,
    ]);

  /* =======================================================
     UPDATE SEARCH
     ======================================================= */

  const updateSearch = (
    value: string,
  ) => {
    setSearch(value);

    const nextParams =
      new URLSearchParams(
        searchParams,
      );

    const normalizedValue =
      value.trim();

    if (normalizedValue) {
      nextParams.set(
        "search",
        normalizedValue,
      );
    } else {
      nextParams.delete("search");
    }

    setSearchParams(
      nextParams,
      {
        replace: true,
      },
    );
  };

  /* =======================================================
     CLEAR SEARCH
     ======================================================= */

  const clearSearch = () => {
    updateSearch("");
  };

  /* =======================================================
     RESET FILTERS
     ======================================================= */

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("الكل");

    setSearchParams(
      {},
      {
        replace: true,
      },
    );
  };

  /* =======================================================
     FILTER STATE
     ======================================================= */

  const hasFilters =
    Boolean(search.trim()) ||
    activeCategory !== "الكل";

  /* =======================================================
     RESULT COUNT
     ======================================================= */

  const resultCount = normalizedSearch
    ? combinedResults.length
    : filteredSections.length;

  const resultLabel =
    resultCount === 0
      ? "لا توجد نتائج"
      : resultCount === 1
        ? "نتيجة واحدة"
        : `${resultCount} نتائج`;

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main
      className="page-shell explore-page"
      dir="rtl"
    >
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="page-hero explore-hero">
        <div className="explore-hero__content">
          <span className="page-kicker">
            اكتشف المنصة
          </span>

          <h1>
            كل ما تحتاجه
            <span> في مكان واحد.</span>
          </h1>

          <p>
            استكشف الخدمات والأقسام والمحتوى الذي
            تحتاجه خلال رحلتك الجامعية، من مكان واحد
            وبطريقة أبسط.
          </p>
        </div>

        <div
          className="explore-hero__meta"
          aria-label="عدد الأقسام الرئيسية"
        >
          <strong>
            {sections.length}
          </strong>

          <span>
            أقسام رئيسية
          </span>
        </div>
      </section>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <section className="explore-toolbar">
        <div className="explore-search">
          <Search
            className="explore-search__icon"
            size={20}
            aria-hidden="true"
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              updateSearch(
                event.target.value,
              )
            }
            placeholder="ابحث عن كلية، برنامج، فعالية، إعلان، مصدر..."
            aria-label="البحث في المنصة"
            autoComplete="off"
          />

          {search.trim() && (
            <button
              type="button"
              className="explore-search__clear"
              onClick={clearSearch}
              aria-label="مسح البحث"
            >
              <X
                size={17}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        <div
          className="explore-results"
          aria-live="polite"
        >
          {databaseLoading &&
          normalizedSearch ? (
            <>
              <strong>…</strong>

              <span>
                جاري البحث
              </span>
            </>
          ) : (
            <>
              <strong>
                {resultCount}
              </strong>

              <span>
                {resultLabel}
              </span>
            </>
          )}
        </div>
      </section>

      {/* =====================================================
          CATEGORIES
      ===================================================== */}

      <section
        className="explore-filters"
        aria-label="تصنيف المحتوى"
      >
        <div className="explore-filters__label">
          <span>
            تصفح حسب
          </span>
        </div>

        <div className="explore-filters__list">
          {categories.map(
            (category) => {
              const isActive =
                activeCategory ===
                category;

              return (
                <button
                  key={category}
                  type="button"
                  className={`explore-filter ${
                    isActive
                      ? "explore-filter--active"
                      : ""
                  }`}
                  onClick={() =>
                    setActiveCategory(
                      category,
                    )
                  }
                  aria-pressed={
                    isActive
                  }
                >
                  {category}
                </button>
              );
            },
          )}
        </div>
      </section>

      {/* =====================================================
          SEARCH RESULTS
      ===================================================== */}

      {normalizedSearch ? (
        <section className="explore-content">
          <div className="section-heading">
            <div>
              <span className="section-heading__eyebrow">
                نتائج البحث
              </span>

              <h2>
                نتائج البحث عن "
                {search.trim()}
                "
              </h2>
            </div>

            {hasFilters && (
              <button
                type="button"
                className="explore-reset"
                onClick={
                  resetFilters
                }
              >
                إعادة ضبط

                <X
                  size={15}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          {databaseLoading ? (
            <div className="explore-empty">
              <div className="explore-empty__icon">
                <Search
                  size={25}
                  aria-hidden="true"
                />
              </div>

              <h3>
                جاري البحث...
              </h3>

              <p>
                نبحث في محتوى المنصة والكليات
                والبرامج والإعلانات والفعاليات
                والمصادر.
              </p>
            </div>
          ) : combinedResults.length >
            0 ? (
            <div className="explore-grid">
              {combinedResults.map(
                (
                  result,
                  index,
                ) => {
                  const Icon =
                    result.icon;

                  return (
                    <Link
                      to={result.to}
                      className="explore-card"
                      key={result.id}
                      style={
                        {
                          "--explore-index":
                            index,
                        } as CSSProperties
                      }
                      aria-label={`فتح ${result.title}`}
                    >
                      <div className="explore-card__top">
                        <div className="explore-card__icon">
                          <Icon
                            size={23}
                            aria-hidden="true"
                          />
                        </div>

                        <span className="explore-card__category">
                          {result.source}
                        </span>
                      </div>

                      <div className="explore-card__body">
                        <h2>
                          {result.title}
                        </h2>

                        <p>
                          {result.description}
                        </p>
                      </div>

                      <span className="explore-card__action">
                        <span>
                          فتح النتيجة
                        </span>

                        <ArrowLeft
                          size={17}
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  );
                },
              )}
            </div>
          ) : (
            <div className="explore-empty">
              <div className="explore-empty__icon">
                <Search
                  size={25}
                  aria-hidden="true"
                />
              </div>

              <h3>
                لم نجد ما تبحث عنه
              </h3>

              <p>
                جرّب استخدام كلمة مختلفة
                أو ألغِ الفلاتر للبحث في
                جميع محتويات المنصة.
              </p>

              {hasFilters && (
                <div className="explore-empty__actions">
                  <button
                    type="button"
                    onClick={
                      resetFilters
                    }
                    className="button button--primary"
                  >
                    عرض كل النتائج
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      ) : (
        /* =====================================================
           NORMAL EXPLORE
        ===================================================== */

        <section className="explore-content">
          <div className="section-heading">
            <div>
              <span className="section-heading__eyebrow">
                الوصول السريع
              </span>

              <h2>
                {activeCategory ===
                "الكل"
                  ? "ماذا تريد أن تستكشف؟"
                  : activeCategory}
              </h2>
            </div>

            {hasFilters && (
              <button
                type="button"
                className="explore-reset"
                onClick={
                  resetFilters
                }
              >
                إعادة ضبط

                <X
                  size={15}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          {filteredSections.length >
          0 ? (
            <div className="explore-grid">
              {filteredSections.map(
                (
                  section,
                  index,
                ) => {
                  const Icon =
                    section.icon;

                  return (
                    <Link
                      to={section.to}
                      className="explore-card"
                      key={
                        section.title
                      }
                      style={
                        {
                          "--explore-index":
                            index,
                        } as CSSProperties
                      }
                      aria-label={`فتح قسم ${section.title}`}
                    >
                      <div className="explore-card__top">
                        <div className="explore-card__icon">
                          <Icon
                            size={23}
                            aria-hidden="true"
                          />
                        </div>

                        <span className="explore-card__category">
                          {
                            section.category
                          }
                        </span>
                      </div>

                      <div className="explore-card__body">
                        <h2>
                          {
                            section.title
                          }
                        </h2>

                        <p>
                          {
                            section.description
                          }
                        </p>
                      </div>

                      <span className="explore-card__action">
                        <span>
                          استكشف القسم
                        </span>

                        <ArrowLeft
                          size={17}
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  );
                },
              )}
            </div>
          ) : (
            <div className="explore-empty">
              <div className="explore-empty__icon">
                <Search
                  size={25}
                  aria-hidden="true"
                />
              </div>

              <h3>
                لا توجد أقسام
              </h3>

              <p>
                لا توجد أقسام متاحة ضمن
                التصنيف الحالي.
              </p>
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          HELP CTA
      ===================================================== */}

      <section className="explore-help">
        <div className="explore-help__icon">
          <CircleHelp
            size={23}
            aria-hidden="true"
          />
        </div>

        <div className="explore-help__content">
          <span>
            لم تجد ما تبحث عنه؟
          </span>

          <h2>
            مركز المساعدة موجود لمساعدتك.
          </h2>

          <p>
            ابحث عن إجابة لسؤالك أو أرسل
            طلب دعم إذا لم تجد ما تحتاجه.
          </p>
        </div>

        <Link
          to="/help"
          className="explore-help__action"
        >
          <span>
            افتح مركز المساعدة
          </span>

          <ArrowLeft
            size={17}
            aria-hidden="true"
          />
        </Link>
      </section>
    </main>
  );
}