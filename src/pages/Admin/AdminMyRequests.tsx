import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  XCircle,
  ClipboardCheck,
  FileEdit,
  Plus,
  Trash2,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Navigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

/* =========================================================
   TYPES
========================================================= */

type RequestStatus =
  | "pending"
  | "approved"
  | "rejected";

type RequestAction =
  | "add"
  | "edit"
  | "delete";

interface AdminActionRequest {
  id: number;
  admin_id: string;
  section: string;
  action: RequestAction;
  target_id: string | null;
  payload: Record<string, unknown> | null;
  reason: string | null;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function getSectionLabel(section: string) {
  const labels: Record<string, string> = {
    announcements: "الإعلانات",
    events: "الفعاليات",
    requests: "الطلبات",
    resources: "المصادر",
    faculties: "الكليات والبرامج",
    students: "الطلاب",
  };

  return labels[section] || section;
}

function getActionLabel(action: RequestAction) {
  const labels: Record<RequestAction, string> = {
    add: "إضافة",
    edit: "تعديل",
    delete: "حذف",
  };

  return labels[action];
}

function getRequestTitle(
  request: AdminActionRequest
) {
  const payload = request.payload;

  if (!payload) {
    return "طلب إداري";
  }

  const keys = [
    "title",
    "name",
    "event_title",
    "announcement_title",
    "resource_title",
  ];

  for (const key of keys) {
    const value = payload[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return `${getActionLabel(
    request.action
  )} في ${getSectionLabel(
    request.section
  )}`;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminMyRequests() {
  const { profile } = useAuth();

  const [requests, setRequests] = useState<
    AdminActionRequest[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [filter, setFilter] = useState<
    "all" | RequestStatus
  >("all");

  /* =======================================================
     LOAD REQUESTS
  ======================================================= */

  const loadRequests = useCallback(
    async (isRefresh = false) => {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const { data, error } =
          await supabase
            .from("admin_action_requests")
            .select(
              "id, admin_id, section, action, target_id, payload, reason, status, reviewed_by, reviewed_at, created_at, updated_at"
            )
            .eq("admin_id", profile.id)
            .order("created_at", {
              ascending: false,
            });

        if (error) {
          throw error;
        }

        setRequests(
          (data ?? []) as AdminActionRequest[]
        );
      } catch (error) {
        console.error(
          "Admin my requests error:",
          error
        );

        setError(
          "تعذر تحميل طلباتك الإدارية. حاول مرة أخرى."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [profile?.id]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredRequests = useMemo(() => {
    if (filter === "all") {
      return requests;
    }

    return requests.filter(
      (request) =>
        request.status === filter
    );
  }, [requests, filter]);

  /* =======================================================
     STATS
  ======================================================= */

  const pendingCount = requests.filter(
    (request) =>
      request.status === "pending"
  ).length;

  const approvedCount = requests.filter(
    (request) =>
      request.status === "approved"
  ).length;

  const rejectedCount = requests.filter(
    (request) =>
      request.status === "rejected"
  ).length;

  /* =======================================================
     NO PROFILE
  ======================================================= */

  if (!profile) {
    return null;
  }

  /* =======================================================
     ROOT ADMIN REDIRECT
  ======================================================= */

  if (profile.role === "root_admin") {
    return (
      <Navigate
        to="/admin/approvals"
        replace
      />
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="admin-page admin-my-requests"
      dir="rtl"
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="admin-page__header">
        <div>
          <span className="admin-page__kicker">
            المتابعة
          </span>

          <h1>
            طلباتي الإدارية
          </h1>

          <p>
            تابع حالة الطلبات التي أرسلتها إلى
            الإدارة الرئيسية.
          </p>
        </div>

        <div className="admin-page__header-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() =>
              loadRequests(true)
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "admin-my-requests__spin"
                  : ""
              }
            />

            <span>
              تحديث
            </span>
          </button>
        </div>
      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <XCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              loadRequests(true)
            }
            className="admin-alert__retry"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* =====================================================
          STATS
      ===================================================== */}

      <section className="admin-my-requests__stats">
        <button
          type="button"
          className={`admin-my-requests__stat ${
            filter === "all"
              ? "admin-my-requests__stat--active"
              : ""
          }`}
          onClick={() =>
            setFilter("all")
          }
        >
          <ClipboardCheck size={19} />

          <div>
            <strong>
              {requests.length}
            </strong>

            <span>
              إجمالي الطلبات
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`admin-my-requests__stat ${
            filter === "pending"
              ? "admin-my-requests__stat--active"
              : ""
          }`}
          onClick={() =>
            setFilter("pending")
          }
        >
          <Clock3 size={19} />

          <div>
            <strong>
              {pendingCount}
            </strong>

            <span>
              قيد المراجعة
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`admin-my-requests__stat ${
            filter === "approved"
              ? "admin-my-requests__stat--active"
              : ""
          }`}
          onClick={() =>
            setFilter("approved")
          }
        >
          <CheckCircle2 size={19} />

          <div>
            <strong>
              {approvedCount}
            </strong>

            <span>
              تمت الموافقة
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`admin-my-requests__stat ${
            filter === "rejected"
              ? "admin-my-requests__stat--active"
              : ""
          }`}
          onClick={() =>
            setFilter("rejected")
          }
        >
          <XCircle size={19} />

          <div>
            <strong>
              {rejectedCount}
            </strong>

            <span>
              مرفوضة
            </span>
          </div>
        </button>
      </section>

      {/* =====================================================
          REQUESTS PANEL
      ===================================================== */}

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <span className="admin-panel__kicker">
              السجل
            </span>

            <h2>
              الطلبات الإدارية
            </h2>
          </div>

          <span className="admin-my-requests__count">
            {filteredRequests.length} طلب
          </span>
        </div>

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (
          <div className="admin-my-requests__empty">
            <RefreshCw
              size={22}
              className="admin-my-requests__spin"
            />

            <span>
              جاري تحميل طلباتك...
            </span>
          </div>
        ) : filteredRequests.length === 0 ? (
          /* =================================================
             EMPTY
          ================================================= */

          <div className="admin-my-requests__empty">
            <ClipboardCheck size={26} />

            <h3>
              لا توجد طلبات هنا
            </h3>

            <p>
              {filter === "all"
                ? "لم تقم بإرسال أي طلبات إدارية حتى الآن."
                : "لا توجد طلبات بالحالة المحددة."}
            </p>
          </div>
        ) : (
          /* =================================================
             REQUEST LIST
          ================================================= */

          <div className="admin-my-requests__list">
            {filteredRequests.map(
              (request) => {
                const statusClass =
                  request.status;

                return (
                  <article
                    key={request.id}
                    className="admin-my-requests__item"
                  >
                    {/* =======================================
                        ACTION ICON
                    ======================================= */}

                    <div className="admin-my-requests__item-icon">
                      {request.action ===
                        "add" && (
                        <Plus size={19} />
                      )}

                      {request.action ===
                        "edit" && (
                        <FileEdit
                          size={19}
                        />
                      )}

                      {request.action ===
                        "delete" && (
                        <Trash2
                          size={19}
                        />
                      )}
                    </div>

                    {/* =======================================
                        MAIN CONTENT
                    ======================================= */}

                    <div className="admin-my-requests__item-main">
                      <div className="admin-my-requests__item-title">
                        <h3>
                          {getRequestTitle(
                            request
                          )}
                        </h3>

                        <span
                          className={`admin-my-requests__status admin-my-requests__status--${statusClass}`}
                        >
                          {request.status ===
                            "pending" && (
                            <Clock3
                              size={14}
                            />
                          )}

                          {request.status ===
                            "approved" && (
                            <CheckCircle2
                              size={14}
                            />
                          )}

                          {request.status ===
                            "rejected" && (
                            <XCircle
                              size={14}
                            />
                          )}

                          {request.status ===
                          "pending"
                            ? "قيد المراجعة"
                            : request.status ===
                                "approved"
                              ? "تمت الموافقة"
                              : "تم الرفض"}
                        </span>
                      </div>

                      {/* =====================================
                          META
                      ===================================== */}

                      <div className="admin-my-requests__item-meta">
                        <span>
                          {getActionLabel(
                            request.action
                          )}
                        </span>

                        <span>
                          {getSectionLabel(
                            request.section
                          )}
                        </span>

                        <span>
                          {formatDate(
                            request.created_at
                          )}
                        </span>
                      </div>

                      {/* =====================================
                          REASON
                      ===================================== */}

                      {request.reason && (
                        <p>
                          السبب:{" "}
                          {request.reason}
                        </p>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}