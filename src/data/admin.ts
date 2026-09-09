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
  type: "announcement" | "event" | "request" | "student";
  title: string;
  description: string;
  date: string;
  status?: "new" | "pending" | "completed";
}

export const adminStats: AdminStat[] = [
  {
    id: "students",
    label: "الطلاب",
    value: "2,486",
    change: "+12.5%",
    trend: "up",
    description: "مقارنة بالشهر الماضي",
  },
  {
    id: "announcements",
    label: "الإعلانات",
    value: "48",
    change: "+8",
    trend: "up",
    description: "إعلانًا هذا الشهر",
  },
  {
    id: "events",
    label: "الفعاليات",
    value: "24",
    change: "+4",
    trend: "up",
    description: "فعالية قادمة",
  },
  {
    id: "requests",
    label: "الطلبات",
    value: "137",
    change: "23",
    trend: "neutral",
    description: "طلبًا يحتاج للمراجعة",
  },
];

export const recentActivities: AdminActivity[] = [
  {
    id: "ACT-001",
    type: "announcement",
    title: "تم نشر إعلان جديد",
    description: "مرحبًا بكم في العام الدراسي الجديد",
    date: "منذ 20 دقيقة",
    status: "completed",
  },
  {
    id: "ACT-002",
    type: "event",
    title: "تمت إضافة فعالية",
    description: "مقدمة في تطوير الويب",
    date: "منذ ساعة",
    status: "completed",
  },
  {
    id: "ACT-003",
    type: "request",
    title: "طلب جديد يحتاج للمراجعة",
    description: "طلب دعم أكاديمي",
    date: "منذ ساعتين",
    status: "pending",
  },
  {
    id: "ACT-004",
    type: "student",
    title: "طالب جديد",
    description: "تم تسجيل طالب جديد في المنصة",
    date: "منذ 3 ساعات",
    status: "new",
  },
];

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