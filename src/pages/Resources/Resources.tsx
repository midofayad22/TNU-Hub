import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  FileText,
  GraduationCap,
  Laptop,
  Loader2,
  Search,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import { supabase } from "../../lib/supabase";

type ResourceCategory =
  | "الكل"
  | "أدلة الطلاب"
  | "أكاديمي"
  | "إرشادات"
  | "أنظمة";

interface Resource {
  id: number;
  title: string;
  description: string;
  category: Exclude<ResourceCategory, "الكل">;
  icon: string;
}

const categories: ResourceCategory[] = [
  "الكل",
  "أدلة الطلاب",
  "أكاديمي",
  "إرشادات",
  "أنظمة",
];

const iconMap = {
  GraduationCap,
  BookOpen,
  FileText,
  Laptop,
} as const;

const getResourceIcon = (iconName: string) => {
  return (
    iconMap[iconName as keyof typeof iconMap] ??
    BookOpen
  );
};

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<ResourceCategory>("الكل");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const { data, error: supabaseError } = await supabase
      .from("resources")
      .select(
        "id, title, description, category, icon"
      )
      .order("created_at", {
        ascending: false,
      });

    if (supabaseError) {
      console.error(
        "Failed to load resources:",
        supabaseError
      );

      setResources([]);
      setError(
        "تعذر تحميل المصادر حاليًا. حاول مرة أخرى."
      );
      setIsLoading(false);
      return;
    }

    setResources(
      (data ?? []) as Resource[]
    );

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesSearch =
        !query ||
        resource.title
          .toLowerCase()
          .includes(query) ||
        resource.description
          .toLowerCase()
          .includes(query) ||
        resource.category
          .toLowerCase()
          .includes(query);

      const matchesCategory =
        activeCategory === "الكل" ||
        resource.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [resources, search, activeCategory]);

  const clearFilters = () => {
    setSearch("");
    setActiveCategory("الكل");
  };

  const clearSearch = () => {
    setSearch("");
  };

  const hasFilters =
    Boolean(search.trim()) ||
    activeCategory !== "الكل";

  return (
    <main
      className="page-shell resources-page"
      dir="rtl"
    >
      {/* =========================================
          HEADER
          ========================================= */}

      <section className="resources-header">
        <div className="resources-header__content">
          <span className="page-kicker">
            تعلم واستخدم
          </span>

          <div className="resources-header__title-row">
            <div className="resources-header__icon">
              <BookOpen
                size={24}
                aria-hidden="true"
              />
            </div>

            <h1>المصادر</h1>
          </div>

          <p>
            مجموعة منظمة من الأدلة والمصادر والأدوات
            المفيدة خلال رحلتك الجامعية.
          </p>
        </div>

        <div
          className="resources-header__visual"
          aria-hidden="true"
        >
          <BookOpen
            size={54}
            strokeWidth={1.35}
          />
        </div>
      </section>

      {/* =========================================
          SEARCH & COUNT
          ========================================= */}

      <section className="resources-toolbar">
        <div className="resources-search">
          <Search
            className="resources-search__icon"
            size={19}
            aria-hidden="true"
          />

          <input
            id="resources-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="ابحث عن مصدر أو دليل..."
            aria-label="البحث في المصادر"
            autoComplete="off"
          />

          {search && (
            <button
              type="button"
              className="resources-search__clear"
              onClick={clearSearch}
              aria-label="مسح البحث"
            >
              <X
                size={16}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        <span
          className="resources-count"
          aria-live="polite"
        >
          {filteredResources.length}{" "}
          {filteredResources.length === 1
            ? "مصدر"
            : "مصادر"}
        </span>
      </section>

      {/* =========================================
          CATEGORIES
          ========================================= */}

      <section
        className="resources-filters"
        aria-label="تصفية المصادر حسب التصنيف"
      >
        <div className="resources-filter-heading">
          <span className="resources-filter-label">
            التصنيف
          </span>

          {hasFilters && (
            <button
              type="button"
              className="resources-filter-reset"
              onClick={clearFilters}
            >
              إعادة ضبط
            </button>
          )}
        </div>

        <div
          className="resources-filter-list"
          role="group"
          aria-label="تصنيفات المصادر"
        >
          {categories.map((category) => {
            const isActive =
              activeCategory === category;

            return (
              <button
                type="button"
                key={category}
                className={`resources-filter ${
                  isActive
                    ? "resources-filter--active"
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

      {/* =========================================
          CONTENT
          ========================================= */}

      <section className="resources-content">
        <div className="resources-section-heading">
          <div>
            <span>مكتبة الطلاب</span>

            <h2>
              {hasFilters
                ? "نتائج البحث والتصفية"
                : "كل المصادر"}
            </h2>
          </div>

          <span>
            {filteredResources.length} من{" "}
            {resources.length}
          </span>
        </div>

        {/* =========================================
            LOADING
            ========================================= */}

        {isLoading ? (
          <div className="resources-empty">
            <div
              className="resources-empty__icon"
              aria-hidden="true"
            >
              <Loader2
                size={25}
                className="resources-loading-icon"
              />
            </div>

            <span className="resources-empty__eyebrow">
              جاري التحميل
            </span>

            <h3>جاري تحميل المصادر</h3>

            <p>
              لحظات ونجهز لك أحدث المصادر والأدلة
              المتاحة على المنصة.
            </p>
          </div>
        ) : error ? (
          /* =========================================
             ERROR
             ========================================= */

          <div className="resources-empty">
            <div
              className="resources-empty__icon"
              aria-hidden="true"
            >
              <AlertCircle
                size={25}
              />
            </div>

            <span className="resources-empty__eyebrow">
              حدث خطأ
            </span>

            <h3>تعذر تحميل المصادر</h3>

            <p>{error}</p>

            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                void loadResources();
              }}
            >
              المحاولة مرة أخرى
            </button>
          </div>
        ) : filteredResources.length > 0 ? (
          /* =========================================
             RESOURCE GRID
             ========================================= */

          <div className="resource-grid">
            {filteredResources.map(
              (resource, index) => {
                const Icon = getResourceIcon(
                  resource.icon
                );

                return (
                  <article
                    className="resource-card"
                    key={resource.id}
                    style={
                      {
                        "--resource-index": index,
                      } as CSSProperties
                    }
                  >
                    <div className="resource-card__top">
                      <div
                        className="resource-card__icon"
                        aria-hidden="true"
                      >
                        <Icon size={23} />
                      </div>

                      <span className="resource-card__category">
                        {resource.category}
                      </span>
                    </div>

                    <div className="resource-card__body">
                      <h2>
                        {resource.title}
                      </h2>

                      <p>
                        {resource.description}
                      </p>
                    </div>

                    <div className="resource-card__footer">
                      <button
                        type="button"
                        className="resource-card__action"
                        disabled
                        aria-label={`${resource.title} — قريبًا`}
                      >
                        <span>
                          استكشاف
                        </span>

                        <ArrowLeft
                          size={16}
                          aria-hidden="true"
                        />
                      </button>

                      <span className="resource-card__status">
                        قريبًا
                      </span>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        ) : (
          /* =========================================
             EMPTY SEARCH RESULT
             ========================================= */

          <div className="resources-empty">
            <div
              className="resources-empty__icon"
              aria-hidden="true"
            >
              <Search size={25} />
            </div>

            <span className="resources-empty__eyebrow">
              لا توجد نتائج
            </span>

            <h3>
              لم نجد مصادر مطابقة
            </h3>

            <p>
              جرّب استخدام كلمة مختلفة أو غيّر
              التصنيف لعرض المزيد من المصادر.
            </p>

            <button
              type="button"
              className="button button--secondary"
              onClick={clearFilters}
            >
              مسح الفلاتر
            </button>
          </div>
        )}
      </section>

      {/* =========================================
          BOTTOM NOTE
          ========================================= */}

      <section className="resources-note">
        <div
          className="resources-note__icon"
          aria-hidden="true"
        >
          <BookOpen size={20} />
        </div>

        <div>
          <strong>
            المصادر ستتوسع باستمرار
          </strong>

          <p>
            سيتم إضافة المزيد من الأدلة والمراجع
            والروابط المفيدة للطلاب مع تطور المنصة.
          </p>
        </div>
      </section>
    </main>
  );
}