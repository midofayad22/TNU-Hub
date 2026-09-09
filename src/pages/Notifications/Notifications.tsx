import {
  Bell,
  CheckCircle2,
  CheckCheck,
  Info,
  Megaphone,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

type NotificationType = "announcement" | "request" | "event";

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
  read: boolean;
}

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "تم نشر إعلان جديد",
    description: "مرحبًا بكم في العام الدراسي الجديد.",
    time: "منذ ساعة",
    type: "announcement",
    read: false,
  },
  {
    id: 2,
    title: "تم تحديث طلبك",
    description: "طلبك REQ-1001 أصبح قيد المراجعة.",
    time: "منذ 3 ساعات",
    type: "request",
    read: false,
  },
  {
    id: 3,
    title: "فعالية جديدة",
    description: "تمت إضافة فعالية جديدة إلى قائمة الفعاليات.",
    time: "أمس",
    type: "event",
    read: true,
  },
];

const notificationIcons = {
  announcement: Megaphone,
  request: CheckCircle2,
  event: Info,
};

export default function Notifications() {
  const [items, setItems] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return items.filter((item) => !item.read);
    }

    return items;
  }, [items, filter]);

  const markAsRead = (id: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, read: true }
          : item
      )
    );
  };

  const markAllAsRead = () => {
    setItems((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      }))
    );
  };

  const deleteNotification = (id: number) => {
    setItems((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  return (
    <main className="page-shell notifications-page" dir="rtl">
      {/* Header */}
      <section className="notifications-header">
        <div>
          <span className="page-kicker">
            التحديثات
          </span>

          <h1>الإشعارات</h1>

          <p>
            آخر التنبيهات والتحديثات الخاصة بك.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="notifications-mark-all"
            onClick={markAllAsRead}
          >
            <CheckCheck size={17} />
            تعليم الكل كمقروء
          </button>
        )}
      </section>

      {/* Summary */}
      <section className="notifications-summary">
        <div className="notifications-summary__icon">
          <Bell size={20} />
        </div>

        <div>
          <strong>
            {unreadCount === 0
              ? "لا توجد إشعارات جديدة"
              : `${unreadCount} إشعار غير مقروء`}
          </strong>

          <p>
            سنعرض هنا أهم التحديثات المتعلقة بحسابك
            وطلباتك والفعاليات.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="notifications-toolbar">
        <div className="notifications-filters">
          <button
            type="button"
            className={
              filter === "all"
                ? "notification-filter notification-filter--active"
                : "notification-filter"
            }
            onClick={() => setFilter("all")}
          >
            الكل
            <span>{items.length}</span>
          </button>

          <button
            type="button"
            className={
              filter === "unread"
                ? "notification-filter notification-filter--active"
                : "notification-filter"
            }
            onClick={() => setFilter("unread")}
          >
            غير مقروء
            <span>{unreadCount}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {filteredNotifications.length > 0 ? (
        <section className="notifications-list">
          {filteredNotifications.map((notification) => {
            const Icon =
              notificationIcons[notification.type];

            return (
              <article
                key={notification.id}
                className={`notification-card ${
                  !notification.read
                    ? "notification-card--unread"
                    : ""
                }`}
                onClick={() =>
                  markAsRead(notification.id)
                }
              >
                <div className="notification-icon">
                  <Icon size={19} />
                </div>

                <div className="notification-content">
                  <div className="notification-content__top">
                    <h2>{notification.title}</h2>

                    {!notification.read && (
                      <span className="notification-unread-dot" />
                    )}
                  </div>

                  <p>{notification.description}</p>

                  <span className="notification-time">
                    {notification.time}
                  </span>
                </div>

                <button
                  type="button"
                  className="notification-delete"
                  aria-label="حذف الإشعار"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="notifications-empty">
          <div className="notifications-empty__icon">
            <Bell size={27} />
          </div>

          <h2>
            {filter === "unread"
              ? "لا توجد إشعارات غير مقروءة"
              : "لا توجد إشعارات"}
          </h2>

          <p>
            عندما تصل إليك تحديثات جديدة ستظهر هنا.
          </p>
        </section>
      )}
    </main>
  );
}