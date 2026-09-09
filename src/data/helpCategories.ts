export interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export const helpCategories: HelpCategory[] = [
  {
    id: "academic",
    title: "الدعم الأكاديمي",
    description: "المقررات والجداول والتسجيل والأسئلة الأكاديمية.",
    icon: "GraduationCap",
    color: "blue",
  },
  {
    id: "technical",
    title: "الدعم التقني",
    description: "مشكلات الحسابات أو نظام التعلم أو الأنظمة الإلكترونية.",
    icon: "Laptop",
    color: "purple",
  },
  {
    id: "student-services",
    title: "الخدمات الطلابية",
    description: "الاستفسارات المتعلقة بالخدمات والإجراءات الطلابية.",
    icon: "Building2",
    color: "green",
  },
  {
    id: "activities",
    title: "الأنشطة الطلابية",
    description: "اللجان والأنشطة والفعاليات والمشاركة الطلابية.",
    icon: "Users",
    color: "orange",
  },
  {
    id: "complaints",
    title: "الشكاوى",
    description: "الإبلاغ عن مشكلة أو تقديم شكوى رسمية.",
    icon: "MessageSquareWarning",
    color: "red",
  },
  {
    id: "suggestions",
    title: "المقترحات",
    description: "شارك فكرتك وساهم في تحسين الحياة الطلابية.",
    icon: "Lightbulb",
    color: "yellow",
  },
];