import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";

import Home from "../pages/home/Home";
import Explore from "../pages/Explore/Explore";
import Admins from "../pages/Admin/Admins";
import Faculties from "../pages/Faculties/Faculties";
import FacultyDetails from "../pages/Faculties/FacultyDetails";

import Announcements from "../pages/Announcements/Announcements";
import AnnouncementDetails from "../pages/Announcements/AnnouncementDetails";

import Events from "../pages/Event/Events";
import EventDetails from "../pages/Event/EventDetails";

import Help from "../pages/Help/Help";
import ProtectedAdminRoute from "../components/admin/ProtectedAdminRoute";
import Requests from "../pages/Requests/Requests";
import NewRequest from "../pages/Requests/NewRequest";
import RequestDetails from "../pages/Requests/RequestDetails";

import Resources from "../pages/Resources/Resources";
import Profile from "../pages/Profile/Profile";
import Settings from "../pages/Settings/Settings";
import Notifications from "../pages/Notifications/Notifications";

// Admin
import AdminLayout from "../components/admin/AdminLayout";
import AdminDashboard from "../pages/Admin/AdminDashboard";

function NotFound() {
  return (
    <div className="page-shell" dir="rtl">
      <div className="empty-state">
        <h1>الصفحة غير موجودة</h1>
        <p>عذرًا، الصفحة التي تبحث عنها غير موجودة.</p>

        <a href="/" className="primary-button">
          العودة إلى الرئيسية
        </a>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* =========================
          Main Pages
          ========================= */}

      <Route path="/" element={<Home />} />

      <Route path="/explore" element={<Explore />} />

      {/* Faculties */}
      <Route path="/faculties" element={<Faculties />} />
      <Route path="/faculties/:id" element={<FacultyDetails />} />

      {/* Announcements */}
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/announcements/:id" element={<AnnouncementDetails />} />

      {/* Events */}
      <Route path="/events" element={<Events />} />
      <Route path="/events/:id" element={<EventDetails />} />

      {/* Help */}
      <Route path="/help" element={<Help />} />

      {/* Requests */}
      <Route path="/requests" element={<Requests />} />
      <Route path="/requests/new" element={<NewRequest />} />
      <Route path="/requests/:id" element={<RequestDetails />} />

      {/* Resources */}
      <Route path="/resources" element={<Resources />} />

      {/* Profile */}
      <Route path="/profile" element={<Profile />} />

      {/* Settings */}
      <Route path="/settings" element={<Settings />} />

      {/* Notifications */}
      <Route path="/notifications" element={<Notifications />} />

      {/* =========================
          ADMIN
          ========================= */}

      <Route
        path="/admin/admins"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <Admins />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />

      {/* =========================
          404
          ========================= */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
