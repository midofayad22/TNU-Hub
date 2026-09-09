import {
  ArrowLeft,
  BookOpen,
  FileText,
  GraduationCap,
  Laptop,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type ResourceCategory =
  | "الكل"
  | "أدلة الطلاب"
  | "أكاديمي"
  | "إرشادات"
  | "أنظمة";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: Exclude<ResourceCategory, "الكل">;
  icon: typeof GraduationCap;
}

const resources: Resource[] = [
  {
    id: "student-guide",
    title: "دليل الطالب",
    description:
      "دليل يساعدك على فهم أهم الخدمات والإجراءات التي تحتاجها خلال حياتك الجامعية.",
    category: "أدلة الطلاب",
    icon: GraduationCap,
  },
  {
    id: "academic-resources",
    title: "المصادر الأكاديمية",
    description:
      "مجموعة من المصادر والأدوات التي تساعدك في دراستك وتطوير مستواك الأكاديمي.",
    category: "أكاديمي",
    icon: BookOpen,
  },
  {
    id: "guides",
    title: "الأدلة والإرشادات",
    description:
      "إرشادات مختصرة تساعدك على فهم الخدمات والأنظمة والإجراءات المختلفة.",
    category: "إرشادات",
    icon: FileText,
  },
  {
    id: "online-systems",
    title: "الأنظمة الإلكترونية",
    description:
      "الوصول السريع إلى الأنظمة والمنصات الإلكترونية التي يستخدمها الطلاب.",
    category: "أنظمة",
    icon: Laptop,
  },
];

const categories: ResourceCategory[] = [
  "الكل",
  "أدلة الطلاب",
  "أكاديمي",
  "إرشادات",
  "أنظمة",
];

export default function Resources() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<ResourceCategory>("الكل");

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesSearch =
        !query ||
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.category.toLowerCase().includes(query);

      const matchesCategory =
        activeCategory === "الكل" ||
        resource.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const clearSearch = () => {
    setSearch("");
  };

  const hasFilters =
    search.trim() !== "" ||
    activeCategory !== "الكل";

  return (
    <main className="page-shell resources-page" dir="rtl">
      {/* Header */}
      <section className="resources-header">
        <div>
          <span className="page-kicker">تعلم واستخدم</span>

          <h1>المصادر</h1>

          <p>
            مجموعة منظمة من الأدلة والمصادر والأدوات
            المفيدة خلال رحلتك الجامعية.
          </p>
        </div>

        <div className="resources-header__icon">
          <BookOpen size={29} />
        </div>
      </section>

      {/* Search */}
      <section className="resources-toolbar">
        <div className="resources-search">
          <Search size={19} />

          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="ابحث عن مصدر أو دليل..."
            aria-label="البحث في المصادر"
          />

          {search && (
            <button
              type="button"
              className="resources-search__clear"
              onClick={clearSearch}
              aria-label="مسح البحث"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <span className="resources-count">
          {filteredResources.length} مصدر
        </span>
      </section>

      {/* Filters */}
      <section className="resources-filters">
        <span className="resources-filter-label">
          التصنيف
        </span>

        <div className="resources-filter-list">
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

      {/* Content */}
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
            {filteredResources.length} من {resources.length}
          </span>
        </div>

        {filteredResources.length > 0 ? (
          <div className="resource-grid">
            {filteredResources.map(
              (resource, index) => {
                const Icon = resource.icon;

                return (
                  <article
                    className="resource-card"
                    key={resource.id}
                    style={
                      {
                        "--resource-index": index,
                      } as React.CSSProperties
                    }
                  >
                    <div className="resource-card__top">
                      <div className="resource-card__icon">
                        <Icon size={23} />
                      </div>

                      <span className="resource-card__category">
                        {resource.category}
                      </span>
                    </div>

                    <div className="resource-card__body">
                      <h2>{resource.title}</h2>

                      <p>
                        {resource.description}
                      </p>
                    </div>

                    <div className="resource-card__footer">
                      <button
                        type="button"
                        className="resource-card__action"
                        onClick={() => {
                          // سيتم ربط المصدر الحقيقي هنا لاحقًا.
                        }}
                      >
                        استكشاف
                        <ArrowLeft size={16} />
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
          <div className="resources-empty">
            <div className="resources-empty__icon">
              <Search size={25} />
            </div>

            <h3>لم نجد مصادر مطابقة</h3>

            <p>
              جرّب استخدام كلمة مختلفة أو غيّر التصنيف
              لعرض المزيد من المصادر.
            </p>

            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setSearch("");
                setActiveCategory("الكل");
              }}
            >
              مسح الفلاتر
            </button>
          </div>
        )}
      </section>

      {/* Bottom note */}
      <section className="resources-note">
        <div className="resources-note__icon">
          <BookOpen size={20} />
        </div>

        <div>
          <strong>المصادر ستتوسع باستمرار</strong>

          <p>
            سيتم إضافة المزيد من الأدلة والمراجع والروابط
            المفيدة للطلاب مع تطور المنصة.
          </p>
        </div>
      </section>
    </main>
  );
}