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
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

type ExploreSection = {
  title: string;
  description: string;
  icon: typeof GraduationCap;
  to: string;
  category: string;
  keywords: string[];
};

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
      "تخصصات",
      "دراسة",
      "أكاديمي",
      "تخصص",
      "تعليم",
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
      "أنشطة",
      "ورش",
      "مسابقات",
      "أحداث",
      "طلاب",
      "نشاط",
      "حدث",
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
      "تنبيهات",
      "مستجدات",
      "أخبار الجامعة",
      "خبر",
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
      "أدلة",
      "ملفات",
      "مراجع",
      "تعلم",
      "معلومات",
      "كتب",
      "دليل",
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
      "مجتمع",
      "حياة جامعية",
      "أنشطة",
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

export default function Explore() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const urlSearch = searchParams.get("search") ?? "";

  const [search, setSearch] =
    useState(urlSearch);

  const [activeCategory, setActiveCategory] =
    useState("الكل");

  const normalizedSearch =
    search.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    return sections.filter((section) => {
      const matchesCategory =
        activeCategory === "الكل" ||
        section.category === activeCategory;

      if (!normalizedSearch) {
        return matchesCategory;
      }

      const searchableText = [
        section.title,
        section.description,
        section.category,
        ...section.keywords,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesCategory &&
        searchableText.includes(normalizedSearch)
      );
    });
  }, [
    normalizedSearch,
    activeCategory,
  ]);

  const updateSearch = (value: string) => {
    setSearch(value);

    const nextParams =
      new URLSearchParams(searchParams);

    if (value.trim()) {
      nextParams.set(
        "search",
        value.trim(),
      );
    } else {
      nextParams.delete("search");
    }

    setSearchParams(nextParams, {
      replace: true,
    });
  };

  const clearSearch = () => {
    updateSearch("");
  };

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("الكل");

    setSearchParams(
      {},
      { replace: true },
    );
  };

  const hasFilters =
    Boolean(search.trim()) ||
    activeCategory !== "الكل";

  return (
    <main
      className="page-shell explore-page"
      dir="rtl"
    >
      {/* Hero */}
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

      {/* Search */}
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
            placeholder="ابحث عن كلية، فعالية، إعلان، مساعدة..."
            aria-label="البحث في أقسام المنصة"
            autoComplete="off"
          />

          {search && (
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
          <strong>
            {filteredSections.length}
          </strong>

          <span>
            {filteredSections.length === 1
              ? "نتيجة"
              : "نتائج"}
          </span>
        </div>
      </section>

      {/* Categories */}
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

      {/* Content */}
      <section className="explore-content">
        <div className="section-heading">
          <div>
            <span className="section-heading__eyebrow">
              الوصول السريع
            </span>

            <h2>
              {search.trim()
                ? `نتائج البحث عن "${search.trim()}"`
                : activeCategory ===
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
              لم نجد ما تبحث عنه
            </h3>

            <p>
              جرّب استخدام كلمة مختلفة
              أو ألغِ الفلاتر للبحث في
              جميع أقسام المنصة.
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
                  عرض كل الأقسام
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Help CTA */}
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