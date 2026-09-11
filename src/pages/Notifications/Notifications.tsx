import {
  useEffect,
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
  Package,
  ShieldAlert,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

import {
  deleteNotification as deleteNotificationFromDb,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem as DatabaseNotification,
} from "../../services/notifications";

type NotificationType =
  | "announcement"
  | "request"
  | "event"
  | "resource"
  | "admin_request"
  | "system"
  | string;

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  time: string;
  type: NotificationType;
  read: boolean;
}

const notificationIcons: Record<
  string,
  typeof Bell
> = {
  announcement: Megaphone,
  request: CheckCircle2,
  event: Info,
  resource: Package,
  admin_request: ShieldAlert,
  system: Bell,
};

function formatNotificationTime(createdAt: string) {
  const date = new Date(createdAt);
  const now = new Date();

  const diffInSeconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000,
  );

  if (diffInSeconds < 60) {
    return "منذ لحظات";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);

  if (diffInMinutes < 60) {
    return `منذ ${diffInMinutes} دقيقة`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `منذ ${diffInHours} ساعة`;
  }

  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays === 1) {
    return "أمس";
  }

  if (diffInDays < 7) {
    return `منذ ${diffInDays} أيام`;
  }

  return date.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapDatabaseNotification(
  notification: DatabaseNotification,
): NotificationItem {
  return {
    id: notification.id,
    title: notification.title,
    description: notification.message,
    time: formatNotificationTime(notification.created_at),
    type: notification.type,
    read: notification.is_read,
  };
}

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(
    null,
  );
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * ID الإشعار الذي وصل لحظيًا عبر Realtime.
   * نستخدمه فقط لتشغيل animation للإشعار الجديد.
   */
  const [realtimeNotificationId, setRealtimeNotificationId] =
    useState<number | null>(null);

  /*
   * تحميل الإشعارات من Supabase
   */
  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getMyNotifications();

      setItems(data.map(mapDatabaseNotification));
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error,
      );

      setError(
        "تعذر تحميل الإشعارات حاليًا. حاول مرة أخرى.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * تحميل الإشعارات عند فتح الصفحة
   */
  useEffect(() => {
    void loadNotifications();
  }, []);

  /*
   * Realtime:
   * الاستماع لأي إشعار جديد يصل للمستخدم الحالي
   */
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null =
      null;

    let isMounted = true;

    const subscribeToNotifications = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "Failed to get current user for notifications:",
            userError,
          );
          return;
        }

        if (!user || !isMounted) {
          return;
        }

        channel = supabase
          .channel(`notifications-user-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (!isMounted) {
                return;
              }

              const newNotification =
                payload.new as DatabaseNotification;

              const mappedNotification =
                mapDatabaseNotification(newNotification);

              setItems((current) => {
                /*
                 * منع تكرار الإشعار
                 */
                const alreadyExists = current.some(
                  (item) =>
                    item.id === mappedNotification.id,
                );

                if (alreadyExists) {
                  return current;
                }

                /*
                 * إضافة الإشعار الجديد في بداية القائمة
                 */
                return [
                  mappedNotification,
                  ...current,
                ];
              });

              /*
               * تشغيل animation لهذا الإشعار فقط
               */
              setRealtimeNotificationId(
                mappedNotification.id,
              );

              /*
               * إزالة حالة الـRealtime بعد انتهاء الـanimation
               */
              window.setTimeout(() => {
                if (!isMounted) {
                  return;
                }

                setRealtimeNotificationId((current) =>
                  current === mappedNotification.id
                    ? null
                    : current,
                );
              }, 600);
            },
          )
          .subscribe((status) => {
            if (!isMounted) {
              return;
            }

            if (status === "SUBSCRIBED") {
              console.log(
                "Notifications Realtime connected.",
              );
            }

            if (status === "CHANNEL_ERROR") {
              console.error(
                "Notifications Realtime channel error.",
              );
            }

            if (status === "TIMED_OUT") {
              console.error(
                "Notifications Realtime connection timed out.",
              );
            }
          });
      } catch (error) {
        console.error(
          "Failed to subscribe to notifications:",
          error,
        );
      }
    };

    void subscribeToNotifications();

    /*
     * تنظيف الاشتراك عند مغادرة الصفحة
     */
    return () => {
      isMounted = false;

      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  /*
   * حساب عدد الإشعارات غير المقروءة
   */
  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items],
  );

  /*
   * تطبيق الفلتر
   */
  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return items.filter((item) => !item.read);
    }

    return items;
  }, [items, filter]);

  /*
   * تعليم إشعار واحد كمقروء
   */
  const markAsRead = async (id: number) => {
    const notification = items.find(
      (item) => item.id === id,
    );

    if (!notification || notification.read) {
      return;
    }

    try {
      setActionLoading(id);

      await markNotificationAsRead(id);

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                read: true,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error,
      );

      setError(
        "تعذر تحديث حالة الإشعار.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * تعليم جميع الإشعارات كمقروءة
   */
  const markAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) {
      return;
    }

    try {
      setMarkingAll(true);
      setError(null);

      await markAllNotificationsAsRead();

      setItems((current) =>
        current.map((item) => ({
          ...item,
          read: true,
        })),
      );
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error,
      );

      setError(
        "تعذر تعليم الإشعارات كمقروءة.",
      );
    } finally {
      setMarkingAll(false);
    }
  };

  /*
   * حذف إشعار
   */
  const deleteNotification = async (id: number) => {
    try {
      setActionLoading(id);
      setError(null);

      await deleteNotificationFromDb(id);

      setItems((current) =>
        current.filter((item) => item.id !== id),
      );
    } catch (error) {
      console.error(
        "Failed to delete notification:",
        error,
      );

      setError(
        "تعذر حذف الإشعار.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main
      className="page-shell notifications-page"
      dir="rtl"
    >
      <section className="notifications-header">
        <div className="notifications-header__content">
          <span className="page-kicker">
            التحديثات
          </span>

          <div className="notifications-header__title-row">
            <div className="notifications-header__title-icon">
              <Bell
                size={21}
                aria-hidden="true"
              />
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
            onClick={() => void markAllAsRead()}
            disabled={markingAll}
          >
            <CheckCheck
              size={17}
              aria-hidden="true"
            />

            <span>
              {markingAll
                ? "جاري التحديث..."
                : "تعليم الكل كمقروء"}
            </span>
          </button>
        )}
      </section>

      {error && (
        <div
          className="notifications-error"
          role="alert"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadNotifications()}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      <section
        className="notifications-summary"
        aria-label="ملخص الإشعارات"
      >
        <div className="notifications-summary__icon">
          <Bell
            size={20}
            aria-hidden="true"
          />
        </div>

        <div className="notifications-summary__content">
          <strong>
            {loading
              ? "جاري تحميل الإشعارات..."
              : unreadCount === 0
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

      {loading ? (
        <section
          className="notifications-list"
          aria-label="جاري تحميل الإشعارات"
          aria-busy="true"
        >
          {[1, 2, 3].map((item) => (
            <article
              key={item}
              className="notification-card notification-card--loading"
            >
              <div className="notification-card__main">
                <div className="notification-icon">
                  <Bell
                    size={19}
                    aria-hidden="true"
                  />
                </div>

                <div className="notification-content">
                  <div className="notification-content__top">
                    <h2>جاري تحميل الإشعار...</h2>
                  </div>

                  <p>
                    يتم تحميل آخر التحديثات الخاصة بك.
                  </p>

                  <span className="notification-time">
                    لحظات...
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : filteredNotifications.length > 0 ? (
        <section
          className="notifications-list"
          aria-label="قائمة الإشعارات"
        >
          {filteredNotifications.map(
            (notification, index) => {
              const Icon =
                notificationIcons[
                  notification.type
                ] ?? Bell;

              const isActionLoading =
                actionLoading === notification.id;

              const isRealtimeNotification =
                notification.id ===
                realtimeNotificationId;

              return (
                <article
                  key={notification.id}
                  className={`notification-card ${
                    !notification.read
                      ? "notification-card--unread"
                      : ""
                  } ${
                    isRealtimeNotification
                      ? "notification-card--realtime"
                      : ""
                  }`}
                  style={
                    {
                      "--notification-index":
                        index,
                    } as CSSProperties
                  }
                >
                  <button
                    type="button"
                    className="notification-card__main"
                    onClick={() =>
                      void markAsRead(
                        notification.id,
                      )
                    }
                    disabled={isActionLoading}
                    aria-label={
                      notification.read
                        ? `فتح ${notification.title}`
                        : `تعليم ${notification.title} كمقروء`
                    }
                  >
                    <div
                      className={`notification-icon notification-icon--${notification.type}`}
                    >
                      <Icon
                        size={19}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="notification-content">
                      <div className="notification-content__top">
                        <h2>
                          {notification.title}
                        </h2>

                        {!notification.read && (
                          <span
                            className="notification-unread-dot"
                            aria-label="غير مقروء"
                          />
                        )}
                      </div>

                      <p>
                        {notification.description}
                      </p>

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
                      void deleteNotification(
                        notification.id,
                      )
                    }
                    disabled={isActionLoading}
                  >
                    <Trash2
                      size={16}
                      aria-hidden="true"
                    />
                  </button>
                </article>
              );
            },
          )}
        </section>
      ) : (
        <section className="notifications-empty">
          <div className="notifications-empty__icon">
            <Bell
              size={27}
              aria-hidden="true"
            />
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

          {filter === "unread" &&
            items.length > 0 && (
              <button
                type="button"
                className="notifications-empty__action"
                onClick={() =>
                  setFilter("all")
                }
              >
                عرض كل الإشعارات
              </button>
            )}
        </section>
      )}
    </main>
  );
}