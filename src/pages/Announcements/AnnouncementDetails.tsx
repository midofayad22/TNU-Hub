import {
  ArrowRight,
  Bell,
  CalendarDays,
  FileText,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import { useProfile } from "../../context/useProfile";
import { announcements } from "../../data/announcements";

export default function AnnouncementDetails() {
  const { id } = useParams();

  const { profile } = useProfile();

  const announcement = announcements.find(
    (item) => item.id === id
  );

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

          <h1>
            الإعلان غير موجود
          </h1>

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
    !target ||
    (
      (!target.faculty ||
        target.faculty === profile.faculty) &&
      (!target.program ||
        target.program === profile.program) &&
      (!target.academicYear ||
        target.academicYear ===
          profile.academicYear)
    );

  /*
   * إذا كان الإعلان مخصصًا لفئة معينة
   * لكنه لا يناسب الطالب الحالي.
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

          <h1>
            هذا الإعلان غير متاح لك
          </h1>

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

            <span>
              {announcement.category}
            </span>

            {announcement.target && (
              <span className="announcement-target-badge">
                مخصص لك
              </span>
            )}

            <time>
              <CalendarDays size={15} />
              {announcement.date}
            </time>

          </div>

        </header>

        {/* =====================================================
            TITLE
        ===================================================== */}

        <div className="announcement-details__title">

          <span className="announcement-details__eyebrow">
            {announcement.target
              ? "إعلان مخصص لك"
              : "إعلان للطلاب"}
          </span>

          <h1>
            {announcement.title}
          </h1>

          <p>
            {announcement.description}
          </p>

        </div>

        {/* =====================================================
            TARGET INFORMATION
        ===================================================== */}

        {announcement.target && (
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

          <h2>
            تفاصيل الإعلان
          </h2>

          <p>
            نحرص في منصة اتحاد الطلاب على إبقائك على اطلاع
            بأهم الأخبار والتحديثات المتعلقة بالحياة
            الطلابية.
          </p>

          <p>
            {announcement.description}
          </p>

          <div className="announcement-details__note">

            <div className="announcement-details__note-icon">
              <Bell size={18} />
            </div>

            <div>

              <strong>
                ابقَ على اطلاع
              </strong>

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
            تاريخ النشر: {announcement.date}
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