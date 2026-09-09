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
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

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
    description: "استكشف الكليات والبرامج الأكاديمية وتعرّف على تخصصاتها.",
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
    ],
  },
  {
    title: "الفعاليات",
    description: "اكتشف الأنشطة والورش والمسابقات والفعاليات القادمة.",
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
    ],
  },
  {
    title: "الإعلانات",
    description: "تابع آخر الأخبار والتنبيهات والمستجدات المهمة.",
    icon: Bell,
    to: "/announcements",
    category: "المستجدات",
    keywords: [
      "إعلانات",
      "أخبار",
      "تنبيهات",
      "مستجدات",
      "أخبار الجامعة",
    ],
  },
  {
    title: "مركز المساعدة",
    description: "ابحث عن إجابة أو احصل على الدعم عندما تحتاج إليه.",
    icon: CircleHelp,
    to: "/help",
    category: "الدعم",
    keywords: [
      "مساعدة",
      "دعم",
      "أسئلة",
      "مشكلة",
      "استفسار",
      "faq",
    ],
  },
  {
    title: "المصادر",
    description: "الوصول إلى الأدلة والمصادر المفيدة خلال رحلتك الجامعية.",
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
    ],
  },
  {
    title: "الحياة الطلابية",
    description: "شارك في الأنشطة وتعرّف على الفرص والمجتمع الطلابي.",
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
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");

  const filteredSections = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

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
        matchesCategory && searchableText.includes(normalizedSearch)
      );
    });
  }, [search, activeCategory]);

  const clearSearch = () => {
    setSearch("");
  };

  return (
    <main className="page-shell explore-page" dir="rtl">
      {/* Hero */}
      <section className="page-hero explore-hero">
        <div className="explore-hero__content">
          <span className="page-kicker">اكتشف المنصة</span>

          <h1>استكشف</h1>

          <p>
            كل ما تحتاجه في حياتك الجامعية، من الأكاديميات والفعاليات
            إلى الدعم والمصادر، في مكان واحد.
          </p>
        </div>

        <div className="explore-hero__meta">
          <strong>{sections.length}</strong>
          <span>أقسام رئيسية</span>
        </div>
      </section>

      {/* Search */}
      <section className="explore-toolbar">
        <div className="explore-search">
          <Search size={20} />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث عن كلية، فعالية، مساعدة، مصدر..."
            aria-label="البحث في أقسام المنصة"
          />

          {search && (
            <button
              type="button"
              className="explore-search__clear"
              onClick={clearSearch}
              aria-label="مسح البحث"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <div className="explore-results">
          <strong>{filteredSections.length}</strong>
          <span>
            {filteredSections.length === 1
              ? "نتيجة"
              : "نتائج متاحة"}
          </span>
        </div>
      </section>

      {/* Categories */}
      <section className="explore-filters" aria-label="تصنيف المحتوى">
        <div className="explore-filters__label">
          <span>تصفية حسب</span>
        </div>

        <div className="explore-filters__list">
          {categories.map((category) => {
            const isActive = activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                className={`explore-filter ${
                  isActive ? "explore-filter--active" : ""
                }`}
                onClick={() => setActiveCategory(category)}
                aria-pressed={isActive}
              >
                {category}
              </button>
            );
          })}
        </div>
      </section>

      {/* Section heading */}
      <section className="explore-content">
        <div className="section-heading">
          <div>
            <span className="section-heading__eyebrow">
              الوصول السريع
            </span>

            <h2>
              {search
                ? `نتائج البحث عن "${search}"`
                : activeCategory === "الكل"
                  ? "ماذا تريد أن تستكشف؟"
                  : activeCategory}
            </h2>
          </div>
        </div>

        {filteredSections.length > 0 ? (
          <div className="explore-grid">
            {filteredSections.map((section, index) => {
              const Icon = section.icon;

              return (
                <Link
                  to={section.to}
                  className="explore-card"
                  key={section.title}
                  style={
                    {
                      "--explore-index": index,
                    } as React.CSSProperties
                  }
                >
                  <div className="explore-card__top">
                    <div className="explore-card__icon">
                      <Icon size={23} />
                    </div>

                    <span className="explore-card__category">
                      {section.category}
                    </span>
                  </div>

                  <div className="explore-card__body">
                    <h2>{section.title}</h2>

                    <p>{section.description}</p>
                  </div>

                  <span className="explore-card__action">
                    <span>استكشف القسم</span>
                    <ArrowLeft size={17} />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="explore-empty">
            <div className="explore-empty__icon">
              <Search size={25} />
            </div>

            <h3>لم نجد ما تبحث عنه</h3>

            <p>
              جرّب استخدام كلمة مختلفة أو ألغِ الفلاتر للبحث في
              جميع أقسام المنصة.
            </p>

            <div className="explore-empty__actions">
              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="button button--primary"
                >
                  مسح البحث
                </button>
              )}

              {activeCategory !== "الكل" && (
                <button
                  type="button"
                  onClick={() => setActiveCategory("الكل")}
                  className="button button--secondary"
                >
                  عرض كل الأقسام
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Help CTA */}
      <section className="explore-help">
        <div className="explore-help__icon">
          <CircleHelp size={23} />
        </div>

        <div className="explore-help__content">
          <span>تحتاج مساعدة في الوصول لشيء معين؟</span>

          <h2>مركز المساعدة موجود لمساعدتك.</h2>

          <p>
            ابحث عن إجابة لسؤالك أو أرسل طلب دعم إذا لم تجد ما
            تحتاجه.
          </p>
        </div>

        <Link to="/help" className="explore-help__action">
          افتح مركز المساعدة
          <ArrowLeft size={17} />
        </Link>
      </section>
    </main>
  );
}