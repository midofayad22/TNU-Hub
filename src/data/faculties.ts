export interface Program {
  id: string;
  name: string;
  description: string;
}

export interface Faculty {
  id: string;
  name: string;
  description: string;
  icon: string;
  programs: Program[];
}

export const faculties: Faculty[] = [
  {
    id: "medicine",
    name: "كلية الطب البشري",
    description:
      "التعليم الطبي والدعم الأكاديمي والأنشطة والخدمات الطلابية لطلاب الطب البشري.",
    icon: "ط",
    programs: [
      {
        id: "medicine-and-surgery",
        name: "بكالوريوس الطب والجراحة",
        description:
          "برنامج أكاديمي لإعداد الطلاب في العلوم الطبية والتدريب السريري.",
      },
    ],
  },

  {
    id: "dentistry",
    name: "كلية طب الأسنان",
    description:
      "التعليم والتدريب الأكاديمي والسريري والخدمات الطلابية لطلاب طب الأسنان.",
    icon: "س",
    programs: [
      {
        id: "oral-and-dental-surgery",
        name: "طب وجراحة الفم والأسنان",
        description:
          "برنامج أكاديمي متخصص في علوم طب الأسنان والتدريب السريري.",
      },
    ],
  },

  {
    id: "engineering",
    name: "كلية الهندسة",
    description:
      "برامج هندسية متخصصة مع فرص للتعلم والتطوير والمشاركة في الحياة الطلابية.",
    icon: "هـ",
    programs: [
      {
        id: "computer-engineering",
        name: "هندسة الحاسب",
        description:
          "دراسة أنظمة الحاسب والبرمجيات والعتاد وهندسة الأنظمة الحاسوبية.",
      },
      {
        id: "mechatronics",
        name: "هندسة الميكاترونيكس",
        description:
          "دراسة الأنظمة الميكاترونية والتحكم والأتمتة والأنظمة الهندسية المتكاملة.",
      },
    ],
  },

  {
    id: "computers-information-ai",
    name: "كلية الحاسبات والمعلومات والذكاء الاصطناعي",
    description:
      "مجال متخصص في علوم الحاسب وتكنولوجيا المعلومات والذكاء الاصطناعي.",
    icon: "ح",
    programs: [
      {
        id: "computer-science-ai",
        name: "علوم وحاسب وذكاء اصطناعي",
        description:
          "برنامج يجمع بين علوم الحاسب وتقنيات الذكاء الاصطناعي والتطبيقات الحديثة.",
      },
    ],
  },

  {
    id: "alsun",
    name: "كلية الألسن",
    description:
      "دراسة اللغات والترجمة وتطوير المهارات اللغوية والتواصلية.",
    icon: "ل",
    programs: [
      {
        id: "english-language-translation",
        name: "اللغة الإنجليزية والترجمة",
        description:
          "برنامج متخصص في اللغة الإنجليزية ومهارات الترجمة والتواصل.",
      },
    ],
  },

  {
    id: "business",
    name: "كلية الأعمال",
    description:
      "برامج متخصصة في المحاسبة والأعمال ونظم المعلومات والابتكارات المالية.",
    icon: "أ",
    programs: [
      {
        id: "accounting-financial-innovations",
        name: "المحاسبة والابتكارات المالية",
        description:
          "دراسة المحاسبة والأنظمة المالية والابتكارات الحديثة في المجال المالي.",
      },
      {
        id: "business-information-systems",
        name: "نظم ومعلومات",
        description:
          "دراسة نظم المعلومات وتطبيقاتها في بيئة الأعمال والمؤسسات.",
      },
    ],
  },

  {
    id: "humanities-social-sciences",
    name: "كلية العلوم الإنسانية والاجتماعية",
    description:
      "برامج متخصصة في إدارة المتاحف والمواقع الأثرية والمساحة والخرائط ونظم المعلومات الجغرافية.",
    icon: "ع",
    programs: [
      {
        id: "museum-archaeological-management",
        name: "إدارة المتاحف والمواقع الأثرية",
        description:
          "دراسة إدارة المتاحف والمواقع الأثرية والحفاظ على التراث وإدارته.",
      },
      {
        id: "surveying-maps-gis",
        name: "المساحة والخرائط ونظم المعلومات الجغرافية",
        description:
          "دراسة المساحة والخرائط وتقنيات نظم المعلومات الجغرافية وتطبيقاتها.",
      },
    ],
  },
];