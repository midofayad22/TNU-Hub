import {
  ArrowRight,
  Bell,
  CalendarDays,
  FileText,
  LoaderCircle,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

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

export default function AnnouncementDetails() {
  const { id } = useParams();
  const { profile } = useProfile();

  const [announcement, setAnnouncement] =
    useState<Announcement | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const loadAnnouncement = async () => {
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
            .eq("id", id)
            .eq("status", "منشور")
            .single();

        if (fetchError) {
          if (fetchError.code === "PGRST116") {
            setAnnouncement(null);
            return;
          }

          throw fetchError;
        }

        if (!data) {
          setAnnouncement(null);
          return;
        }

        setAnnouncement({
          id: data.id,
          title: data.title,
          category: data.category,
          content: data.content,
          date: data.date,
          target:
            data.target &&
            typeof data.target === "object"
              ? (data.target as AnnouncementTarget)
              : null,
          status:
            data.status as
              | "منشور"
              | "مسودة",
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      } catch (err) {
        console.error(
          "Error loading announcement:",
          err
        );

        setError(
          "تعذر تحميل الإعلان. حاول مرة أخرى."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadAnnouncement();
  }, [id]);

  /*
   * Loading
   */
  if (loading) {
    return (
      <main
        className="page-shell announcement-details-page"
        dir="rtl"
      >
        <div className="empty-state details-not-found">
          <div className="details-not-found__icon">
            <LoaderCircle
              size={30}
              className="admin-spin"
            />
          </div>

          <h1>جاري تحميل الإعلان</h1>

          <p>
            يتم الآن جلب بيانات الإعلان من المنصة.
          </p>
        </div>
      </main>
    );
  }

  /*
   * Error
   */
  if (error) {
    return (
      <main
        className="page-shell announcement-details-page"
        dir="rtl"
      >
        <Link
          to="/announcements"
          className="back-link"
        >
          <ArrowRight size={17} />
          العودة إلى الإعلانات
        </Link>

        <div className="empty-state details-not-found">
          <div className="details-not-found__icon">
            <Bell size={30} />
          </div>

          <h1>حدث خطأ</h1>

          <p>{error}</p>

          <button
            type="button"
            className="button button--primary"
            onClick={() => window.location.reload()}
          >
            إعادة المحاولة
          </button>
        </div>
      </main>
    );
  }

  /*
   * الإعلان غير موجود
   */
  if (!announcement) {
    return (
      <main
        className="page-shell announcement-details-page"
        dir="rtl"
      >
        <div className="empty-state details-not-found">
          <div className="details-not-found__icon">
            <Bell size={30} />
          </div>

          <h1>الإعلان غير موجود</h1>

          <p>
            لم نتمكن من العثور على الإعلان الذي تبحث عنه.
          </p>

          <Link
            to="/announcements"
            className="button button--primary"
          >
            العودة إلى الإعلانات
          </Link>
        </div>
      </main>
    );
  }

  /*
   * التحقق من صلاحية الإعلان للطالب
   */
  const target = announcement.target;

  const isTargetedToCurrentStudent =
    !hasTarget(target) ||
    (
      (!target?.faculty ||
        target.faculty === profile.faculty) &&
      (!target?.program ||
        target.program === profile.program) &&
      (!target?.academicYear ||
        target.academicYear ===
          profile.academicYear)
    );

  /*
   * الإعلان مخصص لفئة أخرى
   */
  if (!isTargetedToCurrentStudent) {
    return (
      <main
        className="page-shell announcement-details-page"
        dir="rtl"
      >
        <Link
          to="/announcements"
          className="back-link"
        >
          <ArrowRight size={17} />
          العودة إلى الإعلانات
        </Link>

        <div className="empty-state details-not-found">
          <div className="details-not-found__icon">
            <Bell size={30} />
          </div>

          <h1>هذا الإعلان غير متاح لك</h1>

          <p>
            هذا الإعلان مخصص لفئة أخرى من الطلاب.
          </p>

          <Link
            to="/announcements"
            className="button button--primary"
          >
            عرض الإعلانات المتاحة لك
          </Link>
        </div>
      </main>
    );
  }

  const targeted = hasTarget(target);

  return (
    <main
      className="page-shell announcement-details-page"
      dir="rtl"
    >
      <Link
        to="/announcements"
        className="back-link"
      >
        <ArrowRight size={17} />
        العودة إلى الإعلانات
      </Link>

      <article className="announcement-details-card">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="announcement-details__header">
          <div className="announcement-details__icon">
            <FileText size={25} />
          </div>

          <div className="announcement-details__meta">
            <span>{announcement.category}</span>

            {targeted && (
              <span className="announcement-target-badge">
                مخصص لك
              </span>
            )}

            <time dateTime={announcement.date}>
              <CalendarDays size={15} />
              {formatDate(announcement.date)}
            </time>
          </div>
        </header>

        {/* =====================================================
            TITLE
        ===================================================== */}

        <div className="announcement-details__title">
          <span className="announcement-details__eyebrow">
            {targeted
              ? "إعلان مخصص لك"
              : "إعلان للطلاب"}
          </span>

          <h1>{announcement.title}</h1>

          <p>{announcement.content}</p>
        </div>

        {/* =====================================================
            TARGET INFORMATION
        ===================================================== */}

        {targeted && (
          <div className="announcement-details__target">
            <div className="announcement-details__target-icon">
              <Bell size={18} />
            </div>

            <div>
              <strong>
                هذا الإعلان موجه إليك
              </strong>

              <p>
                تم عرض هذا الإعلان بناءً على بياناتك
                الأكاديمية.
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            BODY
        ===================================================== */}

        <div className="announcement-details__body">
          <h2>تفاصيل الإعلان</h2>

          <p>
            نحرص في منصة اتحاد الطلاب على إبقائك على اطلاع
            بأهم الأخبار والتحديثات المتعلقة بالحياة
            الطلابية.
          </p>

          <p>{announcement.content}</p>

          <div className="announcement-details__note">
            <div className="announcement-details__note-icon">
              <Bell size={18} />
            </div>

            <div>
              <strong>ابقَ على اطلاع</strong>

              <p>
                تابع الإعلانات القادمة لمعرفة آخر الأخبار
                والأنشطة والفرص المتاحة للطلاب.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="announcement-details__footer">
          <span>
            تاريخ النشر:{" "}
            {formatDate(announcement.date)}
          </span>

          <Link
            to="/announcements"
            className="announcement-details__back"
          >
            جميع الإعلانات
            <ArrowRight size={15} />
          </Link>
        </footer>
      </article>
    </main>
  );
}