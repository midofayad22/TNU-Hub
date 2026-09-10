import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { FormEvent } from "react";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

interface Resource {
  id: number;
  title: string;
  description: string;
  category: string;
  icon: string;
  created_at?: string;
  updated_at?: string;
}

type ModalMode =
  | "none"
  | "create"
  | "edit";

interface AdminPermission {
  id: string;
  admin_id: string;
  section: "resources";
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface ResourcePayload {
  title: string;
  description: string;
  category: string;
  icon: string;
}

export default function AdminResources() {
  const { profile } = useAuth();

  const [resources, setResources] = useState<Resource[]>(
    []
  );

  const [permissions, setPermissions] =
    useState<AdminPermission | null>(null);

  const [loading, setLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] =
    useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [modalMode, setModalMode] =
    useState<ModalMode>("none");

  const [resourceForm, setResourceForm] = useState({
    id: "",
    title: "",
    description: "",
    category: "",
    icon: "",
  });

  const isRootAdmin =
    profile?.role === "root_admin";

  const isAdmin =
    profile?.role === "admin" ||
    isRootAdmin;

  const canView =
    isRootAdmin ||
    permissions?.can_view === true;

  const canAdd =
    isRootAdmin ||
    permissions?.can_add === true;

  const canEdit =
    isRootAdmin ||
    permissions?.can_edit === true;

  const canDelete =
    isRootAdmin ||
    permissions?.can_delete === true;

  /*
   * Load permissions
   */
  const loadPermissions = useCallback(async () => {
    if (!profile?.id || isRootAdmin) {
      setPermissions(null);
      setPermissionsLoading(false);
      return;
    }

    setPermissionsLoading(true);

    try {
      const {
        data,
        error: permissionsError,
      } = await supabase
        .from("admin_permissions")
        .select(
          "id, admin_id, section, can_view, can_add, can_edit, can_delete"
        )
        .eq("admin_id", profile.id)
        .eq("section", "resources")
        .maybeSingle();

      if (permissionsError) {
        throw permissionsError;
      }

      setPermissions(
        (data ?? null) as AdminPermission | null
      );
    } catch (err) {
      console.error(
        "Admin resources permissions error:",
        err
      );

      setPermissions(null);

      setError(
        "تعذر تحميل صلاحيات إدارة المصادر."
      );
    } finally {
      setPermissionsLoading(false);
    }
  }, [profile?.id, isRootAdmin]);

  /*
   * Load resources
   */
  const loadResources = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data,
        error: resourcesError,
      } = await supabase
        .from("resources")
        .select(
          "id, title, description, category, icon, created_at, updated_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (resourcesError) {
        throw resourcesError;
      }

      setResources(data ?? []);
    } catch (err) {
      console.error(
        "Admin resources load error:",
        err
      );

      setError(
        "تعذر تحميل المصادر. حاول مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    void loadPermissions();
  }, [profile?.id, loadPermissions]);

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    if (isRootAdmin) {
      void loadResources();
      return;
    }

    if (!permissionsLoading && canView) {
      void loadResources();
    }
  }, [
    profile?.id,
    isRootAdmin,
    permissionsLoading,
    canView,
    loadResources,
  ]);

  /*
   * Search
   */
  const filteredResources = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return resources;
    }

    return resources.filter((resource) => {
      return (
        resource.title
          .toLowerCase()
          .includes(normalizedSearch) ||
        resource.description
          .toLowerCase()
          .includes(normalizedSearch) ||
        resource.category
          .toLowerCase()
          .includes(normalizedSearch) ||
        resource.icon
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(resource.id).includes(
          normalizedSearch
        )
      );
    });
  }, [resources, search]);

  /*
   * Reset form
   */
  const resetResourceForm = () => {
    setResourceForm({
      id: "",
      title: "",
      description: "",
      category: "",
      icon: "",
    });
  };

  /*
   * Close modal
   */
  const closeModal = () => {
    if (saving || deleting) {
      return;
    }

    setModalMode("none");
    resetResourceForm();
  };

  /*
   * Open create
   */
  const openCreateResource = () => {
    if (!canAdd) {
      setError(
        "ليس لديك صلاحية لإضافة المصادر."
      );
      return;
    }

    setError("");
    setSuccess("");

    resetResourceForm();

    setModalMode("create");
  };

  /*
   * Open edit
   */
  const openEditResource = (
    resource: Resource
  ) => {
    if (!canEdit) {
      setError(
        "ليس لديك صلاحية لتعديل المصادر."
      );
      return;
    }

    setError("");
    setSuccess("");

    setResourceForm({
      id: String(resource.id),
      title: resource.title,
      description: resource.description,
      category: resource.category,
      icon: resource.icon,
    });

    setModalMode("edit");
  };

  /*
   * Build payload
   */
  const buildPayload = (): ResourcePayload => {
    return {
      title: resourceForm.title.trim(),
      description:
        resourceForm.description.trim(),
      category:
        resourceForm.category.trim(),
      icon: resourceForm.icon.trim(),
    };
  };

  /*
   * Create action request
   */
  const createActionRequest = async (
    userId: string,
    action: "add" | "edit",
    payload: ResourcePayload,
    targetId?: string
  ) => {
    const { error: requestError } =
      await supabase
        .from("admin_action_requests")
        .insert({
          admin_id: userId,
          section: "resources",
          action,
          target_id: targetId ?? null,
          payload,
          reason:
            action === "add"
              ? "طلب إضافة مصدر جديد."
              : "طلب تعديل مصدر موجود.",
          status: "pending",
        });

    if (requestError) {
      throw requestError;
    }
  };

  /*
   * Create resource
   */
  const createResource = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!isAdmin) {
      setError(
        "ليس لديك صلاحية لإدارة المصادر."
      );
      return;
    }

    if (!canAdd) {
      setError(
        "ليس لديك صلاحية لإضافة المصادر."
      );
      return;
    }

    if (!resourceForm.title.trim()) {
      setError("أدخل اسم المصدر.");
      return;
    }

    if (!resourceForm.category.trim()) {
      setError("أدخل تصنيف المصدر.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = buildPayload();

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw (
          userError ??
          new Error("User is not authenticated.")
        );
      }

      /*
       * Root Admin:
       * execute directly.
       */
      if (isRootAdmin) {
        const {
          error: insertError,
        } = await supabase
          .from("resources")
          .insert(payload);

        if (insertError) {
          throw insertError;
        }

        setSuccess(
          "تمت إضافة المصدر بنجاح."
        );
      } else {
        /*
         * Sub Admin:
         * create approval request.
         */
        await createActionRequest(
          userData.user.id,
          "add",
          payload
        );

        setSuccess(
          "تم إرسال طلب إضافة المصدر إلى Root Admin للمراجعة."
        );
      }

      setModalMode("none");
      resetResourceForm();

      /*
       * Refresh only for Root Admin.
       * Sub Admin will wait for approval.
       */
      if (isRootAdmin) {
        await loadResources();
      }
    } catch (err) {
      console.error(
        "Create resource error:",
        err
      );

      setError(
        isRootAdmin
          ? "تعذر إضافة المصدر. حاول مرة أخرى."
          : "تعذر إرسال طلب إضافة المصدر. حاول مرة أخرى."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Update resource
   */
  const updateResource = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!isAdmin) {
      setError(
        "ليس لديك صلاحية لتعديل المصادر."
      );
      return;
    }

    if (!canEdit) {
      setError(
        "ليس لديك صلاحية لتعديل المصادر."
      );
      return;
    }

    if (!resourceForm.id) {
      setError(
        "تعذر تحديد المصدر المطلوب تعديله."
      );
      return;
    }

    if (!resourceForm.title.trim()) {
      setError("أدخل اسم المصدر.");
      return;
    }

    if (!resourceForm.category.trim()) {
      setError("أدخل تصنيف المصدر.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = buildPayload();

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw (
          userError ??
          new Error("User is not authenticated.")
        );
      }

      /*
       * Root Admin:
       * execute directly.
       */
      if (isRootAdmin) {
        const {
          error: updateError,
        } = await supabase
          .from("resources")
          .update(payload)
          .eq(
            "id",
            Number(resourceForm.id)
          );

        if (updateError) {
          throw updateError;
        }

        setSuccess(
          "تم تحديث المصدر بنجاح."
        );
      } else {
        /*
         * Sub Admin:
         * create approval request.
         */
        await createActionRequest(
          userData.user.id,
          "edit",
          payload,
          resourceForm.id
        );

        setSuccess(
          "تم إرسال طلب تعديل المصدر إلى Root Admin للمراجعة."
        );
      }

      setModalMode("none");
      resetResourceForm();

      /*
       * Refresh only for Root Admin.
       */
      if (isRootAdmin) {
        await loadResources();
      }
    } catch (err) {
      console.error(
        "Update resource error:",
        err
      );

      setError(
        isRootAdmin
          ? "تعذر تحديث المصدر. حاول مرة أخرى."
          : "تعذر إرسال طلب تعديل المصدر. حاول مرة أخرى."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Delete resource
   */
  const deleteResource = async (
    resource: Resource
  ) => {
    if (!isAdmin) {
      setError(
        "ليس لديك صلاحية لحذف المصادر."
      );
      return;
    }

    if (!canDelete) {
      setError(
        "ليس لديك صلاحية لحذف المصادر."
      );
      return;
    }

    const confirmed = window.confirm(
      isRootAdmin
        ? `هل تريد حذف المصدر "${resource.title}"؟`
        : `هل تريد إرسال طلب حذف المصدر "${resource.title}" إلى Root Admin؟`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        throw (
          userError ??
          new Error("User is not authenticated.")
        );
      }

      /*
       * Root Admin:
       * execute directly.
       */
      if (isRootAdmin) {
        const {
          error: deleteError,
        } = await supabase
          .from("resources")
          .delete()
          .eq("id", resource.id);

        if (deleteError) {
          throw deleteError;
        }

        setSuccess(
          "تم حذف المصدر بنجاح."
        );

        await loadResources();
      } else {
        /*
         * Sub Admin:
         * create delete request.
         */
        const payload: ResourcePayload = {
          title: resource.title,
          description: resource.description,
          category: resource.category,
          icon: resource.icon,
        };

        const {
          error: requestError,
        } = await supabase
          .from("admin_action_requests")
          .insert({
            admin_id: userData.user.id,
            section: "resources",
            action: "delete",
            target_id: String(resource.id),
            payload,
            reason: `طلب حذف المصدر: ${resource.title}`,
            status: "pending",
          });

        if (requestError) {
          throw requestError;
        }

        setSuccess(
          "تم إرسال طلب حذف المصدر إلى Root Admin للمراجعة."
        );
      }
    } catch (err) {
      console.error(
        "Delete resource error:",
        err
      );

      setError(
        isRootAdmin
          ? "تعذر حذف المصدر. حاول مرة أخرى."
          : "تعذر إرسال طلب حذف المصدر. حاول مرة أخرى."
      );
    } finally {
      setDeleting(false);
    }
  };

  /*
   * Loading permissions
   */
  if (!profile || permissionsLoading) {
    return (
      <div
        className="admin-page"
        dir="rtl"
      >
        <section className="admin-panel admin-panel--empty">
          <div className="admin-empty-state">
            <Loader2
              size={30}
              className="admin-spin"
            />

            <h2>
              جاري التحقق من الصلاحيات
            </h2>

            <p>
              يتم التحقق من صلاحيات حسابك...
            </p>
          </div>
        </section>
      </div>
    );
  }

  /*
   * Unauthorized
   */
  if (!isAdmin || !canView) {
    return (
      <div
        className="admin-page"
        dir="rtl"
      >
        <section className="admin-panel admin-panel--empty">
          <div className="admin-empty-state">
            <AlertCircle size={30} />

            <h2>غير مصرح لك</h2>

            <p>
              لا تملك صلاحية الوصول إلى إدارة
              المصادر.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      className="admin-page admin-resources-page"
      dir="rtl"
    >
      {/* Header */}
      <section className="admin-page__header">
        <div>
          <span className="admin-page__kicker">
            إدارة المحتوى
          </span>

          <h1>المصادر</h1>

          <p>
            إدارة المصادر والمحتوى التعليمي في
            منصة TNU Hub من مكان واحد.
          </p>
        </div>

        <div className="admin-page__header-actions">
          {canAdd && (
            <button
              type="button"
              className="admin-primary-button"
              onClick={openCreateResource}
            >
              <Plus size={18} />

              <span>
                {isRootAdmin
                  ? "إضافة مصدر"
                  : "طلب إضافة مصدر"}
              </span>
            </button>
          )}

          <button
            type="button"
            className="admin-secondary-button"
            onClick={() =>
              void loadResources()
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

            <span>تحديث</span>
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            className="admin-alert__retry"
            onClick={() => {
              setError("");
              void loadResources();
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Success */}
      {success && (
        <div
          className="admin-alert admin-alert--success"
          role="status"
        >
          <CheckCircle2 size={18} />

          <span>{success}</span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
            className="admin-alert__close"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats */}
      <section className="admin-stats-grid admin-resources-stats">
        <article className="admin-stat-card">
          <div className="admin-stat-card__top">
            <span>المصادر</span>

            <div className="admin-stat-card__icon">
              <BookOpen size={19} />
            </div>
          </div>

          <div className="admin-stat-card__value">
            {loading
              ? "..."
              : resources.length}
          </div>

          <div className="admin-stat-card__bottom">
            <span>
              إجمالي المصادر التعليمية
            </span>
          </div>
        </article>
      </section>

      {/* Resources */}
      <section className="admin-dashboard-grid admin-resources-grid">
        <div className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <span className="admin-panel__kicker">
                المحتوى
              </span>

              <h2>
                قائمة المصادر
              </h2>
            </div>

            <span className="admin-status admin-status--completed">
              {resources.length} مصدر
            </span>
          </div>

          {/* Search */}
          <div className="admin-resources-toolbar">
            <div className="admin-search">
              <Search size={17} />

              <input
                type="search"
                placeholder="ابحث عن مصدر أو تصنيف..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="مسح البحث"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="admin-empty-state">
              <Loader2
                size={28}
                className="admin-spin"
              />

              <h2>
                جاري تحميل المصادر
              </h2>

              <p>
                يتم جلب البيانات من قاعدة
                البيانات.
              </p>
            </div>
          ) : filteredResources.length ===
            0 ? (
            <div className="admin-empty-state">
              <BookOpen size={30} />

              <h2>
                {search
                  ? "لا توجد نتائج"
                  : "لا توجد مصادر"}
              </h2>

              <p>
                {search
                  ? "جرّب البحث باستخدام كلمات مختلفة."
                  : "ابدأ بإضافة أول مصدر تعليمي إلى المنصة."}
              </p>

              {!search && canAdd && (
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={
                    openCreateResource
                  }
                >
                  <Plus size={17} />

                  {isRootAdmin
                    ? "إضافة مصدر"
                    : "طلب إضافة مصدر"}
                </button>
              )}
            </div>
          ) : (
            <div className="admin-resources-list">
              {filteredResources.map(
                (resource) => (
                  <article
                    key={resource.id}
                    className="admin-resource-item"
                  >
                    <div className="admin-resource-item__icon">
                      {resource.icon ? (
                        resource.icon
                      ) : (
                        <BookOpen size={19} />
                      )}
                    </div>

                    <div className="admin-resource-item__content">
                      <strong>
                        {resource.title}
                      </strong>

                      <span>
                        {resource.description ||
                          "لا يوجد وصف للمصدر."}
                      </span>

                      <small>
                        {resource.category}
                        {" • "}
                        ID: {resource.id}
                      </small>
                    </div>

                    <div className="admin-resource-item__actions">
                      {canEdit && (
                        <button
                          type="button"
                          className="admin-icon-button"
                          title={
                            isRootAdmin
                              ? "تعديل المصدر"
                              : "طلب تعديل المصدر"
                          }
                          onClick={() =>
                            openEditResource(
                              resource
                            )
                          }
                        >
                          <Edit3 size={16} />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          className="admin-icon-button admin-icon-button--danger"
                          title={
                            isRootAdmin
                              ? "حذف المصدر"
                              : "طلب حذف المصدر"
                          }
                          onClick={() =>
                            void deleteResource(
                              resource
                            )
                          }
                          disabled={deleting}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {modalMode !== "none" && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal__header">
              <div>
                <span className="admin-panel__kicker">
                  إدارة المصادر
                </span>

                <h2>
                  {modalMode === "create"
                    ? isRootAdmin
                      ? "إضافة مصدر جديد"
                      : "طلب إضافة مصدر جديد"
                    : isRootAdmin
                    ? "تعديل بيانات المصدر"
                    : "طلب تعديل بيانات المصدر"}
                </h2>
              </div>

              <button
                type="button"
                className="admin-modal__close"
                onClick={closeModal}
                disabled={saving}
                aria-label="إغلاق"
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="admin-form"
              onSubmit={
                modalMode === "create"
                  ? createResource
                  : updateResource
              }
            >
              <label className="admin-form__field">
                <span>
                  اسم المصدر
                </span>

                <input
                  type="text"
                  value={
                    resourceForm.title
                  }
                  onChange={(event) =>
                    setResourceForm(
                      (current) => ({
                        ...current,
                        title:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="مثال: مكتبة الجامعة"
                  required
                />
              </label>

              <label className="admin-form__field">
                <span>
                  التصنيف
                </span>

                <input
                  type="text"
                  value={
                    resourceForm.category
                  }
                  onChange={(event) =>
                    setResourceForm(
                      (current) => ({
                        ...current,
                        category:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="مثال: أكاديمي"
                  required
                />
              </label>

              <label className="admin-form__field">
                <span>
                  الوصف
                </span>

                <textarea
                  value={
                    resourceForm.description
                  }
                  onChange={(event) =>
                    setResourceForm(
                      (current) => ({
                        ...current,
                        description:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="اكتب وصفًا مختصرًا للمصدر..."
                  rows={4}
                />
              </label>

              <label className="admin-form__field">
                <span>
                  الأيقونة
                </span>

                <input
                  type="text"
                  value={
                    resourceForm.icon
                  }
                  onChange={(event) =>
                    setResourceForm(
                      (current) => ({
                        ...current,
                        icon:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="مثال: 📚"
                />

                <small>
                  يمكنك وضع Emoji أو حرف
                  قصير ليظهر بجانب المصدر.
                </small>
              </label>

              {!isRootAdmin && (
                <div className="admin-form__notice">
                  <AlertCircle size={17} />

                  <span>
                    {modalMode === "create"
                      ? "سيتم إرسال طلب الإضافة إلى Root Admin للمراجعة قبل نشر المصدر."
                      : "سيتم إرسال طلب التعديل إلى Root Admin للمراجعة قبل تطبيق التغييرات."}
                  </span>
                </div>
              )}

              <div className="admin-modal__actions">
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="admin-spin"
                    />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}

                  {saving
                    ? "جاري الحفظ..."
                    : modalMode === "create"
                    ? isRootAdmin
                      ? "إضافة المصدر"
                      : "إرسال طلب الإضافة"
                    : isRootAdmin
                    ? "حفظ التعديلات"
                    : "إرسال طلب التعديل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}