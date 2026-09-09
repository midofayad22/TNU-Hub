export interface QuickAction {
  title: string;
  description: string;
  icon: string;
  path: string;
}

export const quickActions: QuickAction[] = [
  {
    title: "Get Help",
    description: "Find the right place for your problem.",
    icon: "?",
    path: "/help",
  },
  {
    title: "Events",
    description: "Discover activities happening around you.",
    icon: "◇",
    path: "/events",
  },
  {
    title: "My Requests",
    description: "Track your submitted requests.",
    icon: "□",
    path: "/requests",
  },
  {
    title: "Resources",
    description: "Useful guides and student resources.",
    icon: "▣",
    path: "/resources",
  },
];