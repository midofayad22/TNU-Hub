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
   * إذا لم توجد target فهذا إعلان عام.
   */
  target?: AnnouncementTarget;
}

/*
 * لا توجد بيانات إعلانات افتراضية هنا.
 *
 * الإعلانات الحقيقية يتم جلبها من Supabase
 * بعد أن يقوم الـAdmin بإضافتها.
 */
export const announcements: Announcement[] = [];