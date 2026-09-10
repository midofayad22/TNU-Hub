import {
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  Info,
  Megaphone,
  Trash2,
} from "lucide-react";

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
    [items],
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
          : item,
      ),
    );
  };

  const markAllAsRead = () => {
    if (unreadCount === 0) return;

    setItems((current) =>
      current.map((item) => ({
        ...item,
        read: true,
      })),
    );
  };

  const deleteNotification = (id: number) => {
    setItems((current) =>
      current.filter((item) => item.id !== id),
    );
  };

  return (
    <main className="page-shell notifications-page" dir="rtl">
      <section className="notifications-header">
        <div className="notifications-header__content">
          <span className="page-kicker">التحديثات</span>

          <div className="notifications-header__title-row">
            <div className="notifications-header__title-icon">
              <Bell size={21} aria-hidden="true" />
            </div>

            <h1>الإشعارات</h1>

            {unreadCount > 0 && (
              <span className="notifications-header__badge">
                {unreadCount} جديد
              </span>
            )}
          </div>

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
            <CheckCheck size={17} aria-hidden="true" />
            <span>تعليم الكل كمقروء</span>
          </button>
        )}
      </section>

      <section className="notifications-summary" aria-label="ملخص الإشعارات">
        <div className="notifications-summary__icon">
          <Bell size={20} aria-hidden="true" />
        </div>

        <div className="notifications-summary__content">
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

        <div
          className={`notifications-summary__status ${
            unreadCount > 0
              ? "notifications-summary__status--active"
              : ""
          }`}
          aria-hidden="true"
        >
          <span />
        </div>
      </section>

      <div className="notifications-toolbar">
        <div
          className="notifications-filters"
          role="tablist"
          aria-label="تصفية الإشعارات"
        >
          <button
            type="button"
            role="tab"
            aria-selected={filter === "all"}
            className={
              filter === "all"
                ? "notification-filter notification-filter--active"
                : "notification-filter"
            }
            onClick={() => setFilter("all")}
          >
            <span>الكل</span>
            <strong>{items.length}</strong>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filter === "unread"}
            className={
              filter === "unread"
                ? "notification-filter notification-filter--active"
                : "notification-filter"
            }
            onClick={() => setFilter("unread")}
          >
            <span>غير مقروء</span>
            <strong>{unreadCount}</strong>
          </button>
        </div>

        <span className="notifications-toolbar__count">
          {filteredNotifications.length}{" "}
          {filteredNotifications.length === 1
            ? "إشعار"
            : "إشعارات"}
        </span>
      </div>

      {filteredNotifications.length > 0 ? (
        <section
          className="notifications-list"
          aria-label="قائمة الإشعارات"
        >
          {filteredNotifications.map((notification, index) => {
            const Icon = notificationIcons[notification.type];

            return (
              <article
                key={notification.id}
                className={`notification-card ${
                  !notification.read
                    ? "notification-card--unread"
                    : ""
                }`}
                style={
                  {
                    "--notification-index": index,
                  } as CSSProperties
                }
              >
                <button
                  type="button"
                  className="notification-card__main"
                  onClick={() => markAsRead(notification.id)}
                  aria-label={
                    notification.read
                      ? `فتح ${notification.title}`
                      : `تعليم ${notification.title} كمقروء`
                  }
                >
                  <div
                    className={`notification-icon notification-icon--${notification.type}`}
                  >
                    <Icon size={19} aria-hidden="true" />
                  </div>

                  <div className="notification-content">
                    <div className="notification-content__top">
                      <h2>{notification.title}</h2>

                      {!notification.read && (
                        <span
                          className="notification-unread-dot"
                          aria-label="غير مقروء"
                        />
                      )}
                    </div>

                    <p>{notification.description}</p>

                    <span className="notification-time">
                      {notification.time}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className="notification-delete"
                  aria-label={`حذف ${notification.title}`}
                  onClick={() =>
                    deleteNotification(notification.id)
                  }
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="notifications-empty">
          <div className="notifications-empty__icon">
            <Bell size={27} aria-hidden="true" />
          </div>

          <span className="notifications-empty__eyebrow">
            {filter === "unread"
              ? "كل شيء محدث"
              : "صندوق الإشعارات"}
          </span>

          <h2>
            {filter === "unread"
              ? "لا توجد إشعارات غير مقروءة"
              : "لا توجد إشعارات"}
          </h2>

          <p>
            عندما تصل إليك تحديثات جديدة ستظهر هنا.
          </p>

          {filter === "unread" && items.length > 0 && (
            <button
              type="button"
              className="notifications-empty__action"
              onClick={() => setFilter("all")}
            >
              عرض كل الإشعارات
            </button>
          )}
        </section>
      )}
    </main>
  );
}