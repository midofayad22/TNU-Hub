import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FormEvent } from "react";

import {
  Plus,
  ShieldCheck,
  Users,
  Search,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

type AdminRole = "admin" | "root_admin";

type AdminPermission = {
  id: string;
  admin_id: string;
  section: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

type AdminProfile = {
  id: string;
  full_name: string;
  email: string;
  role: AdminRole;
  created_at: string;
};

const permissionLabels: Record<string, string> = {
  announcements: "الإعلانات",
  events: "الفعاليات",
  requests: "الطلبات",
  resources: "المصادر",
  faculties: "الكليات والبرامج",
  students: "الطلاب",
};

export default function Admins() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [permissionsList, setPermissionsList] = useState<
    AdminPermission[]
  >([]);

  const [studentCount, setStudentCount] = useState(0);

  /*
   * نبدأ بحالة Loading = true
   * حتى لا نحتاج إلى setIsLoading(true) داخل useEffect.
   */
  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [permissions, setPermissions] = useState({
    announcements: false,
    events: false,
    requests: false,
    resources: false,
    faculties: false,
    students: false,
  });

  /*
   * جلب المشرفين والطلاب والصلاحيات من Supabase.
   *
   * مهم:
   * لا يوجد أي setState قبل أول await.
   * وهذا يمنع تحذير React:
   * Calling setState synchronously within an effect...
   */
  const loadAdminsData = useCallback(async () => {
    try {
      /*
       * نبدأ بطلبات Supabase مباشرة.
       * Promise.all يسمح بجلب البيانات في نفس الوقت.
       */
      const [
        {
          data: adminData,
          error: adminError,
        },
        {
          count: studentsCount,
          error: studentsError,
        },
        {
          data: permissionData,
          error: permissionError,
        },
      ] = await Promise.all([
        /*
         * جلب جميع الحسابات الإدارية.
         */
        supabase
          .from("profiles")
          .select(
            "id, full_name, email, role, created_at"
          )
          .in("role", ["admin", "root_admin"])
          .order("created_at", {
            ascending: true,
          }),

        /*
         * جلب عدد الطلاب.
         */
        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("role", "student"),

        /*
         * جلب جميع صلاحيات المشرفين.
         */
        supabase
          .from("admin_permissions")
          .select(
            "id, admin_id, section, can_view, can_add, can_edit, can_delete"
          ),
      ]);

      /*
       * التحقق من أخطاء تحميل المشرفين.
       */
      if (adminError) {
        console.error(
          "Load admins error:",
          adminError
        );

        throw new Error(
          "فشل تحميل بيانات المشرفين."
        );
      }

      /*
       * التحقق من خطأ عدد الطلاب.
       */
      if (studentsError) {
        console.error(
          "Load students count error:",
          studentsError
        );

        throw new Error(
          "فشل تحميل عدد الطلاب."
        );
      }

      /*
       * التحقق من خطأ الصلاحيات.
       */
      if (permissionError) {
        console.error(
          "Load permissions error:",
          permissionError
        );

        throw new Error(
          "فشل تحميل صلاحيات المشرفين."
        );
      }

      /*
       * تحديث البيانات بعد اكتمال طلبات Supabase.
       */
      setAdmins(
        (adminData || []) as AdminProfile[]
      );

      setStudentCount(
        studentsCount || 0
      );

      setPermissionsList(
        (permissionData || []) as AdminPermission[]
      );

      /*
       * إذا نجح التحميل نمسح رسالة الخطأ.
       */
      setLoadError("");
    } catch (error) {
      console.error(
        "Unexpected load admins error:",
        error
      );

      setLoadError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحميل البيانات."
      );
    } finally {
      /*
       * إيقاف Loading بعد انتهاء الطلب.
       */
      setIsLoading(false);
    }
  }, []);

  /*
   * تحميل البيانات عند فتح الصفحة.
   *
   * هنا لا يوجد setState مباشر داخل الـ Effect.
   */
  useEffect(() => {
    void loadAdminsData();
  }, [loadAdminsData]);

  /*
   * الصلاحيات الخاصة بكل مشرف.
   */
  const getAdminPermissions = (
    adminId: string
  ) => {
    return permissionsList.filter(
      (permission) =>
        permission.admin_id === adminId
    );
  };

  /*
   * البحث في المشرفين.
   */
  const filteredAdmins = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return admins;
    }

    return admins.filter((admin) => {
      const nameMatch = admin.full_name
        .toLowerCase()
        .includes(normalizedSearch);

      const emailMatch = admin.email
        .toLowerCase()
        .includes(normalizedSearch);

      return nameMatch || emailMatch;
    });
  }, [admins, searchTerm]);

  /*
   * تغيير صلاحية.
   */
  const handlePermissionChange = (
    permission: keyof typeof permissions
  ) => {
    setPermissions((current) => ({
      ...current,
      [permission]: !current[permission],
    }));
  };

  /*
   * إغلاق Modal وإعادة ضبط البيانات.
   */
  const handleCloseModal = () => {
    if (isSubmitting) return;

    setShowAddModal(false);
    setShowPassword(false);
    setName("");
    setEmail("");
    setPassword("");

    setPermissions({
      announcements: false,
      events: false,
      requests: false,
      resources: false,
      faculties: false,
      students: false,
    });
  };

  /*
   * إعادة تحميل البيانات.
   *
   * هذا يتم من onClick وليس من useEffect،
   * لذلك setState هنا مسموح.
   */
  const handleRetry = () => {
    setIsLoading(true);
    setLoadError("");

    void loadAdminsData();
  };

  /*
   * إنشاء مشرف جديد.
   */
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "create-admin",
          {
            body: {
              name: name.trim(),
              email: email.trim(),
              password,
              permissions,
            },
          }
        );

      if (error) {
        console.error(
          "Create admin error:",
          error
        );

        alert(
          "حدث خطأ أثناء إنشاء المشرف."
        );

        return;
      }

      if (!data?.success) {
        alert(
          data?.error ||
            "فشل إنشاء المشرف."
        );

        return;
      }

      alert(
        "تم إنشاء المشرف بنجاح."
      );

      handleCloseModal();

      /*
       * تحديث القائمة بعد الإنشاء مباشرة.
       */
      await loadAdminsData();
    } catch (error) {
      console.error(
        "Unexpected create admin error:",
        error
      );

      alert(
        "حدث خطأ غير متوقع أثناء إنشاء المشرف."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="admin-page"
      dir="rtl"
    >
      {/* Header */}
      <section className="admin-page__header">
        <div>
          <span className="admin-page__kicker">
            الإدارة العامة
          </span>

          <h1>
            إدارة المشرفين
          </h1>

          <p>
            إدارة حسابات المشرفين وتحديد الصلاحيات الخاصة بكل مشرف.
          </p>
        </div>

        <div className="admin-page__header-actions">
          <button
            type="button"
            className="admin-primary-button"
            onClick={() =>
              setShowAddModal(true)
            }
          >
            <Plus size={18} />

            <span>
              إضافة مشرف
            </span>
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <div className="admin-stat-card__top">
            <span>
              إجمالي المشرفين
            </span>

            <div className="admin-stat-card__icon">
              <ShieldCheck size={19} />
            </div>
          </div>

          <div className="admin-stat-card__value">
            {isLoading ? "—" : admins.length}
          </div>

          <div className="admin-stat-card__bottom">
            <span>
              المشرفون المسجلون
            </span>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-card__top">
            <span>
              الطلاب
            </span>

            <div className="admin-stat-card__icon">
              <Users size={19} />
            </div>
          </div>

          <div className="admin-stat-card__value">
            {isLoading ? "—" : studentCount}
          </div>

          <div className="admin-stat-card__bottom">
            <span>
              الحسابات الطلابية
            </span>
          </div>
        </article>
      </section>

      {/* Admins List */}
      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <span className="admin-panel__kicker">
              الحسابات
            </span>

            <h2>
              المشرفون
            </h2>
          </div>
        </div>

        {/* Search */}
        <div className="admin-search">
          <Search size={18} />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="ابحث عن مشرف..."
            aria-label="البحث عن مشرف"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="admin-empty-state">
            <div className="admin-empty-state__icon">
              <ShieldCheck size={28} />
            </div>

            <h3>
              جاري تحميل المشرفين...
            </h3>

            <p>
              يتم جلب بيانات المشرفين والصلاحيات من النظام.
            </p>
          </div>
        )}

        {/* Error */}
        {!isLoading && loadError && (
          <div className="admin-empty-state">
            <div className="admin-empty-state__icon">
              <ShieldCheck size={28} />
            </div>

            <h3>
              تعذر تحميل البيانات
            </h3>

            <p>
              {loadError}
            </p>

            <button
              type="button"
              className="admin-primary-button"
              onClick={handleRetry}
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* No Admins */}
        {!isLoading &&
          !loadError &&
          admins.length === 0 && (
            <div className="admin-empty-state">
              <div className="admin-empty-state__icon">
                <ShieldCheck size={28} />
              </div>

              <h3>
                لا يوجد مشرفون حاليًا
              </h3>

              <p>
                يمكنك إضافة أول مشرف من خلال زر "إضافة مشرف".
              </p>

              <button
                type="button"
                className="admin-primary-button"
                onClick={() =>
                  setShowAddModal(true)
                }
              >
                <Plus size={18} />

                إضافة مشرف
              </button>
            </div>
          )}

        {/* No Search Results */}
        {!isLoading &&
          !loadError &&
          admins.length > 0 &&
          filteredAdmins.length === 0 && (
            <div className="admin-empty-state">
              <div className="admin-empty-state__icon">
                <Search size={28} />
              </div>

              <h3>
                لا توجد نتائج
              </h3>

              <p>
                لم نجد مشرفًا يطابق كلمة البحث.
              </p>
            </div>
          )}

        {/* Admin Cards */}
        {!isLoading &&
          !loadError &&
          filteredAdmins.length > 0 && (
            <div className="admin-list">
              {filteredAdmins.map(
                (admin) => {
                  const adminPermissions =
                    getAdminPermissions(
                      admin.id
                    );

                  return (
                    <article
                      key={admin.id}
                      className="admin-card"
                    >
                      {/* Card Header */}
                      <div className="admin-card__header">
                        <div className="admin-card__identity">
                          <div className="admin-card__avatar">
                            {admin.full_name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <h3>
                              {admin.full_name}
                            </h3>

                            <p>
                              {admin.email}
                            </p>
                          </div>
                        </div>

                        <div className="admin-card__role">
                          {admin.role ===
                          "root_admin"
                            ? "Root Admin"
                            : "Admin"}
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="admin-card__permissions">
                        <div className="admin-card__permissions-title">
                          <ShieldCheck
                            size={17}
                          />

                          <span>
                            الصلاحيات
                          </span>
                        </div>

                        {admin.role ===
                        "root_admin" ? (
                          <div className="admin-card__permission-badge admin-card__permission-badge--root">
                            جميع الصلاحيات
                          </div>
                        ) : adminPermissions.filter(
                            (permission) =>
                              permission.can_view
                          ).length > 0 ? (
                          <div className="admin-card__permission-list">
                            {adminPermissions
                              .filter(
                                (
                                  permission
                                ) =>
                                  permission.can_view
                              )
                              .map(
                                (
                                  permission
                                ) => (
                                  <span
                                    key={
                                      permission.id
                                    }
                                    className="admin-card__permission-badge"
                                  >
                                    {permissionLabels[
                                      permission
                                        .section
                                    ] ||
                                      permission.section}
                                  </span>
                                )
                              )}
                          </div>
                        ) : (
                          <span className="admin-card__no-permissions">
                            لا توجد صلاحيات محددة
                          </span>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
      </section>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div
          className="admin-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !isSubmitting
            ) {
              handleCloseModal();
            }
          }}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-admin-title"
          >
            {/* Modal Header */}
            <div className="admin-modal__header">
              <div>
                <span className="admin-modal__kicker">
                  إدارة المشرفين
                </span>

                <h2 id="add-admin-title">
                  إضافة مشرف جديد
                </h2>

                <p>
                  أنشئ حساب مشرف جديد وحدد الصلاحيات الخاصة به.
                </p>
              </div>

              <button
                type="button"
                className="admin-modal__close"
                onClick={handleCloseModal}
                aria-label="إغلاق"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form
              className="admin-modal__form"
              onSubmit={handleSubmit}
            >
              {/* Name */}
              <div className="admin-form-field">
                <label htmlFor="admin-name">
                  الاسم الكامل
                </label>

                <input
                  id="admin-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="مثال: أحمد محمد"
                  autoComplete="name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Email */}
              <div className="admin-form-field">
                <label htmlFor="admin-email">
                  البريد الإلكتروني
                </label>

                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="example@tnu.edu.eg"
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Password */}
              <div className="admin-form-field">
                <label htmlFor="admin-password">
                  كلمة المرور
                </label>

                <div className="admin-form-password">
                  <input
                    id="admin-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="أدخل كلمة مرور مؤقتة"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={isSubmitting}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? "إخفاء كلمة المرور"
                        : "إظهار كلمة المرور"
                    }
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Permissions */}
              <div className="admin-permissions">
                <div className="admin-permissions__header">
                  <div>
                    <span>
                      الصلاحيات
                    </span>

                    <p>
                      حدد الأقسام التي يستطيع المشرف إدارتها.
                    </p>
                  </div>

                  <ShieldCheck size={20} />
                </div>

                <div className="admin-permissions__grid">
                  <label className="admin-permission">
                    <input
                      type="checkbox"
                      checked={
                        permissions.announcements
                      }
                      onChange={() =>
                        handlePermissionChange(
                          "announcements"
                        )
                      }
                      disabled={isSubmitting}
                    />

                    <span>
                      الإعلانات
                    </span>
                  </label>

                  <label className="admin-permission">
                    <input
                      type="checkbox"
                      checked={
                        permissions.events
                      }
                      onChange={() =>
                        handlePermissionChange(
                          "events"
                        )
                      }
                      disabled={isSubmitting}
                    />

                    <span>
                      الفعاليات
                    </span>
                  </label>

                  <label className="admin-permission">
                    <input
                      type="checkbox"
                      checked={
                        permissions.requests
                      }
                      onChange={() =>
                        handlePermissionChange(
                          "requests"
                        )
                      }
                      disabled={isSubmitting}
                    />

                    <span>
                      الطلبات
                    </span>
                  </label>

                  <label className="admin-permission">
                    <input
                      type="checkbox"
                      checked={
                        permissions.resources
                      }
                      onChange={() =>
                        handlePermissionChange(
                          "resources"
                        )
                      }
                      disabled={isSubmitting}
                    />

                    <span>
                      المصادر
                    </span>
                  </label>

                  <label className="admin-permission">
                    <input
                      type="checkbox"
                      checked={
                        permissions.faculties
                      }
                      onChange={() =>
                        handlePermissionChange(
                          "faculties"
                        )
                      }
                      disabled={isSubmitting}
                    />

                    <span>
                      الكليات والبرامج
                    </span>
                  </label>

                  <label className="admin-permission">
                    <input
                      type="checkbox"
                      checked={
                        permissions.students
                      }
                      onChange={() =>
                        handlePermissionChange(
                          "students"
                        )
                      }
                      disabled={isSubmitting}
                    />

                    <span>
                      الطلاب
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="admin-modal__actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={isSubmitting}
                >
                  <Plus size={18} />

                  {isSubmitting
                    ? "جاري إنشاء المشرف..."
                    : "إضافة المشرف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}