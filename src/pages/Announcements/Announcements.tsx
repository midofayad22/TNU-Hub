import {
  Bell,
  ChevronLeft,
  Filter,
  Megaphone,
  Search,
  X,
} from "lucide-react";

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useProfile } from "../../context/useProfile";
import { announcements } from "../../data/announcements";

const categories = [
  "الكل",
  "أكاديمي",
  "الحياة الطلابية",
  "مهم",
  "أنشطة",
];

export default function Announcements() {
  const { profile } = useProfile();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState("الكل");

  /*
   * تحديد هل الإعلان موجه للطالب الحالي أم لا
   */
  const matchesStudent = (
    announcement: (typeof announcements)[number]
  ) => {
    const target = announcement.target;

    /*
     * إذا لم يوجد target
     * فهذا إعلان عام ويظهر للجميع.
     */
    if (!target) {
      return true;
    }

    /*
     * لو الإعلان موجه لكلية
     * يجب أن تطابق كلية الطالب.
     */
    if (
      target.faculty &&
      target.faculty !== profile.faculty
    ) {
      return false;
    }

    /*
     * لو الإعلان موجه لبرنامج
     * يجب أن يطابق برنامج الطالب.
     */
    if (
      target.program &&
      target.program !== profile.program
    ) {
      return false;
    }

    /*
     * لو الإعلان موجه لسنة دراسية
     * يجب أن تطابق سنة الطالب.
     */
    if (
      target.academicYear &&
      target.academicYear !== profile.academicYear
    ) {
      return false;
    }

    return true;
  };

  const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return announcements.filter((announcement) => {
      const matchesTarget =
        matchesStudent(announcement);

      const matchesCategory =
        activeCategory === "الكل" ||
        announcement.category === activeCategory;

      const searchableText = [
        announcement.title,
        announcement.description,
        announcement.category,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchableText.includes(query);

      return (
        matchesTarget &&
        matchesCategory &&
        matchesSearch
      );
    });
  }, [
    search,
    activeCategory,
    profile.faculty,
    profile.program,
    profile.academicYear,
  ]);

  /*
   * الإعلانات المخصصة للطالب فقط
   */
  const personalizedAnnouncements =
    filteredAnnouncements.filter(
      (announcement) => Boolean(announcement.target)
    );

  /*
   * الإعلان المميز
   */
  const featuredAnnouncement =
    filteredAnnouncements.find(
      (item) => item.featured
    ) ?? null;

  /*
   * باقي الإعلانات
   */
  const regularAnnouncements =
    filteredAnnouncements.filter(
      (item) =>
        item.id !==
        featuredAnnouncement?.id
    );

  const clearFilters = () => {
    setSearch("");
    setActiveCategory("الكل");
  };

  return (
    <main
      className="page-shell announcements-page"
      dir="rtl"
    >
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="page-hero announcements-hero">

        <div>
          <span className="page-kicker">
            ابقَ على اطلاع
          </span>

          <h1>الإعلانات</h1>

          <p>
            آخر الأخبار والتنبيهات والمعلومات المهمة الخاصة
            بالطلاب.
          </p>

          {profile.name.trim() && (
            <p className="announcements-personal-note">
              الإعلانات المعروضة لك تتناسب مع بياناتك
              الأكاديمية.
            </p>
          )}
        </div>

        <div className="page-hero__icon">
          <Bell size={30} />
        </div>

      </section>

      {/* =====================================================
          PERSONALIZED NOTICE
      ===================================================== */}

      {personalizedAnnouncements.length > 0 &&
        profile.faculty && (
          <section className="announcements-personalized">

            <div className="announcements-personalized__icon">
              <Bell size={19} />
            </div>

            <div>
              <strong>
                إعلانات مخصصة لك
              </strong>

              <p>
                توجد إعلانات مرتبطة بكليتك أو برنامجك أو
                سنتك الدراسية.
              </p>
            </div>

          </section>
        )}

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <section className="announcements-toolbar">

        <div className="announcements-search">

          <Search size={19} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="ابحث في الإعلانات..."
            aria-label="البحث في الإعلانات"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="مسح البحث"
              className="announcements-search__clear"
            >
              <X size={16} />
            </button>
          )}

        </div>

        <div className="announcements-count">

          <strong>
            {filteredAnnouncements.length}
          </strong>

          <span>إعلان</span>

        </div>

      </section>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <section className="announcements-filters">

        <div className="announcements-filters__label">

          <Filter size={15} />

          <span>التصنيف</span>

        </div>

        <div className="announcements-filters__list">

          {categories.map((category) => {

            const isActive =
              activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                className={`announcements-filter ${
                  isActive
                    ? "announcements-filter--active"
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
          RESULTS
      ===================================================== */}

      <section className="announcements-content">

        <div className="section-heading section-heading--with-action">

          <div>

            <span className="section-heading__eyebrow">
              آخر المستجدات
            </span>

            <h2>
              {search ||
              activeCategory !== "الكل"
                ? "نتائج الإعلانات"
                : "آخر الإعلانات"}
            </h2>

          </div>

        </div>

        {filteredAnnouncements.length === 0 ? (
          <div className="announcements-empty">

            <div className="announcements-empty__icon">
              <Search size={24} />
            </div>

            <h3>
              لم نجد أي إعلانات
            </h3>

            <p>
              جرّب كلمة بحث مختلفة أو ألغِ التصنيف الحالي
              لعرض جميع الإعلانات.
            </p>

            <button
              type="button"
              className="button button--primary"
              onClick={clearFilters}
            >
              عرض جميع الإعلانات
            </button>

          </div>
        ) : (
          <>
            {/* =================================================
                FEATURED
            ================================================= */}

            {featuredAnnouncement && (
              <Link
                to={`/announcements/${featuredAnnouncement.id}`}
                className="announcement-featured"
              >

                <div className="announcement-featured__icon">
                  <Megaphone size={24} />
                </div>

                <div className="announcement-featured__content">

                  <div className="announcement-featured__meta">

                    <span>
                      {featuredAnnouncement.category}
                    </span>

                    {featuredAnnouncement.target && (
                      <span className="announcement-target-badge">
                        مخصص لك
                      </span>
                    )}

                    <time>
                      {featuredAnnouncement.date}
                    </time>

                  </div>

                  <h2>
                    {featuredAnnouncement.title}
                  </h2>

                  <p>
                    {featuredAnnouncement.description}
                  </p>

                  <span className="announcement-featured__action">
                    قراءة الإعلان
                    <ChevronLeft size={17} />
                  </span>

                </div>

              </Link>
            )}

            {/* =================================================
                LIST
            ================================================= */}

            <div className="announcement-list">

              {regularAnnouncements.map(
                (announcement) => (
                  <Link
                    to={`/announcements/${announcement.id}`}
                    className="announcement-card"
                    key={announcement.id}
                  >

                    <div className="announcement-card__icon">
                      <Megaphone size={20} />
                    </div>

                    <div className="announcement-card__content">

                      <div className="announcement-card__meta">

                        <span>
                          {announcement.category}
                        </span>

                        {announcement.target && (
                          <span className="announcement-target-badge">
                            مخصص لك
                          </span>
                        )}

                        <time>
                          {announcement.date}
                        </time>

                      </div>

                      <h2>
                        {announcement.title}
                      </h2>

                      <p>
                        {announcement.description}
                      </p>

                      <span className="announcement-card__link">
                        قراءة الإعلان
                        <ChevronLeft size={15} />
                      </span>

                    </div>

                  </Link>
                )
              )}

            </div>
          </>
        )}

      </section>

    </main>
  );
}