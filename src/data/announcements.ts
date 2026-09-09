export type AnnouncementCategory =
  | "أكاديمي"
  | "الحياة الطلابية"
  | "مهم"
  | "أنشطة";

export interface AnnouncementTarget {
  faculty?: string;
  program?: string;
  academicYear?: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  category: AnnouncementCategory;
  date: string;
  featured?: boolean;

  /**
   * إذا لم توجد target فهذا إعلان عام
   */
  target?: AnnouncementTarget;
}

export const announcements: Announcement[] = [
  {
    id: "ANN-001",
    title: "مرحبًا بكم في العام الدراسي الجديد",
    description:
      "ابقَ على اطلاع بآخر الأخبار والأنشطة والفعاليات والخدمات الطلابية.",
    category: "مهم",
    date: "8 سبتمبر 2026",
    featured: true,
  },

  {
    id: "ANN-002",
    title: "فتح باب التسجيل في الأنشطة الطلابية",
    description:
      "يمكن للطلاب الآن استكشاف الأنشطة المتاحة والانضمام إلى اللجان التي تهمهم.",
    category: "أنشطة",
    date: "7 سبتمبر 2026",
  },

  {
    id: "ANN-003",
    title: "مركز الدعم الأكاديمي متاح الآن",
    description:
      "يمكن للطلاب استخدام مركز المساعدة لطرح الأسئلة وإرسال طلبات الدعم.",
    category: "أكاديمي",
    date: "6 سبتمبر 2026",
  },

  {
    id: "ANN-004",
    title: "إضافة مصادر جديدة للطلاب",
    description:
      "تمت إضافة مجموعة من المصادر والأدلة المفيدة لمساعدتك خلال رحلتك الجامعية.",
    category: "الحياة الطلابية",
    date: "5 سبتمبر 2026",
  },

  {
    id: "ANN-005",
    title: "أنشطة اتحاد الطلاب",
    description:
      "اكتشف الأنشطة والفرص القادمة وشارك في الحياة الطلابية.",
    category: "أنشطة",
    date: "4 سبتمبر 2026",
  },

  /*
   * مثال على إعلان مخصص لكلية:
   *
   * {
   *   id: "ANN-006",
   *   title: "إعلان خاص بطلاب كلية الهندسة",
   *   description:
   *     "هذا الإعلان مخصص لطلاب كلية الهندسة.",
   *   category: "أكاديمي",
   *   date: "9 سبتمبر 2026",
   *   target: {
   *     faculty: "كلية الهندسة",
   *   },
   * },
   */

  /*
   * مثال على إعلان مخصص لبرنامج وسنة:
   *
   * {
   *   id: "ANN-007",
   *   title: "إعلان لطلاب هندسة الحاسب - العام الأول",
   *   description:
   *     "هذا الإعلان مخصص لطلاب هندسة الحاسب في العام الأول.",
   *   category: "أكاديمي",
   *   date: "9 سبتمبر 2026",
   *   target: {
   *     faculty: "كلية الهندسة",
   *     program: "هندسة الحاسب",
   *     academicYear: "العام الأول",
   *   },
   * },
   */
];