import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
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

interface AdminActionRequest {
  id: number;
  admin_id: string;
  section:
    | "faculties"
    | "requests"
    | "announcements"
    | "resources"
    | "events";
  action: "add" | "edit" | "delete";
  target_id: string | null;
  payload: Record<string, unknown> | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RequestAdmin {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

type RequestStatus =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

type RequestSection =
  | "all"
  | "faculties"
  | "requests"
  | "announcements"
  | "resources"
  | "events";

const sectionLabels: Record<
  RequestSection,
  string
> = {
  all: "كل الأقسام",
  faculties: "الكليات والبرامج",
  requests: "طلبات الطلاب",
  announcements: "الإعلانات",
  resources: "المصادر",
  events: "الفعاليات",
};

const actionLabels: Record<
  AdminActionRequest["action"],
  string
> = {
  add: "إضافة",
  edit: "تعديل",
  delete: "حذف",
};

const statusLabels: Record<
  RequestStatus,
  string
> = {
  all: "الكل",
  pending: "قيد المراجعة",
  approved: "تمت الموافقة",
  rejected: "مرفوض",
};

function getSectionLabel(
  section: AdminActionRequest["section"]
) {
  return sectionLabels[section];
}

function getActionLabel(
  action: AdminActionRequest["action"]
) {
  return actionLabels[action];
}

function getStatusLabel(
  status: AdminActionRequest["status"]
) {
  return statusLabels[status];
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(
      "ar-EG",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(new Date(value));
  } catch {
    return value;
  }
}

function getEntity(
  request: AdminActionRequest
) {
  const payload = request.payload;

  if (!payload) {
    return null;
  }

  if (
    typeof payload.entity === "string"
  ) {
    return payload.entity;
  }

  if (
    payload.faculty &&
    typeof payload.faculty === "object"
  ) {
    return "faculty";
  }

  if (
    typeof payload.faculty_id ===
      "string" &&
    request.section === "faculties"
  ) {
    return "program";
  }

  if (
    request.section === "faculties" &&
    typeof payload.name === "string" &&
    typeof payload.description ===
      "string" &&
    "icon" in payload
  ) {
    return "faculty";
  }

  return null;
}

function getRequestTitle(
  request: AdminActionRequest
) {
  const payload = request.payload;
  const entity = getEntity(request);

  if (
    entity === "faculty" &&
    payload
  ) {
    if (
      payload.faculty &&
      typeof payload.faculty ===
        "object"
    ) {
      const faculty =
        payload.faculty as Record<
          string,
          unknown
        >;

      if (
        typeof faculty.name ===
        "string"
      ) {
        return faculty.name;
      }
    }

    if (
      typeof payload.name ===
      "string"
    ) {
      return payload.name;
    }
  }

  if (
    entity === "program" &&
    payload &&
    typeof payload.name ===
      "string"
  ) {
    return payload.name;
  }

  if (
    payload &&
    typeof payload.title ===
      "string"
  ) {
    return payload.title;
  }

  if (
    payload &&
    typeof payload.name ===
      "string"
  ) {
    return payload.name;
  }

  return request.target_id
    ? `العنصر ${request.target_id}`
    : "طلب إداري";
}

export default function AdminApprovals() {
  const { profile } = useAuth();

  const [requests, setRequests] =
    useState<AdminActionRequest[]>(
      []
    );

  const [admins, setAdmins] =
    useState<
      Record<string, RequestAdmin>
    >({});

  const [loading, setLoading] =
    useState(true);

  const [
    processingId,
    setProcessingId,
  ] = useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<RequestStatus>("pending");

  const [sectionFilter, setSectionFilter] =
    useState<RequestSection>("all");

  const [selectedRequest, setSelectedRequest] =
    useState<AdminActionRequest | null>(
      null
    );

  const isRootAdmin =
    profile?.role === "root_admin";

  const loadRequests = useCallback(
    async () => {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      if (!isRootAdmin) {
        setRequests([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const {
          data,
          error: requestsError,
        } = await supabase
          .from("admin_action_requests")
          .select(
            "id, admin_id, section, action, target_id, payload, reason, status, reviewed_by, reviewed_at, created_at, updated_at"
          )
          .order("created_at", {
            ascending: false,
          });

        if (requestsError) {
          throw requestsError;
        }

        const loadedRequests =
          (data ??
            []) as AdminActionRequest[];

        setRequests(
          loadedRequests
        );

        const adminIds = Array.from(
          new Set(
            loadedRequests
              .map(
                (request) =>
                  request.admin_id
              )
              .filter(Boolean)
          )
        );

        if (adminIds.length === 0) {
          setAdmins({});
          return;
        }

        const {
          data: adminProfiles,
          error: adminsError,
        } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, role"
          )
          .in("id", adminIds);

        if (adminsError) {
          throw adminsError;
        }

        const adminMap: Record<
          string,
          RequestAdmin
        > = {};

        (
          adminProfiles ?? []
        ).forEach((admin) => {
          adminMap[admin.id] =
            admin as RequestAdmin;
        });

        setAdmins(adminMap);
      } catch (err) {
        console.error(
          "Load admin approvals error:",
          err
        );

        setError(
          "تعذر تحميل طلبات الموافقة. حاول مرة أخرى."
        );
      } finally {
        setLoading(false);
      }
    },
    [profile?.id, isRootAdmin]
  );

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    void loadRequests();
  }, [profile?.id, loadRequests]);

  const filteredRequests =
    useMemo(() => {
      return requests.filter(
        (request) => {
          const matchesStatus =
            statusFilter === "all" ||
            request.status ===
              statusFilter;

          const matchesSection =
            sectionFilter === "all" ||
            request.section ===
              sectionFilter;

          return (
            matchesStatus &&
            matchesSection
          );
        }
      );
    }, [
      requests,
      statusFilter,
      sectionFilter,
    ]);

  const pendingCount = useMemo(() => {
    return requests.filter(
      (request) =>
        request.status === "pending"
    ).length;
  }, [requests]);

  const approvedCount = useMemo(() => {
    return requests.filter(
      (request) =>
        request.status === "approved"
    ).length;
  }, [requests]);

  const rejectedCount = useMemo(() => {
    return requests.filter(
      (request) =>
        request.status === "rejected"
    ).length;
  }, [requests]);

  const getAdminName = (
    adminId: string
  ) => {
    return (
      admins[adminId]?.full_name ||
      admins[adminId]?.email ||
      adminId
    );
  };

  const getPayloadForOperation =
    (
      request: AdminActionRequest
    ) => {
      if (!request.payload) {
        return {};
      }

      const payload = {
        ...request.payload,
      };

      delete payload.entity;

      return payload;
    };

  const executeFacultyRequest =
    async (
      request: AdminActionRequest
    ) => {
      const payload =
        request.payload ?? {};

      const entity =
        getEntity(request);

      if (entity === "faculty") {
        if (
          request.action ===
          "delete"
        ) {
          let facultyData:
            | Record<
                string,
                unknown
              >
            | null = null;

          let programsData:
            | Array<
                Record<
                  string,
                  unknown
                >
              >
            | [] = [];

          if (
            payload.faculty &&
            typeof payload.faculty ===
              "object"
          ) {
            facultyData =
              payload.faculty as Record<
                string,
                unknown
              >;
          } else {
            facultyData = {
              id:
                request.target_id,
              name:
                typeof payload.name ===
                "string"
                  ? payload.name
                  : "",
              description:
                typeof payload.description ===
                "string"
                  ? payload.description
                  : "",
              icon:
                typeof payload.icon ===
                "string"
                  ? payload.icon
                  : "",
            };
          }

          if (
            Array.isArray(
              payload.programs
            )
          ) {
            programsData =
              payload.programs.filter(
                (
                  program
                ): program is Record<
                  string,
                  unknown
                > =>
                  Boolean(
                    program &&
                      typeof program ===
                        "object"
                  )
              );
          }

          const facultyId =
            typeof facultyData.id ===
            "string"
              ? facultyData.id
              : request.target_id;

          if (!facultyId) {
            throw new Error(
              "لم يتم العثور على معرّف الكلية."
            );
          }

          if (
            programsData.length >
            0
          ) {
            const programIds =
              programsData
                .map(
                  (program) =>
                    program.id
                )
                .filter(
                  (
                    id
                  ): id is string =>
                    typeof id ===
                    "string"
                );

            if (
              programIds.length >
              0
            ) {
              const {
                error:
                  programsDeleteError,
              } = await supabase
                .from("programs")
                .delete()
                .in(
                  "id",
                  programIds
                );

              if (
                programsDeleteError
              ) {
                throw programsDeleteError;
              }
            }
          }

          const {
            error:
              facultyDeleteError,
          } = await supabase
            .from("faculties")
            .delete()
            .eq(
              "id",
              facultyId
            );

          if (
            facultyDeleteError
          ) {
            throw facultyDeleteError;
          }

          return;
        }

        const facultyPayload =
          getPayloadForOperation(
            request
          );

        delete facultyPayload.id;

        if (
          request.action === "add"
        ) {
          const facultyId =
            typeof request.payload
              ?.id === "string"
              ? request.payload.id
              : request.target_id;

          if (!facultyId) {
            throw new Error(
              "لم يتم العثور على معرّف الكلية."
            );
          }

          const { error } =
            await supabase
              .from("faculties")
              .insert({
                id: facultyId,
                ...facultyPayload,
              });

          if (error) {
            throw error;
          }

          return;
        }

        if (
          request.action ===
          "edit"
        ) {
          if (!request.target_id) {
            throw new Error(
              "لم يتم العثور على الكلية المطلوب تعديلها."
            );
          }

          const { error } =
            await supabase
              .from("faculties")
              .update(
                facultyPayload
              )
              .eq(
                "id",
                request.target_id
              );

          if (error) {
            throw error;
          }
        }

        return;
      }

      if (entity === "program") {
        const programPayload =
          getPayloadForOperation(
            request
          );

        delete programPayload.id;

        if (
          request.action === "add"
        ) {
          const programId =
            typeof request.payload
              ?.id === "string"
              ? request.payload.id
              : request.target_id;

          if (!programId) {
            throw new Error(
              "لم يتم العثور على معرّف البرنامج."
            );
          }

          const { error } =
            await supabase
              .from("programs")
              .insert({
                id: programId,
                ...programPayload,
              });

          if (error) {
            throw error;
          }

          return;
        }

        if (
          request.action ===
          "edit"
        ) {
          if (!request.target_id) {
            throw new Error(
              "لم يتم العثور على البرنامج المطلوب تعديله."
            );
          }

          const { error } =
            await supabase
              .from("programs")
              .update(
                programPayload
              )
              .eq(
                "id",
                request.target_id
              );

          if (error) {
            throw error;
          }

          return;
        }

        if (
          request.action ===
          "delete"
        ) {
          if (!request.target_id) {
            throw new Error(
              "لم يتم العثور على البرنامج المطلوب حذفه."
            );
          }

          const { error } =
            await supabase
              .from("programs")
              .delete()
              .eq(
                "id",
                request.target_id
              );

          if (error) {
            throw error;
          }
        }

        return;
      }

      throw new Error(
        "تعذر تحديد نوع العنصر داخل طلب الكليات."
      );
    };

  const executeGenericRequest =
    async (
      request: AdminActionRequest
    ) => {
      const table =
        request.section;

      if (
        request.action ===
        "delete"
      ) {
        if (!request.target_id) {
          throw new Error(
            "لم يتم العثور على معرّف العنصر المطلوب حذفه."
          );
        }

        const { error } =
          await supabase
            .from(table)
            .delete()
            .eq(
              "id",
              request.target_id
            );

        if (error) {
          throw error;
        }

        return;
      }

      const payload =
        getPayloadForOperation(
          request
        );

      if (
        request.action === "add"
      ) {
        if (
          Object.keys(payload)
            .length === 0
        ) {
          throw new Error(
            "بيانات الإضافة غير موجودة."
          );
        }

        const { error } =
          await supabase
            .from(table)
            .insert(payload);

        if (error) {
          throw error;
        }

        return;
      }

      if (
        request.action ===
        "edit"
      ) {
        if (!request.target_id) {
          throw new Error(
            "لم يتم العثور على معرّف العنصر المطلوب تعديله."
          );
        }

        const { error } =
          await supabase
            .from(table)
            .update(payload)
            .eq(
              "id",
              request.target_id
            );

        if (error) {
          throw error;
        }
      }
    };

  const executeRequest = async (
    request: AdminActionRequest
  ) => {
    if (
      request.section ===
      "faculties"
    ) {
      await executeFacultyRequest(
        request
      );

      return;
    }

    await executeGenericRequest(
      request
    );
  };

  const approveRequest =
    async (
      request: AdminActionRequest
    ) => {
      if (!isRootAdmin) {
        setError(
          "الموافقة على الطلبات متاحة لـ Root Admin فقط."
        );
        return;
      }

      if (
        request.status !==
        "pending"
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `هل تريد الموافقة على طلب ${getActionLabel(
            request.action
          )} في قسم ${getSectionLabel(
            request.section
          )}؟`
        );

      if (!confirmed) {
        return;
      }

      setProcessingId(
        request.id
      );
      setError("");
      setSuccess("");

      try {
        await executeRequest(
          request
        );

        const {
          data: updatedRequest,
          error: updateError,
        } = await supabase
          .from(
            "admin_action_requests"
          )
          .update({
            status: "approved",
            reviewed_by:
              profile?.id,
            reviewed_at:
              new Date().toISOString(),
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            request.id
          )
          .eq(
            "status",
            "pending"
          )
          .select(
            "id, admin_id, section, action, target_id, payload, reason, status, reviewed_by, reviewed_at, created_at, updated_at"
          )
          .maybeSingle();

        if (updateError) {
          throw updateError;
        }

        if (!updatedRequest) {
          throw new Error(
            "تم تنفيذ العملية، لكن تعذر تحديث حالة الطلب."
          );
        }

        setSuccess(
          "تمت الموافقة على الطلب وتنفيذ العملية بنجاح."
        );

        setSelectedRequest(
          null
        );

        await loadRequests();
      } catch (err) {
        console.error(
          "Approve admin request error:",
          err
        );

        setError(
          "تعذر تنفيذ الطلب. لم يتم تحويله إلى Approved."
        );
      } finally {
        setProcessingId(null);
      }
    };

  const rejectRequest =
    async (
      request: AdminActionRequest
    ) => {
      if (!isRootAdmin) {
        setError(
          "رفض الطلبات متاح لـ Root Admin فقط."
        );
        return;
      }

      if (
        request.status !==
        "pending"
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `هل تريد رفض طلب ${getActionLabel(
            request.action
          )} في قسم ${getSectionLabel(
            request.section
          )}؟`
        );

      if (!confirmed) {
        return;
      }

      setProcessingId(
        request.id
      );
      setError("");
      setSuccess("");

      try {
        const {
          data: updatedRequest,
          error: updateError,
        } = await supabase
          .from(
            "admin_action_requests"
          )
          .update({
            status: "rejected",
            reviewed_by:
              profile?.id,
            reviewed_at:
              new Date().toISOString(),
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            request.id
          )
          .eq(
            "status",
            "pending"
          )
          .select(
            "id, admin_id, section, action, target_id, payload, reason, status, reviewed_by, reviewed_at, created_at, updated_at"
          )
          .maybeSingle();

        if (updateError) {
          throw updateError;
        }

        if (!updatedRequest) {
          throw new Error(
            "تعذر تحديث حالة الطلب."
          );
        }

        setSuccess(
          "تم رفض الطلب بنجاح."
        );

        setSelectedRequest(
          null
        );

        await loadRequests();
      } catch (err) {
        console.error(
          "Reject admin request error:",
          err
        );

        setError(
          "تعذر رفض الطلب. حاول مرة أخرى."
        );
      } finally {
        setProcessingId(null);
      }
    };

  if (!profile) {
    return null;
  }

  if (!isRootAdmin) {
    return (
      <div
        className="admin-page admin-approvals-page"
        dir="rtl"
      >
        <section className="admin-panel admin-panel--empty">
          <div className="admin-empty-state">
            <ShieldCheck size={34} />

            <h2>
              لا تملك صلاحية الوصول
            </h2>

            <p>
              مركز الموافقات متاح لـ
              Root Admin فقط.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      className="admin-page admin-approvals-page"
      dir="rtl"
    >
      <section className="admin-page__header">
        <div>
          <span className="admin-page__kicker">
            الإدارة والتحكم
          </span>

          <h1>
            مركز الموافقات
          </h1>

          <p>
            مراجعة وإدارة جميع طلبات
            المشرفين الفرعيين من مكان
            واحد.
          </p>
        </div>

        <div className="admin-page__header-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() =>
              void loadRequests()
            }
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "admin-spin"
                  : ""
              }
            />

            <span>
              تحديث
            </span>
          </button>
        </div>
      </section>

      {error && (
        <div className="admin-alert admin-alert--error">
          <AlertCircle size={18} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert--success">
          <CheckCircle2 size={18} />

          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <div className="admin-stat-card__icon">
            <Clock3 size={20} />
          </div>

          <div>
            <span>
              قيد المراجعة
            </span>

            <strong>
              {pendingCount}
            </strong>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-card__icon">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>
              تمت الموافقة
            </span>

            <strong>
              {approvedCount}
            </strong>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-card__icon">
            <XCircle size={20} />
          </div>

          <div>
            <span>
              مرفوضة
            </span>

            <strong>
              {rejectedCount}
            </strong>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-card__icon">
            <ShieldCheck size={20} />
          </div>

          <div>
            <span>
              إجمالي الطلبات
            </span>

            <strong>
              {requests.length}
            </strong>
          </div>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <span className="admin-panel__kicker">
              الطلبات
            </span>

            <h2>
              طلبات المشرفين
            </h2>
          </div>
        </div>

        <div className="admin-filters">
          <div className="admin-filter">
            <label htmlFor="approval-status">
              الحالة
            </label>

            <div className="admin-select-wrapper">
              <select
                id="approval-status"
                value={
                  statusFilter
                }
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as RequestStatus
                  )
                }
              >
                <option value="pending">
                  قيد المراجعة
                </option>

                <option value="approved">
                  تمت الموافقة
                </option>

                <option value="rejected">
                  مرفوضة
                </option>

                <option value="all">
                  الكل
                </option>
              </select>

              <ChevronDown
                size={16}
              />
            </div>
          </div>

          <div className="admin-filter">
            <label htmlFor="approval-section">
              القسم
            </label>

            <div className="admin-select-wrapper">
              <select
                id="approval-section"
                value={
                  sectionFilter
                }
                onChange={(event) =>
                  setSectionFilter(
                    event.target
                      .value as RequestSection
                  )
                }
              >
                <option value="all">
                  كل الأقسام
                </option>

                <option value="faculties">
                  الكليات والبرامج
                </option>

                <option value="requests">
                  طلبات الطلاب
                </option>

                <option value="announcements">
                  الإعلانات
                </option>

                <option value="resources">
                  المصادر
                </option>

                <option value="events">
                  الفعاليات
                </option>
              </select>

              <ChevronDown
                size={16}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">
            <Loader2
              size={28}
              className="admin-spin"
            />

            <span>
              جاري تحميل الطلبات...
            </span>
          </div>
        ) : filteredRequests.length ===
          0 ? (
          <div className="admin-empty-state">
            <CheckCircle2 size={32} />

            <h2>
              لا توجد طلبات
            </h2>

            <p>
              لا توجد طلبات مطابقة
              للفلاتر الحالية.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    المشرف
                  </th>

                  <th>
                    القسم
                  </th>

                  <th>
                    العملية
                  </th>

                  <th>
                    العنصر
                  </th>

                  <th>
                    التاريخ
                  </th>

                  <th>
                    الحالة
                  </th>

                  <th>
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map(
                  (request) => {
                    const isProcessing =
                      processingId ===
                      request.id;

                    return (
                      <tr
                        key={
                          request.id
                        }
                      >
                        <td>
                          <div className="admin-table-user">
                            <strong>
                              {getAdminName(
                                request.admin_id
                              )}
                            </strong>

                            {admins[
                              request
                                .admin_id
                            ]?.email && (
                              <span>
                                {
                                  admins[
                                    request
                                      .admin_id
                                  ]
                                    .email
                                }
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span>
                            {getSectionLabel(
                              request.section
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="admin-badge">
                            {getActionLabel(
                              request.action
                            )}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {getRequestTitle(
                              request
                            )}
                          </strong>
                        </td>

                        <td>
                          <span>
                            {formatDate(
                              request.created_at
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-badge admin-badge--${request.status}`}
                          >
                            {getStatusLabel(
                              request.status
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="admin-table-actions">
                            <button
                              type="button"
                              className="admin-secondary-button"
                              onClick={() =>
                                setSelectedRequest(
                                  request
                                )
                              }
                            >
                              مراجعة
                            </button>

                            {request.status ===
                              "pending" && (
                              <>
                                <button
                                  type="button"
                                  className="admin-primary-button"
                                  onClick={() =>
                                    void approveRequest(
                                      request
                                    )
                                  }
                                  disabled={
                                    isProcessing
                                  }
                                >
                                  {isProcessing ? (
                                    <Loader2
                                      size={
                                        15
                                      }
                                      className="admin-spin"
                                    />
                                  ) : (
                                    <CheckCircle2
                                      size={
                                        15
                                      }
                                    />
                                  )}

                                  موافقة
                                </button>

                                <button
                                  type="button"
                                  className="admin-icon-button admin-icon-button--danger"
                                  title="رفض الطلب"
                                  onClick={() =>
                                    void rejectRequest(
                                      request
                                    )
                                  }
                                  disabled={
                                    isProcessing
                                  }
                                >
                                  <XCircle
                                    size={
                                      16
                                    }
                                  />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedRequest && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedRequest(
                null
              );
            }
          }}
        >
          <div
            className="admin-modal admin-approval-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal__header">
              <div>
                <span className="admin-panel__kicker">
                  مراجعة الطلب
                </span>

                <h2>
                  {getRequestTitle(
                    selectedRequest
                  )}
                </h2>
              </div>

              <button
                type="button"
                className="admin-modal__close"
                onClick={() =>
                  setSelectedRequest(
                    null
                  )
                }
                disabled={
                  processingId ===
                  selectedRequest.id
                }
                aria-label="إغلاق"
              >
                <X size={19} />
              </button>
            </div>

            <div className="admin-approval-details">
              <div className="admin-approval-detail">
                <span>
                  المشرف
                </span>

                <strong>
                  {getAdminName(
                    selectedRequest.admin_id
                  )}
                </strong>
              </div>

              <div className="admin-approval-detail">
                <span>
                  القسم
                </span>

                <strong>
                  {getSectionLabel(
                    selectedRequest.section
                  )}
                </strong>
              </div>

              <div className="admin-approval-detail">
                <span>
                  العملية
                </span>

                <strong>
                  {getActionLabel(
                    selectedRequest.action
                  )}
                </strong>
              </div>

              <div className="admin-approval-detail">
                <span>
                  الحالة
                </span>

                <strong>
                  {getStatusLabel(
                    selectedRequest.status
                  )}
                </strong>
              </div>

              <div className="admin-approval-detail">
                <span>
                  تاريخ الطلب
                </span>

                <strong>
                  {formatDate(
                    selectedRequest.created_at
                  )}
                </strong>
              </div>

              {selectedRequest.target_id && (
                <div className="admin-approval-detail">
                  <span>
                    المعرّف
                  </span>

                  <strong>
                    {
                      selectedRequest.target_id
                    }
                  </strong>
                </div>
              )}
            </div>

            {selectedRequest.reason && (
              <div className="admin-form__notice">
                <strong>
                  سبب الطلب
                </strong>

                <p>
                  {
                    selectedRequest.reason
                  }
                </p>
              </div>
            )}

            <div className="admin-approval-payload">
              <div className="admin-panel__header">
                <div>
                  <span className="admin-panel__kicker">
                    البيانات
                  </span>

                  <h3>
                    تفاصيل العملية
                  </h3>
                </div>
              </div>

              <pre>
                {JSON.stringify(
                  selectedRequest.payload,
                  null,
                  2
                )}
              </pre>
            </div>

            {selectedRequest.status ===
              "pending" && (
              <div className="admin-modal__actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() =>
                    setSelectedRequest(
                      null
                    )
                  }
                  disabled={
                    processingId ===
                    selectedRequest.id
                  }
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  className="admin-icon-button admin-icon-button--danger"
                  onClick={() =>
                    void rejectRequest(
                      selectedRequest
                    )
                  }
                  disabled={
                    processingId ===
                    selectedRequest.id
                  }
                >
                  {processingId ===
                  selectedRequest.id ? (
                    <Loader2
                      size={17}
                      className="admin-spin"
                    />
                  ) : (
                    <XCircle
                      size={17}
                    />
                  )}

                  رفض الطلب
                </button>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() =>
                    void approveRequest(
                      selectedRequest
                    )
                  }
                  disabled={
                    processingId ===
                    selectedRequest.id
                  }
                >
                  {processingId ===
                  selectedRequest.id ? (
                    <Loader2
                      size={17}
                      className="admin-spin"
                    />
                  ) : (
                    <CheckCircle2
                      size={17}
                    />
                  )}

                  الموافقة وتنفيذ
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}