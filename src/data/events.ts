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

/*
 * لا توجد فعاليات افتراضية هنا.
 *
 * الفعاليات الحقيقية يتم جلبها من Supabase
 * بعد أن يقوم الـAdmin بإضافتها.
 */
export const events: StudentEvent[] = [];