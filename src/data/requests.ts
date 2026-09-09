export type RequestStatus = "قيد الانتظار" | "قيد المراجعة" | "تم الحل";

export interface StudentRequest {
  id: string;
  title: string;
  category: string;
  description: string;
  status: RequestStatus;
  createdAt: string;
}

export const requests: StudentRequest[] = [
  {
    id: "REQ-1001",
    title: "مشكلة في تسجيل المقررات",
    category: "الدعم الأكاديمي",
    description: "أحتاج إلى المساعدة في حل مشكلة ظهرت أثناء تسجيل المقررات.",
    status: "قيد المراجعة",
    createdAt: "اليوم",
  },
  {
    id: "REQ-1002",
    title: "استفسار عن الأنشطة الطلابية",
    category: "الأنشطة الطلابية",
    description: "أرغب في معرفة طريقة المشاركة في الأنشطة الطلابية.",
    status: "تم الحل",
    createdAt: "أمس",
  },
  {
    id: "REQ-1003",
    title: "مشكلة تقنية",
    category: "الدعم التقني",
    description: "أواجه مشكلة أثناء الدخول إلى إحدى الخدمات الطلابية.",
    status: "قيد الانتظار",
    createdAt: "منذ 3 أيام",
  },
];