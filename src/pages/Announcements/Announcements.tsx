import {
  Bell,
  ChevronLeft,
  Filter,
  LoaderCircle,
  Megaphone,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useProfile } from "../../context/useProfile";
import { supabase } from "../../lib/supabase";

interface AnnouncementTarget {
  faculty?: string;
  program?: string;
  academicYear?: string;
}

interface Announcement {
  id: string;
  title: string;
  category: string;
  content: string;
  date: string;
  target: AnnouncementTarget | null;
  status: "منشور" | "مسودة";
  created_at: string;
  updated_at: string;
}

const categories = [
  "الكل",
  "أكاديمي",
  "الحياة الطلابية",
  "مهم",
  "أنشطة",
];

const formatDate = (date: string) => {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
};

const hasTarget = (
  target: AnnouncementTarget | null
) => {
  if (!target) {
    return false;
  }

  return Boolean(
    target.faculty ||
      target.program ||
      target.academicYear
  );
};

export default function Announcements() {
  const { profile } = useProfile();

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState("الكل");

  const [announcements, setAnnouncements] = useState<
    Announcement[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } =
        await supabase
          .from("announcements")
          .select(
            `
              id,
              title,
              category,
              content,
              date,
              target,
              status,
              created_at,
              updated_at
            `
          )
          .eq("status", "منشور")
          .order("date", { ascending: false })
          .order("created_at", {
            ascending: false,
          });

      if (fetchError) {
        throw fetchError;
      }

      const normalizedAnnouncements: Announcement[] =
        (data ?? []).map((announcement) => ({
          id: announcement.id,
          title: announcement.title,
          category: announcement.category,
          content: announcement.content,
          date: announcement.date,
          target:
            announcement.target &&
            typeof announcement.target === "object"
              ? (announcement.target as AnnouncementTarget)
              : null,
          status:
            announcement.status as
              | "منشور"
              | "مسودة",
          created_at: announcement.created_at,
          updated_at: announcement.updated_at,
        }));

      setAnnouncements(normalizedAnnouncements);
    } catch (err) {
      console.error(
        "Error loading announcements:",
        err
      );

      setError(
        "تعذر تحميل الإعلانات. حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnnouncements();
  }, []);

  /*
   * تحديد هل الإعلان موجه للطالب الحالي أم لا
   */
  const matchesStudent = (
    announcement: Announcement
  ) => {
    const target = announcement.target;

    /*
     * لا يوجد target أو target فارغ
     * = إعلان عام يظهر لجميع الطلاب.
     */
    if (!hasTarget(target)) {
      return true;
    }

    /*
     * لو الإعلان موجه لكلية
     * يجب أن تطابق كلية الطالب.
     */
    if (
      target?.faculty &&
      target.faculty !== profile.faculty
    ) {
      return false;
    }

    /*
     * لو الإعلان موجه لبرنامج
     * يجب أن يطابق برنامج الطالب.
     */
    if (
      target?.program &&
      target.program !== profile.program
    ) {
      return false;
    }

    /*
     * لو الإعلان موجه لسنة دراسية
     * يجب أن تطابق سنة الطالب.
     */
    if (
      target?.academicYear &&
      target.academicYear !==
        profile.academicYear
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
        announcement.content,
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
    announcements,
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
    filteredAnnouncements.filter((announcement) =>
      hasTarget(announcement.target)
    );

  /*
   * الإعلان المميز:
   * حاليًا نستخدم أحدث إعلان كإعلان مميز.
   */
  const featuredAnnouncement =
    filteredAnnouncements[0] ?? null;

  /*
   * باقي الإعلانات
   */
  const regularAnnouncements =
    filteredAnnouncements.filter(
      (announcement) =>
        announcement.id !==
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
            آخر الأخبار والتنبيهات والمعلومات المهمة
            الخاصة بالطلاب.
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
          ERROR
      ===================================================== */}

      {error && (
        <section
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <span>{error}</span>

          <button
            type="button"
            className="admin-alert__retry"
            onClick={() =>
              void loadAnnouncements()
            }
          >
            إعادة المحاولة
          </button>
        </section>
      )}

      {/* =====================================================
          PERSONALIZED NOTICE
      ===================================================== */}

      {!loading &&
        personalizedAnnouncements.length > 0 &&
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
            {loading
              ? "..."
              : filteredAnnouncements.length}
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

          {!loading && (
            <button
              type="button"
              className="button button--ghost"
              onClick={() =>
                void loadAnnouncements()
              }
              aria-label="تحديث الإعلانات"
              title="تحديث الإعلانات"
            >
              <RefreshCw size={17} />
              <span>تحديث</span>
            </button>
          )}
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="announcements-empty">
            <div className="announcements-empty__icon">
              <LoaderCircle
                size={24}
                className="admin-spin"
              />
            </div>

            <h3>
              جاري تحميل الإعلانات
            </h3>

            <p>
              يتم الآن جلب أحدث الإعلانات من المنصة.
            </p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          /* =================================================
              EMPTY
          ================================================= */

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

            {(search ||
              activeCategory !== "الكل") && (
              <button
                type="button"
                className="button button--primary"
                onClick={clearFilters}
              >
                عرض جميع الإعلانات
              </button>
            )}
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

                    {hasTarget(
                      featuredAnnouncement.target
                    ) && (
                      <span className="announcement-target-badge">
                        مخصص لك
                      </span>
                    )}

                    <time>
                      {formatDate(
                        featuredAnnouncement.date
                      )}
                    </time>
                  </div>

                  <h2>
                    {featuredAnnouncement.title}
                  </h2>

                  <p>
                    {featuredAnnouncement.content}
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

            {regularAnnouncements.length > 0 && (
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

                          {hasTarget(
                            announcement.target
                          ) && (
                            <span className="announcement-target-badge">
                              مخصص لك
                            </span>
                          )}

                          <time>
                            {formatDate(
                              announcement.date
                            )}
                          </time>
                        </div>

                        <h2>
                          {announcement.title}
                        </h2>

                        <p>
                          {announcement.content}
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
            )}
          </>
        )}
      </section>
    </main>
  );
}