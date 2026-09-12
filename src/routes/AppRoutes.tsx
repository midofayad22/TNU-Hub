import { Route, Routes, Link } from "react-router-dom";

import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";

import Home from "../pages/home/Home";
import Explore from "../pages/Explore/Explore";

import Faculties from "../pages/Faculties/Faculties";
import FacultyDetails from "../pages/Faculties/FacultyDetails";

import Announcements from "../pages/Announcements/Announcements";
import AnnouncementDetails from "../pages/Announcements/AnnouncementDetails";

import Events from "../pages/Event/Events";
import EventDetails from "../pages/Event/EventDetails";

import Help from "../pages/Help/Help";

import Requests from "../pages/Requests/Requests";
import NewRequest from "../pages/Requests/NewRequest";
import RequestDetails from "../pages/Requests/RequestDetails";

import Resources from "../pages/Resources/Resources";

import Profile from "../pages/Profile/Profile";
import Settings from "../pages/Settings/Settings";
import Notifications from "../pages/Notifications/Notifications";

import ProtectedAdminRoute from "../components/admin/ProtectedAdminRoute";
import AdminLayout from "../components/admin/AdminLayout";

import AdminDashboard from "../pages/Admin/AdminDashboard";
import Admins from "../pages/Admin/Admins";
import AdminApprovals from "../pages/Admin/AdminApprovals";
import AdminMyRequests from "../pages/Admin/AdminMyRequests";

import AdminAnnouncements from "../pages/Admin/AdminAnnouncements";
import AdminAnnouncementForm from "../pages/Admin/AdminAnnouncementForm";

import AdminEvents from "../pages/Admin/AdminEvents";
import AdminEventForm from "../pages/Admin/AdminEventForm";

import AdminRequests from "../pages/Admin/AdminRequests";

import AdminFaculties from "../pages/Admin/AdminFaculties";
import AdminStudents from "../pages/Admin/AdminStudents";
import AdminResources from "../pages/Admin/AdminResources";

/* =========================================================
   404
========================================================= */

function NotFound() {
  return (
    <main
      className="page-shell"
      dir="rtl"
    >
      <section className="details-not-found routes-not-found">
        <div className="details-not-found__icon">
          <span>404</span>
        </div>

        <span className="routes-not-found__eyebrow">
          الصفحة غير موجودة
        </span>

        <h1>
          عذرًا، لم نجد هذه الصفحة
        </h1>

        <p>
          يبدو أن الرابط غير صحيح أو أن الصفحة التي
          تبحث عنها لم تعد متاحة.
        </p>

        <Link
          to="/"
          className="button button--primary"
        >
          العودة إلى الرئيسية
        </Link>
      </section>
    </main>
  );
}

/* =========================================================
   ADMIN ROUTE WRAPPER
========================================================= */

function AdminPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        {children}
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}

/* =========================================================
   APP ROUTES
========================================================= */

export default function AppRoutes() {
  return (
    <Routes>

      {/* =====================================================
          AUTH
      ====================================================== */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* =====================================================
          MAIN
      ====================================================== */}

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/explore"
        element={<Explore />}
      />

      {/* Faculties */}

      <Route
        path="/faculties"
        element={<Faculties />}
      />

      <Route
        path="/faculties/:id"
        element={<FacultyDetails />}
      />

      {/* Announcements */}

      <Route
        path="/announcements"
        element={<Announcements />}
      />

      <Route
        path="/announcements/:id"
        element={<AnnouncementDetails />}
      />

      {/* Events */}

      <Route
        path="/events"
        element={<Events />}
      />

      <Route
        path="/events/:id"
        element={<EventDetails />}
      />

      {/* Help */}

      <Route
        path="/help"
        element={<Help />}
      />

      {/* =====================================================
          REQUESTS
      ====================================================== */}

      <Route
        path="/requests"
        element={<Requests />}
      />

      <Route
        path="/requests/new"
        element={<NewRequest />}
      />

      <Route
        path="/requests/:id"
        element={<RequestDetails />}
      />

      {/* =====================================================
          RESOURCES
      ====================================================== */}

      <Route
        path="/resources"
        element={<Resources />}
      />

      {/* =====================================================
          PROFILE / SETTINGS / NOTIFICATIONS
      ====================================================== */}

      <Route
        path="/profile"
        element={<Profile />}
      />

      <Route
        path="/settings"
        element={<Settings />}
      />

      <Route
        path="/notifications"
        element={<Notifications />}
      />

      {/* =====================================================
          ADMIN
      ====================================================== */}

      {/* Dashboard */}

      <Route
        path="/admin"
        element={
          <AdminPage>
            <AdminDashboard />
          </AdminPage>
        }
      />

      {/* Admins / Supervisors */}

      <Route
        path="/admin/admins"
        element={
          <AdminPage>
            <Admins />
          </AdminPage>
        }
      />

      {/* Approval Center - Root Admin */}

      <Route
        path="/admin/approvals"
        element={
          <AdminPage>
            <AdminApprovals />
          </AdminPage>
        }
      />

      {/* My Administrative Requests - Sub Admin */}

      <Route
        path="/admin/my-requests"
        element={
          <AdminPage>
            <AdminMyRequests />
          </AdminPage>
        }
      />

      {/* =====================================================
          ADMIN — ANNOUNCEMENTS
      ====================================================== */}

      {/* All announcements */}

      <Route
        path="/admin/announcements"
        element={
          <AdminPage>
            <AdminAnnouncements />
          </AdminPage>
        }
      />

      {/* Create announcement */}

      <Route
        path="/admin/announcements/new"
        element={
          <AdminPage>
            <AdminAnnouncementForm />
          </AdminPage>
        }
      />

      {/* Edit announcement */}

      <Route
        path="/admin/announcements/:id/edit"
        element={
          <AdminPage>
            <AdminAnnouncementForm />
          </AdminPage>
        }
      />

      {/* =====================================================
          ADMIN — EVENTS
      ====================================================== */}

      {/* All events */}

      <Route
        path="/admin/events"
        element={
          <AdminPage>
            <AdminEvents />
          </AdminPage>
        }
      />

      {/* Create event */}

      <Route
        path="/admin/events/new"
        element={
          <AdminPage>
            <AdminEventForm />
          </AdminPage>
        }
      />

      {/* Edit event */}

      <Route
        path="/admin/events/:id/edit"
        element={
          <AdminPage>
            <AdminEventForm />
          </AdminPage>
        }
      />

      {/* =====================================================
          ADMIN — REQUESTS
      ====================================================== */}

      <Route
        path="/admin/requests"
        element={
          <AdminPage>
            <AdminRequests />
          </AdminPage>
        }
      />

      {/* =====================================================
          ADMIN — FACULTIES & PROGRAMS
      ====================================================== */}

      <Route
        path="/admin/faculties"
        element={
          <AdminPage>
            <AdminFaculties />
          </AdminPage>
        }
      />

      {/* =====================================================
          ADMIN — STUDENTS
      ====================================================== */}

      <Route
        path="/admin/students"
        element={
          <AdminPage>
            <AdminStudents />
          </AdminPage>
        }
      />

      {/* =====================================================
          ADMIN — RESOURCES
      ====================================================== */}

      <Route
        path="/admin/resources"
        element={
          <AdminPage>
            <AdminResources />
          </AdminPage>
        }
      />

      {/* =====================================================
          404
      ====================================================== */}

      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>
  );
}