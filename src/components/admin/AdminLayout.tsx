import type { ReactNode } from "react";

import AdminSidebar from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <div
      className="admin-layout"
      dir="rtl"
    >
      <AdminSidebar />

      <main className="admin-layout__main">
        {children}
      </main>
    </div>
  );
}