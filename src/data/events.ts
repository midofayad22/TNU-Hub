export type EventCategory =
  | "ورشة عمل"
  | "مسابقة"
  | "اجتماعي"
  | "أكاديمي";

export interface EventTarget {
  faculty?: string;
  program?: string;
  academicYear?: string;
}

export interface StudentEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  time: string;
  location: string;
  attendees: number;
  featured?: boolean;
  target?: EventTarget;
}

export const events: StudentEvent[] = [
  {
    id: "EVT-001",
    title: "يوم استقبال الطلاب",
    description:
      "تعرّف على الطلاب الجدد، واكتشف الأنشطة الطلابية وتعرف على الحياة الجامعية.",
    category: "اجتماعي",
    date: "20 سبتمبر 2026",
    time: "10:00 صباحًا",
    location: "الحرم الجامعي",
    attendees: 120,
    featured: true,
  },

  {
    id: "EVT-002",
    title: "مقدمة في تطوير الويب",
    description:
      "ورشة عملية للتعرف على أساسيات تطوير الويب الحديث.",
    category: "ورشة عمل",
    date: "22 سبتمبر 2026",
    time: "12:00 ظهرًا",
    location: "مبنى الهندسة",
    attendees: 60,

    // مثال لفعالية مخصصة لكلية الهندسة
    target: {
      faculty: "كلية الهندسة",
    },
  },

  {
    id: "EVT-003",
    title: "مسابقة البرمجة",
    description:
      "اختبر مهاراتك في البرمجة وتنافس مع زملائك من الطلاب.",
    category: "مسابقة",
    date: "25 سبتمبر 2026",
    time: "11:00 صباحًا",
    location: "معمل الحاسب",
    attendees: 80,

    // مثال لفعالية مخصصة لهندسة الحاسب
    target: {
      faculty: "كلية الهندسة",
      program: "هندسة الحاسب",
    },
  },

  {
    id: "EVT-004",
    title: "ورشة مهارات المذاكرة",
    description:
      "تعلم طرقًا عملية لتنظيم وقتك وإدارة متطلبات الدراسة الجامعية.",
    category: "أكاديمي",
    date: "27 سبتمبر 2026",
    time: "1:00 ظهرًا",
    location: "قاعة المحاضرات الرئيسية",
    attendees: 100,
  },

  {
    id: "EVT-005",
    title: "لقاء المجتمع الطلابي",
    description:
      "لقاء مفتوح للتعرف على الطلاب ومشاركة التجارب والأفكار.",
    category: "اجتماعي",
    date: "29 سبتمبر 2026",
    time: "4:00 مساءً",
    location: "منطقة الأنشطة الطلابية",
    attendees: 70,
  },

  /*
   * مثال لفعالية مخصصة لكلية + برنامج + سنة:
   *
   * {
   *   id: "EVT-006",
   *   title: "ورشة هندسة الحاسب للعام الأول",
   *   description:
   *     "ورشة مخصصة لطلاب هندسة الحاسب في العام الأول.",
   *   category: "أكاديمي",
   *   date: "30 سبتمبر 2026",
   *   time: "12:00 ظهرًا",
   *   location: "معمل الحاسب",
   *   attendees: 50,
   *   target: {
   *     faculty: "كلية الهندسة",
   *     program: "هندسة الحاسب",
   *     academicYear: "العام الأول",
   *   },
   * },
   */
];