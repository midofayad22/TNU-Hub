export interface Resource {
  id: number;
  title: string;
  description: string;
  category: string;
  icon: string;
}

export const resources: Resource[] = [
  {
    id: 1,
    title: "Student Services",
    description:
      "Useful information about services available to students.",
    category: "Services",
    icon: "▣",
  },
  {
    id: 2,
    title: "Academic Guidance",
    description:
      "Helpful resources for planning and managing your academic journey.",
    category: "Academic",
    icon: "◇",
  },
  {
    id: 3,
    title: "Student Activities",
    description:
      "Discover clubs, committees and student activities.",
    category: "Student Life",
    icon: "○",
  },
  {
    id: 4,
    title: "Important Links",
    description:
      "Quick access to useful university platforms and services.",
    category: "Links",
    icon: "↗",
  },
];