import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Megaphone,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
  adminQuickActions,
  adminStats,
  recentActivities,
} from "../../data/admin";

function getActivityIcon(type: string) {
  switch (type) {
    case "announcement":
      return <Megaphone size={18} />;

    case "event":
      return <CalendarDays size={18} />;

    case "request":
      return <ClipboardList size={18} />;

    case "student":
      return <Users size={18} />;

    default:
      return <CheckCircle2 size={18} />;
  }
}

export default function AdminDashboard() {
  return (
    <div className="admin-page" dir="rtl">
      {/* Header */}
      <section className="admin-page__header">
        <div>
          <span className="admin-page__kicker">
            لوحة الإدارة
          </span>

          <h1>مرحبًا بك في لوحة التحكم</h1>

          <p>
            تابع نشاط المنصة وأدر المحتوى والخدمات
            الطلابية من مكان واحد.
          </p>
        </div>

        <div className="admin-page__header-actions">
          <Link
            to="/admin/announcements/new"
            className="admin-primary-button"
          >
            <Plus size={18} />
            <span>إضافة إعلان</span>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="admin-stats-grid">
        {adminStats.map((stat) => (
          <article
            className="admin-stat-card"
            key={stat.id}
          >
            <div className="admin-stat-card__top">
              <span>{stat.label}</span>

              <div className="admin-stat-card__icon">
                {stat.id === "students" && (
                  <Users size={19} />
                )}

                {stat.id === "announcements" && (
                  <Megaphone size={19} />
                )}

                {stat.id === "events" && (
                  <CalendarDays size={19} />
                )}

                {stat.id === "requests" && (
                  <ClipboardList size={19} />
                )}
              </div>
            </div>

            <div className="admin-stat-card__value">
              {stat.value}
            </div>

            <div className="admin-stat-card__bottom">
              <span
                className={`admin-stat-card__change admin-stat-card__change--${stat.trend}`}
              >
                {stat.trend === "up" && (
                  <TrendingUp size={14} />
                )}

                {stat.change}
              </span>

              <span>{stat.description}</span>
            </div>
          </article>
        ))}
      </section>

      {/* Main grid */}
      <section className="admin-dashboard-grid">
        {/* Recent activity */}
        <div className="admin-panel admin-panel--activity">
          <div className="admin-panel__header">
            <div>
              <span className="admin-panel__kicker">
                النشاط
              </span>

              <h2>آخر النشاطات</h2>
            </div>

            <button
              type="button"
              className="admin-panel__view-all"
            >
              عرض الكل
              <ArrowLeft size={15} />
            </button>
          </div>

          <div className="admin-activity-list">
            {recentActivities.map((activity) => (
              <article
                className="admin-activity"
                key={activity.id}
              >
                <div className="admin-activity__icon">
                  {getActivityIcon(activity.type)}
                </div>

                <div className="admin-activity__content">
                  <strong>{activity.title}</strong>

                  <p>{activity.description}</p>

                  <span>
                    <Clock3 size={13} />
                    {activity.date}
                  </span>
                </div>

                {activity.status === "pending" && (
                  <span className="admin-status admin-status--pending">
                    قيد المراجعة
                  </span>
                )}

                {activity.status === "new" && (
                  <span className="admin-status admin-status--new">
                    جديد
                  </span>
                )}

                {activity.status === "completed" && (
                  <span className="admin-status admin-status--completed">
                    مكتمل
                  </span>
                )}
              </article>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <span className="admin-panel__kicker">
                إجراءات سريعة
              </span>

              <h2>ماذا تريد أن تفعل؟</h2>
            </div>
          </div>

          <div className="admin-quick-actions">
            {adminQuickActions.map((action) => (
              <Link
                key={action.id}
                to={action.href}
                className="admin-quick-action"
              >
                <div className="admin-quick-action__icon">
                  {action.id === "announcement" && (
                    <Megaphone size={19} />
                  )}

                  {action.id === "event" && (
                    <CalendarDays size={19} />
                  )}

                  {action.id === "request" && (
                    <ClipboardList size={19} />
                  )}
                </div>

                <div>
                  <strong>{action.label}</strong>
                  <span>{action.description}</span>
                </div>

                <ArrowLeft size={17} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}