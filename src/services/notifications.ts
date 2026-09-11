import { supabase } from "../lib/supabase";

export type NotificationType =
  | "announcement"
  | "request"
  | "event"
  | "resource"
  | "admin_request"
  | "system";

export interface NotificationItem {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

/**
 * جلب إشعارات المستخدم الحالي
 */
export async function getMyNotifications(): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, user_id, title, message, type, is_read, created_at",
    )
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch notifications:", error);
    throw error;
  }

  return (data ?? []) as NotificationItem[];
}


/**
 * تعليم إشعار واحد كمقروء
 */
export async function markNotificationAsRead(
  notificationId: number,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", notificationId)
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

  if (error) {
    console.error(
      "Failed to mark notification as read:",
      error,
    );

    throw error;
  }
}


/**
 * تعليم كل إشعارات المستخدم كمقروءة
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error(
      "Failed to mark all notifications as read:",
      error,
    );

    throw error;
  }
}


/**
 * حذف إشعار واحد
 */
export async function deleteNotification(
  notificationId: number,
): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    console.error(
      "Failed to delete notification:",
      error,
    );

    throw error;
  }
}