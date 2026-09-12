import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  LoaderCircle,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

/* =========================================================
  TYPES
========================================================= */

type RequestStatus =
  | "قيد الانتظار"
  | "قيد المراجعة"
  | "تم الحل";

type RequestItem = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  status: RequestStatus;
  created_at: string;
  updated_at?: string | null;
};

type StudentProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  faculty: string | null;
  program: string | null;
  academic_year: string | null;
};

type RequestWithStudent = RequestItem & {
  student: StudentProfile | null;
};

type FilterType =
  | "all"
  | "قيد الانتظار"
  | "قيد المراجعة"
  | "تم الحل";

/* =========================================================
  HELPERS
========================================================= */

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

function getStatusIcon(status: RequestStatus) {
  switch (status) {
    case "قيد الانتظار":
      return <Clock3 size={17} />;

    case "قيد المراجعة":
      return <RefreshCw size={17} />;

    case "تم الحل":
      return <CheckCircle2 size={17} />;

    default:
      return <AlertCircle size={17} />;
  }
}

function getStatusClass(status: RequestStatus) {
  switch (status) {
    case "قيد الانتظار":
      return "admin-requests__status admin-requests__status--pending";

    case "قيد المراجعة":
      return "admin-requests__status admin-requests__status--reviewing";

    case "تم الحل":
      return "admin-requests__status admin-requests__status--resolved";

    default:
      return "admin-requests__status";
  }
}

/* =========================================================
  COMPONENT
========================================================= */

export default function AdminRequests() {
  const { profile } = useAuth();

  /* =======================================================
    STATE
  ======================================================= */

  const [requests, setRequests] = useState<
    RequestWithStudent[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(
    null
  );

  const [search, setSearch] = useState("");

  const [filter, setFilter] =
    useState<FilterType>("all");

  const [selectedRequest, setSelectedRequest] =
    useState<RequestWithStudent | null>(null);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [deletingRequest, setDeletingRequest] =
    useState(false);

  /* =======================================================
    LOAD REQUESTS
  ======================================================= */

  const loadRequests = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const {
          data: requestsData,
          error: requestsError,
        } = await supabase
          .from("requests")
          .select(
            `
              id,
              user_id,
              title,
              category,
              description,
              status,
              created_at,
              updated_at
            `
          )
          .order("created_at", {
            ascending: false,
          });

        if (requestsError) {
          throw requestsError;
        }

        const requestRows =
          (requestsData ?? []) as RequestItem[];

        if (requestRows.length === 0) {
          setRequests([]);
          setSelectedRequest(null);
          return;
        }

        /* =================================================
          LOAD STUDENTS
        ================================================= */

        const userIds = Array.from(
          new Set(
            requestRows.map(
              (request) => request.user_id
            )
          )
        );

        const {
          data: studentsData,
          error: studentsError,
        } = await supabase
          .from("profiles")
          .select(
            `
              id,
              full_name,
              email,
              faculty,
              program,
              academic_year
            `
          )
          .in("id", userIds);

        if (studentsError) {
          throw studentsError;
        }

        const students =
          (studentsData ?? []) as StudentProfile[];

        const studentMap = new Map<
          string,
          StudentProfile
        >();

        students.forEach((student) => {
          studentMap.set(student.id, student);
        });

        const combined: RequestWithStudent[] =
          requestRows.map((request) => ({
            ...request,
            student:
              studentMap.get(request.user_id) ??
              null,
          }));

        setRequests(combined);

        setSelectedRequest((current) => {
          if (!current) {
            return null;
          }

          return (
            combined.find(
              (request) =>
                request.id === current.id
            ) ?? null
          );
        });
      } catch (err) {
        console.error(
          "Failed to load admin requests:",
          err
        );

        setError(
          "حدث خطأ أثناء تحميل طلبات الطلاب. حاول مرة أخرى."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /* =======================================================
    INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  /* =======================================================
    FILTERED REQUESTS
  ======================================================= */

  const filteredRequests = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        filter === "all" ||
        request.status === filter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        request.id,
        request.title,
        request.category,
        request.description,
        request.student?.full_name ?? "",
        request.student?.email ?? "",
        request.student?.faculty ?? "",
        request.student?.program ?? "",
        request.student?.academic_year ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        normalizedSearch
      );
    });
  }, [requests, filter, search]);

  /* =======================================================
    SEARCH RESULTS
  ======================================================= */

  const searchResults = useMemo(() => {
    if (!search.trim()) {
      return [];
    }

    return filteredRequests.slice(0, 6);
  }, [filteredRequests, search]);

  /* =======================================================
    STATS
  ======================================================= */

  const stats = useMemo(() => {
    return {
      total: requests.length,

      pending: requests.filter(
        (request) =>
          request.status === "قيد الانتظار"
      ).length,

      reviewing: requests.filter(
        (request) =>
          request.status === "قيد المراجعة"
      ).length,

      resolved: requests.filter(
        (request) =>
          request.status === "تم الحل"
      ).length,
    };
  }, [requests]);

  /* =======================================================
    STATUS UPDATE
  ======================================================= */

  const handleStatusChange = async (
    request: RequestWithStudent,
    newStatus: RequestStatus
  ) => {
    if (updatingStatus) {
      return;
    }

    if (request.status === newStatus) {
      return;
    }

    setUpdatingStatus(true);

    try {
      const {
        error: updateError,
      } = await supabase
        .from("requests")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) {
        throw updateError;
      }

      /* =================================================
        CREATE NOTIFICATION
      ================================================= */

      const {
        error: notificationError,
      } = await supabase
        .from("notifications")
        .insert({
          user_id: request.user_id,
          title: "تم تحديث طلبك",
          message: `تم تحديث حالة طلبك "${request.title}" إلى ${newStatus}.`,
          type: "request",
          is_read: false,
        });

      if (notificationError) {
        console.error(
          "Request notification error:",
          notificationError
        );
      }

      const updatedRequest: RequestWithStudent = {
        ...request,
        status: newStatus,
        updated_at:
          new Date().toISOString(),
      };

      setRequests((current) =>
        current.map((item) =>
          item.id === request.id
            ? updatedRequest
            : item
        )
      );

      setSelectedRequest((current) =>
        current?.id === request.id
          ? updatedRequest
          : current
      );
    } catch (err) {
      console.error(
        "Failed to update request status:",
        err
      );

      alert(
        "حدث خطأ أثناء تحديث حالة الطلب. حاول مرة أخرى."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  /* =======================================================
    DELETE REQUEST
  ======================================================= */

  const handleDelete = async (
    request: RequestWithStudent
  ) => {
    if (deletingRequest) {
      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الطلب "${request.title}"؟`
    );

    if (!confirmed) {
      return;
    }

    setDeletingRequest(true);

    try {
      const {
        error: deleteError,
      } = await supabase
        .from("requests")
        .delete()
        .eq("id", request.id);

      if (deleteError) {
        throw deleteError;
      }

      setRequests((current) =>
        current.filter(
          (item) => item.id !== request.id
        )
      );

      setSelectedRequest(null);
    } catch (err) {
      console.error(
        "Failed to delete request:",
        err
      );

      alert(
        "حدث خطأ أثناء حذف الطلب. حاول مرة أخرى."
      );
    } finally {
      setDeletingRequest(false);
    }
  };

  /* =======================================================
    RENDER — LOADING
  ======================================================= */

  if (loading) {
    return (
      <section
        className="admin-page admin-requests"
        dir="rtl"
      >
        <div className="admin-page__loading">
          <LoaderCircle
            size={32}
            className="admin-page__spinner"
          />

          <p>
            جاري تحميل طلبات الطلاب...
          </p>
        </div>
      </section>
    );
  }

  /* =======================================================
    RENDER
  ======================================================= */

  return (
    <section
      className="admin-page admin-requests"
      dir="rtl"
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="admin-page__header">
        <div>
          <span className="admin-page__eyebrow">
            إدارة الطلبات
          </span>

          <h1 className="admin-page__title">
            طلبات الطلاب
          </h1>

          <p className="admin-page__description">
            راجع طلبات الطلاب وتابع حالتها من مكان واحد.
          </p>
        </div>

        <button
          type="button"
          className="admin-page__refresh"
          onClick={() => loadRequests(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={18}
            className={
              refreshing
                ? "admin-page__spinner"
                : ""
            }
          />

          <span>
            {refreshing
              ? "جاري التحديث..."
              : "تحديث"}
          </span>
        </button>
      </header>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="admin-page__alert admin-page__alert--error">
          <AlertCircle size={19} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => loadRequests()}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* ===================================================
          STATS
      =================================================== */}

      <div className="admin-requests__stats">
        <button
          type="button"
          className={`admin-requests__stat ${
            filter === "all"
              ? "admin-requests__stat--active"
              : ""
          }`}
          onClick={() => setFilter("all")}
        >
          <div className="admin-requests__stat-icon">
            <FileText size={21} />
          </div>

          <div>
            <strong>{stats.total}</strong>
            <span>كل الطلبات</span>
          </div>
        </button>

        <button
          type="button"
          className={`admin-requests__stat ${
            filter === "قيد الانتظار"
              ? "admin-requests__stat--active"
              : ""
          }`}
          onClick={() =>
            setFilter("قيد الانتظار")
          }
        >
          <div className="admin-requests__stat-icon">
            <Clock3 size={21} />
          </div>

          <div>
            <strong>{stats.pending}</strong>
            <span>قيد الانتظار</span>
          </div>
        </button>

        <button
          type="button"
          className={`admin-requests__stat ${
            filter === "قيد المراجعة"
              ? "admin-requests__stat--active"
              : ""
          }`}
          onClick={() =>
            setFilter("قيد المراجعة")
          }
        >
          <div className="admin-requests__stat-icon">
            <RefreshCw size={21} />
          </div>

          <div>
            <strong>{stats.reviewing}</strong>
            <span>قيد المراجعة</span>
          </div>
        </button>

        <button
          type="button"
          className={`admin-requests__stat ${
            filter === "تم الحل"
              ? "admin-requests__stat--active"
              : ""
          }`}
          onClick={() => setFilter("تم الحل")}
        >
          <div className="admin-requests__stat-icon">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <strong>{stats.resolved}</strong>
            <span>تم الحل</span>
          </div>
        </button>
      </div>

      {/* ===================================================
          TOOLBAR
      =================================================== */}

      <div className="admin-requests__toolbar">

        {/* SEARCH */}
        <div className="admin-requests__search-wrapper">
          <div className="admin-requests__search">
            <Search size={19} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="ابحث بالعنوان أو اسم الطالب أو البريد..."
              aria-label="البحث في الطلبات"
              autoComplete="off"
            />

            {search && (
              <button
                type="button"
                className="admin-requests__search-clear"
                onClick={() => setSearch("")}
                aria-label="مسح البحث"
              >
                <XCircle size={18} />
              </button>
            )}
          </div>

          {/* SEARCH RESULTS */}
          {search.trim() && (
            <div className="admin-requests__search-results">
              <div className="admin-requests__search-results-header">
                <span>نتائج البحث</span>

                <strong>
                  {filteredRequests.length}
                </strong>
              </div>

              {searchResults.length > 0 ? (
                <div className="admin-requests__search-results-list">
                  {searchResults.map((request) => (
                    <button
                      type="button"
                      key={request.id}
                      className="admin-requests__search-result"
                      onClick={() => {
                        setSelectedRequest(request);
                        setSearch("");
                      }}
                    >
                      <div className="admin-requests__search-result-icon">
                        <FileText size={17} />
                      </div>

                      <div className="admin-requests__search-result-content">
                        <strong>
                          {request.title}
                        </strong>

                        <span>
                          {request.student?.full_name ||
                            "طالب غير معروف"}
                        </span>

                        <small>
                          {request.category}
                        </small>
                      </div>

                      <div
                        className={getStatusClass(
                          request.status
                        )}
                      >
                        {getStatusIcon(
                          request.status
                        )}

                        <span>
                          {request.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="admin-requests__search-no-results">
                  <Search size={22} />

                  <strong>
                    لا توجد نتائج مطابقة
                  </strong>

                  <span>
                    جرّب البحث باسم الطالب أو عنوان الطلب
                  </span>
                </div>
              )}

              {filteredRequests.length > 6 && (
                <div className="admin-requests__search-results-footer">
                  يتم عرض أول 6 نتائج فقط
                </div>
              )}
            </div>
          )}
        </div>

        {/* FILTER */}
        <div className="admin-requests__filter">
          <label htmlFor="request-status-filter">
            الحالة
          </label>

          <div className="admin-requests__select">
            <select
              id="request-status-filter"
              value={filter}
              onChange={(event) =>
                setFilter(
                  event.target.value as FilterType
                )
              }
            >
              <option value="all">
                كل الطلبات
              </option>

              <option value="قيد الانتظار">
                قيد الانتظار
              </option>

              <option value="قيد المراجعة">
                قيد المراجعة
              </option>

              <option value="تم الحل">
                تم الحل
              </option>
            </select>

            <ChevronDown size={17} />
          </div>
        </div>
      </div>

      {/* ===================================================
          EMPTY
      =================================================== */}

      {filteredRequests.length === 0 ? (
        <div className="admin-page__empty">
          <div className="admin-page__empty-icon">
            <FileText size={28} />
          </div>

          <h2>
            لا توجد طلبات
          </h2>

          <p>
            {requests.length === 0
              ? "لم يرسل الطلاب أي طلبات حتى الآن."
              : "لم نجد طلبات تطابق البحث أو الفلتر الحالي."}
          </p>

          {(search || filter !== "all") && (
            <button
              type="button"
              className="admin-page__empty-action"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              عرض كل الطلبات
            </button>
          )}
        </div>
      ) : (
        /* =================================================
           CONTENT
        ================================================= */

        <div className="admin-requests__content">

          {/* =================================================
              REQUEST LIST
          ================================================= */}

          <div className="admin-requests__list">
            {filteredRequests.map((request) => {
              const isSelected =
                selectedRequest?.id ===
                request.id;

              return (
                <button
                  type="button"
                  key={request.id}
                  className={`admin-requests__card ${
                    isSelected
                      ? "admin-requests__card--selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedRequest(request)
                  }
                >
                  <div className="admin-requests__card-top">
                    <div className="admin-requests__card-icon">
                      <FileText size={20} />
                    </div>

                    <div className="admin-requests__card-heading">
                      <h3>
                        {request.title}
                      </h3>

                      <span>
                        {request.category}
                      </span>
                    </div>

                    <div
                      className={getStatusClass(
                        request.status
                      )}
                    >
                      {getStatusIcon(
                        request.status
                      )}

                      <span>
                        {request.status}
                      </span>
                    </div>
                  </div>

                  <p className="admin-requests__card-description">
                    {request.description}
                  </p>

                  <div className="admin-requests__card-footer">
                    <span>
                      <UserRound size={15} />

                      {request.student
                        ?.full_name ||
                        "طالب غير معروف"}
                    </span>

                    <time>
                      {formatDate(
                        request.created_at
                      )}
                    </time>
                  </div>
                </button>
              );
            })}
          </div>

          {/* =================================================
              DETAILS
          ================================================= */}

          <aside className="admin-requests__details">
            {!selectedRequest ? (
              <div className="admin-requests__details-empty">
                <div>
                  <FileText size={30} />
                </div>

                <h2>
                  اختر طلبًا
                </h2>

                <p>
                  اختر أحد الطلبات من القائمة لعرض
                  تفاصيله وإدارته.
                </p>
              </div>
            ) : (
              <>
                <div className="admin-requests__details-header">
                  <div>
                    <span>
                      تفاصيل الطلب
                    </span>

                    <h2>
                      {selectedRequest.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="admin-requests__delete"
                    onClick={() =>
                      handleDelete(
                        selectedRequest
                      )
                    }
                    disabled={
                      deletingRequest
                    }
                    title="حذف الطلب"
                  >
                    {deletingRequest ? (
                      <LoaderCircle
                        size={18}
                        className="admin-page__spinner"
                      />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>

                {/* STUDENT */}

                <div className="admin-requests__student">
                  <div className="admin-requests__student-avatar">
                    {(
                      selectedRequest.student
                        ?.full_name ||
                      "ط"
                    ).charAt(0)}
                  </div>

                  <div>
                    <strong>
                      {selectedRequest.student
                        ?.full_name ||
                        "طالب غير معروف"}
                    </strong>

                    {selectedRequest.student
                      ?.email && (
                      <span>
                        {
                          selectedRequest
                            .student.email
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* STUDENT INFORMATION */}

                <div className="admin-requests__info-grid">
                  <div>
                    <span>
                      الكلية
                    </span>

                    <strong>
                      {selectedRequest.student
                        ?.faculty || "غير محدد"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      البرنامج
                    </span>

                    <strong>
                      {selectedRequest.student
                        ?.program || "غير محدد"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      السنة الدراسية
                    </span>

                    <strong>
                      {selectedRequest.student
                        ?.academic_year ||
                        "غير محددة"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      التصنيف
                    </span>

                    <strong>
                      {selectedRequest.category}
                    </strong>
                  </div>
                </div>

                {/* DESCRIPTION */}

                <div className="admin-requests__details-section">
                  <span className="admin-requests__details-label">
                    وصف الطلب
                  </span>

                  <div className="admin-requests__description">
                    {selectedRequest.description}
                  </div>
                </div>

                {/* STATUS */}

                <div className="admin-requests__details-section">
                  <span className="admin-requests__details-label">
                    حالة الطلب
                  </span>

                  <div className="admin-requests__status-actions">
                    <button
                      type="button"
                      className={
                        selectedRequest.status ===
                        "قيد الانتظار"
                          ? "admin-requests__status-button admin-requests__status-button--active"
                          : "admin-requests__status-button"
                      }
                      onClick={() =>
                        handleStatusChange(
                          selectedRequest,
                          "قيد الانتظار"
                        )
                      }
                      disabled={
                        updatingStatus
                      }
                    >
                      <Clock3 size={17} />

                      <span>
                        قيد الانتظار
                      </span>
                    </button>

                    <button
                      type="button"
                      className={
                        selectedRequest.status ===
                        "قيد المراجعة"
                          ? "admin-requests__status-button admin-requests__status-button--active"
                          : "admin-requests__status-button"
                      }
                      onClick={() =>
                        handleStatusChange(
                          selectedRequest,
                          "قيد المراجعة"
                        )
                      }
                      disabled={
                        updatingStatus
                      }
                    >
                      <RefreshCw size={17} />

                      <span>
                        قيد المراجعة
                      </span>
                    </button>

                    <button
                      type="button"
                      className={
                        selectedRequest.status ===
                        "تم الحل"
                          ? "admin-requests__status-button admin-requests__status-button--active"
                          : "admin-requests__status-button"
                      }
                      onClick={() =>
                        handleStatusChange(
                          selectedRequest,
                          "تم الحل"
                        )
                      }
                      disabled={
                        updatingStatus
                      }
                    >
                      <CheckCircle2
                        size={17}
                      />

                      <span>
                        تم الحل
                      </span>
                    </button>
                  </div>

                  {updatingStatus && (
                    <div className="admin-requests__updating">
                      <LoaderCircle
                        size={16}
                        className="admin-page__spinner"
                      />

                      <span>
                        جاري تحديث حالة الطلب...
                      </span>
                    </div>
                  )}
                </div>

                {/* DATES */}

                <div className="admin-requests__dates">
                  <div>
                    <span>
                      تاريخ الإرسال
                    </span>

                    <strong>
                      {formatDate(
                        selectedRequest.created_at
                      )}
                    </strong>
                  </div>

                  {selectedRequest.updated_at && (
                    <div>
                      <span>
                        آخر تحديث
                      </span>

                      <strong>
                        {formatDate(
                          selectedRequest.updated_at
                        )}
                      </strong>
                    </div>
                  )}
                </div>

                {/* REQUEST ID */}

                <div className="admin-requests__request-id">
                  <span>
                    رقم الطلب
                  </span>

                  <code>
                    {selectedRequest.id}
                  </code>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}