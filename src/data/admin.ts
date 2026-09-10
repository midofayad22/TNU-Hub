export interface AdminStat {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  description: string;
}

export interface AdminActivity {
  id: string;
  type:
    | "announcement"
    | "event"
    | "request"
    | "student";
  title: string;
  description: string;
  date: string;
  status?:
    | "new"
    | "pending"
    | "completed";
}

/*
 * Admin Quick Actions
 *
 * These are navigation actions, not mock data.
 * They can safely remain static.
 */
export const adminQuickActions = [
  {
    id: "announcement",
    label: "إضافة إعلان",
    description: "نشر إعلان جديد للطلاب",
    href: "/admin/announcements/new",
  },
  {
    id: "event",
    label: "إضافة فعالية",
    description: "إنشاء فعالية طلابية جديدة",
    href: "/admin/events/new",
  },
  {
    id: "request",
    label: "مراجعة الطلبات",
    description: "عرض الطلبات المعلقة",
    href: "/admin/requests",
  },
];