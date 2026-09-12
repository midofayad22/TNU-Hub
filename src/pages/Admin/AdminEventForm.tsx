import {
  ArrowRight,
  CalendarDays,
  Clock3,
  LoaderCircle,
  MapPin,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

interface EventTarget {
  faculty?: string;
  program?: string;
  academicYear?: string;
}

type EventStatus = "قادمة" | "منتهية" | "مسودة";

type AdminRole = "root_admin" | "admin";

interface AdminPermission {
  id: number;
  admin_id: string;
  section: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export default function AdminEventForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditMode = Boolean(id);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("ورشة عمل");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("جميع الطلاب");
  const [status, setStatus] =
    useState<EventStatus>("قادمة");

  const [role, setRole] =
    useState<AdminRole | null>(null);

  const [canView, setCanView] = useState(false);
  const [canAdd, setCanAdd] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pageTitle = useMemo(
    () =>
      isEditMode
        ? "تعديل الفعالية"
        : "إضافة فعالية جديدة",
    [isEditMode]
  );

  const getTargetObject = (
    selectedTarget: string
  ): EventTarget => {
    if (selectedTarget === "هندسة الحاسبات") {
      return {
        faculty: "هندسة الحاسبات",
      };
    }

    if (selectedTarget === "الفرقة الأولى") {
      return {
        academicYear: "الفرقة الأولى",
      };
    }

    return {};
  };

  const getTargetValue = (
    eventTarget: EventTarget | null | undefined
  ) => {
    if (!eventTarget) {
      return "جميع الطلاب";
    }

    if (eventTarget.faculty) {
      return eventTarget.faculty;
    }

    if (eventTarget.program) {
      return eventTarget.program;
    }

    if (eventTarget.academicYear) {
      return eventTarget.academicYear;
    }

    return "جميع الطلاب";
  };

  /*
   * =====================================================
   * تحميل بيانات المستخدم + الصلاحيات + الفعالية
   * =====================================================
   */
  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        setError("");

        setCanView(false);
        setCanAdd(false);
        setCanEdit(false);

        /*
         * الحصول على المستخدم الحالي
         */
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setError(
            "يجب تسجيل الدخول بحساب إداري لإتمام العملية."
          );
          return;
        }

        /*
         * الحصول على Role من profiles
         */
        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (
          profile?.role !== "admin" &&
          profile?.role !== "root_admin"
        ) {
          setError(
            "ليس لديك صلاحية للوصول إلى هذه الصفحة."
          );
          return;
        }

        const currentRole =
          profile.role as AdminRole;

        setRole(currentRole);

        /*
         * =====================================================
         * ROOT ADMIN
         * =====================================================
         *
         * Root Admin لا يحتاج إلى وجود permission row.
         * كل الصلاحيات متاحة له مباشرة.
         */
        if (currentRole === "root_admin") {
          setCanView(true);
          setCanAdd(true);
          setCanEdit(true);
        } else {
          /*
           * =====================================================
           * SUB ADMIN
           * =====================================================
           *
           * تحميل صلاحيات Events الخاصة بهذا الـAdmin.
           */
          const {
            data: permission,
            error: permissionError,
          } = await supabase
            .from("admin_permissions")
            .select(
              "id, admin_id, section, can_view, can_add, can_edit, can_delete"
            )
            .eq("admin_id", user.id)
            .eq("section", "events")
            .maybeSingle();

          if (permissionError) {
            throw permissionError;
          }

          const adminPermission =
            permission as AdminPermission | null;

          const hasView =
            adminPermission?.can_view === true;

          const hasAdd =
            adminPermission?.can_add === true;

          const hasEdit =
            adminPermission?.can_edit === true;

          setCanView(hasView);
          setCanAdd(hasAdd);
          setCanEdit(hasEdit);

          /*
           * لا نسمح للـSub Admin بفتح الفورم
           * إذا لم يكن لديه View.
           */
          if (!hasView) {
            setError(
              "ليس لديك صلاحية عرض قسم الفعاليات."
            );
            return;
          }

          /*
           * إذا كانت الصفحة إضافة جديدة،
           * فلا بد من can_add.
           */
          if (!isEditMode && !hasAdd) {
            setError(
              "ليس لديك صلاحية إضافة فعاليات."
            );
            return;
          }

          /*
           * إذا كانت الصفحة تعديل،
           * فلا بد من can_edit.
           */
          if (isEditMode && !hasEdit) {
            setError(
              "ليس لديك صلاحية تعديل الفعاليات."
            );
            return;
          }
        }

        /*
         * لو إضافة جديدة، لا نحتاج تحميل فعالية.
         */
        if (!isEditMode || !id) {
          return;
        }

        /*
         * =====================================================
         * تحميل الفعالية في حالة التعديل
         * =====================================================
         */
        const {
          data,
          error: fetchError,
        } = await supabase
          .from("events")
          .select(
            `
              id,
              title,
              category,
              description,
              date,
              time,
              location,
              capacity,
              target,
              status
            `
          )
          .eq("id", id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          throw new Error("Event not found");
        }

        setTitle(data.title ?? "");
        setCategory(data.category ?? "ورشة عمل");
        setDate(data.date ?? "");
        setTime(data.time?.slice(0, 5) ?? "");
        setLocation(data.location ?? "");

        setCapacity(
          data.capacity !== null &&
          data.capacity !== undefined
            ? String(data.capacity)
            : ""
        );

        setDescription(data.description ?? "");

        setStatus(
          (data.status as EventStatus) ?? "قادمة"
        );

        setTarget(
          getTargetValue(
            data.target as EventTarget | null
          )
        );
      } catch (err) {
        console.error(
          "Error loading admin event form:",
          err
        );

        setError(
          "تعذر تحميل بيانات الصفحة. حاول مرة أخرى."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadPage();
  }, [id, isEditMode]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");

    /*
     * =====================================================
     * Permission Guard
     * =====================================================
     *
     * Root Admin يستطيع التنفيذ دائمًا.
     *
     * Sub Admin:
     * - Add يحتاج can_add
     * - Edit يحتاج can_edit
     */
    if (role === "admin") {
      if (!canView) {
        setError(
          "ليس لديك صلاحية الوصول إلى قسم الفعاليات."
        );
        return;
      }

      if (!isEditMode && !canAdd) {
        setError(
          "ليس لديك صلاحية إضافة فعاليات."
        );
        return;
      }

      if (isEditMode && !canEdit) {
        setError(
          "ليس لديك صلاحية تعديل الفعاليات."
        );
        return;
      }
    }

    if (!role) {
      setError(
        "تعذر تحديد صلاحيات الحساب الإداري."
      );
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedLocation = location.trim();
    const trimmedDescription = description.trim();

    /*
     * =====================================================
     * Validation
     * =====================================================
     */
    if (!trimmedTitle) {
      setError("من فضلك اكتب اسم الفعالية.");
      return;
    }

    if (!date) {
      setError("من فضلك اختر تاريخ الفعالية.");
      return;
    }

    if (!time) {
      setError("من فضلك اختر وقت الفعالية.");
      return;
    }

    if (!trimmedLocation) {
      setError("من فضلك اكتب مكان الفعالية.");
      return;
    }

    if (!trimmedDescription) {
      setError("من فضلك اكتب وصف الفعالية.");
      return;
    }

    const numericCapacity =
      capacity.trim() === ""
        ? null
        : Number(capacity);

    if (
      numericCapacity !== null &&
      (!Number.isInteger(numericCapacity) ||
        numericCapacity <= 0)
    ) {
      setError(
        "عدد المقاعد يجب أن يكون رقمًا صحيحًا أكبر من صفر."
      );
      return;
    }

    try {
      setSaving(true);

      /*
       * =====================================================
       * الحصول على المستخدم الحالي
       * =====================================================
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError(
          "يجب تسجيل الدخول بحساب إداري لإتمام العملية."
        );
        return;
      }

      /*
       * =====================================================
       * بيانات الفعالية
       * =====================================================
       *
       * Root Admin:
       *   مباشرة مع events
       *
       * Sub Admin:
       *   داخل payload في admin_action_requests
       */
      const eventData = {
        title: trimmedTitle,
        category,
        description: trimmedDescription,
        date,
        time,
        location: trimmedLocation,
        capacity: numericCapacity,
        target: getTargetObject(target),
        status,
      };

      /*
       * =====================================================
       * ROOT ADMIN
       * =====================================================
       *
       * Root Admin يستطيع التنفيذ مباشرة.
       */
      if (role === "root_admin") {
        if (isEditMode && id) {
          const {
            error: updateError,
          } = await supabase
            .from("events")
            .update({
              ...eventData,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);

          if (updateError) {
            throw updateError;
          }
        } else {
          const {
            error: insertError,
          } = await supabase
            .from("events")
            .insert({
              ...eventData,
              created_by: user.id,
            });

          if (insertError) {
            throw insertError;
          }
        }

        navigate("/admin/events");
        return;
      }

      /*
       * =====================================================
       * SUB ADMIN
       * =====================================================
       *
       * Sub Admin لا يقوم بتعديل events مباشرة.
       *
       * بدلًا من ذلك ننشئ Action Request
       * ينتظر موافقة Root Admin.
       */
      const action = isEditMode
        ? "edit"
        : "add";

      const { error: requestError } =
        await supabase
          .from("admin_action_requests")
          .insert({
            admin_id: user.id,
            section: "events",
            action,
            target_id:
              isEditMode && id ? id : null,
            payload: eventData,
            reason: isEditMode
              ? "طلب تعديل فعالية من Sub Admin"
              : "طلب إضافة فعالية من Sub Admin",
            status: "pending",
          });

      if (requestError) {
        throw requestError;
      }

      /*
       * =====================================================
       * إشعار Root Admin
       * =====================================================
       *
       * بعد نجاح إنشاء الطلب، نبحث عن كل Root Admin
       * ونرسل لهم إشعارًا بوجود طلب موافقة جديد.
       *
       * فشل الإشعار لا يلغي إنشاء الطلب.
       */
      const {
        data: rootAdmins,
        error: rootAdminsError,
      } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "root_admin");

      if (rootAdminsError) {
        console.error(
          "Failed to load root admins for event notification:",
          rootAdminsError
        );
      } else if (
        rootAdmins &&
        rootAdmins.length > 0
      ) {
        const actionLabel =
          action === "add"
            ? "إضافة"
            : "تعديل";

        const notifications =
          rootAdmins.map((rootAdmin) => ({
            user_id: rootAdmin.id,
            title: "طلب موافقة جديد",
            message: `قام أحد المشرفين بإرسال طلب ${actionLabel} في قسم الفعاليات للفعالية "${trimmedTitle}" للمراجعة.`,
            type: "approval",
            is_read: false,
          }));

        const {
          error: notificationsError,
        } = await supabase
          .from("notifications")
          .insert(notifications);

        if (notificationsError) {
          console.error(
            "Failed to notify root admins about event request:",
            notificationsError
          );
        }
      }

      /*
       * الطلب تم إرساله بنجاح.
       */
      alert(
        isEditMode
          ? "تم إرسال طلب تعديل الفعالية إلى Root Admin للمراجعة."
          : "تم إرسال طلب إضافة الفعالية إلى Root Admin للمراجعة."
      );

      navigate("/admin/events");
    } catch (err) {
      console.error(
        "Error saving event:",
        err
      );

      /*
       * رسائل أخطاء أوضح للـSub Admin
       */
      if (
        role === "admin" &&
        err &&
        typeof err === "object" &&
        "message" in err
      ) {
        const message = String(
          (err as { message?: unknown })
            .message ?? ""
        );

        if (
          message
            .toLowerCase()
            .includes("permission") ||
          message
            .toLowerCase()
            .includes("policy") ||
          message
            .toLowerCase()
            .includes("row-level")
        ) {
          setError(
            "لا تملك صلاحية إرسال هذا الطلب."
          );
          return;
        }
      }

      setError(
        isEditMode
          ? role === "admin"
            ? "تعذر إرسال طلب تعديل الفعالية. حاول مرة أخرى."
            : "تعذر حفظ تعديلات الفعالية. حاول مرة أخرى."
          : role === "admin"
          ? "تعذر إرسال طلب إضافة الفعالية. حاول مرة أخرى."
          : "تعذر إضافة الفعالية. حاول مرة أخرى."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * =====================================================
   * Loading State
   * =====================================================
   */
  if (loading) {
    return (
      <div
        className="admin-page"
        dir="rtl"
      >
        <div className="admin-empty-state">
          <div className="admin-empty-state__icon">
            <LoaderCircle
              size={25}
              className="admin-spin"
            />
          </div>

          <h3>جاري تحميل الصفحة</h3>

          <p>
            يتم الآن تجهيز بيانات الفعالية
            والصلاحيات.
          </p>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * Unauthorized / No Role
   * =====================================================
   */
  if (!role || !canView) {
    return (
      <div
        className="admin-page"
        dir="rtl"
      >
        <div className="admin-empty-state">
          <div className="admin-empty-state__icon">
            <ShieldCheck size={25} />
          </div>

          <h3>غير مصرح لك</h3>

          <p>
            {error ||
              "ليس لديك صلاحية للوصول إلى هذه الصفحة."}
          </p>

          <Link
            to="/admin/events"
            className="admin-primary-button"
          >
            العودة للفعاليات
          </Link>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * Permission Guard Before Rendering Form
   * =====================================================
   */
  if (
    role === "admin" &&
    ((!isEditMode && !canAdd) ||
      (isEditMode && !canEdit))
  ) {
    return (
      <div
        className="admin-page"
        dir="rtl"
      >
        <div className="admin-empty-state">
          <div className="admin-empty-state__icon">
            <ShieldCheck size={25} />
          </div>

          <h3>غير مصرح لك بتنفيذ العملية</h3>

          <p>
            {isEditMode
              ? "ليس لديك صلاحية تعديل الفعاليات."
              : "ليس لديك صلاحية إضافة فعاليات."}
          </p>

          <Link
            to="/admin/events"
            className="admin-primary-button"
          >
            العودة للفعاليات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="admin-page"
      dir="rtl"
    >
      {/* Header */}
      <header className="admin-page__header">
        <div>
          <Link
            to="/admin/events"
            className="back-link"
          >
            <ArrowRight size={17} />
            <span>العودة للفعاليات</span>
          </Link>

          <span className="admin-page__kicker">
            إدارة المحتوى
          </span>

          <h1>{pageTitle}</h1>

          <p>
            {isEditMode
              ? role === "admin"
                ? "قم بتعديل بيانات الفعالية ثم أرسل طلب التعديل للمراجعة."
                : "قم بتعديل بيانات الفعالية ثم احفظ التغييرات."
              : role === "admin"
              ? "أدخل بيانات الفعالية ثم أرسل طلب الإضافة إلى Root Admin."
              : "أضف فعالية جديدة ليتم عرضها للطلاب."}
          </p>
        </div>
      </header>

      {/* Sub Admin Notice */}
      {role === "admin" && (
        <div
          className="admin-alert"
          role="status"
        >
          <ShieldCheck size={18} />

          <span>
            سيتم إرسال هذه العملية إلى Root
            Admin للمراجعة والموافقة قبل تطبيقها
            على قاعدة البيانات.
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
        >
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form
        className="admin-form-panel"
        onSubmit={handleSubmit}
      >
        <div className="admin-form-panel__intro">
          <div className="admin-form-panel__icon">
            <CalendarDays size={22} />
          </div>

          <div>
            <h2>بيانات الفعالية</h2>

            <p>
              أدخل المعلومات الأساسية الخاصة
              بالفعالية.
            </p>
          </div>
        </div>

        <div className="admin-form-grid">
          {/* Title */}
          <label className="admin-form-field admin-form-field--full">
            <span>اسم الفعالية</span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="مثال: ورشة تطوير مهارات البرمجة"
              autoComplete="off"
              required
            />
          </label>

          {/* Category */}
          <label className="admin-form-field">
            <span>نوع الفعالية</span>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option value="ورشة عمل">
                ورشة عمل
              </option>

              <option value="مسابقة">
                مسابقة
              </option>

              <option value="اجتماعي">
                اجتماعي
              </option>

              <option value="أكاديمي">
                أكاديمي
              </option>
            </select>
          </label>

          {/* Date */}
          <label className="admin-form-field">
            <span>التاريخ</span>

            <div className="admin-input-with-icon">
              <CalendarDays size={17} />

              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
                required
              />
            </div>
          </label>

          {/* Time */}
          <label className="admin-form-field">
            <span>الوقت</span>

            <div className="admin-input-with-icon">
              <Clock3 size={17} />

              <input
                type="time"
                value={time}
                onChange={(event) =>
                  setTime(event.target.value)
                }
                required
              />
            </div>
          </label>

          {/* Capacity */}
          <label className="admin-form-field">
            <span>عدد المقاعد</span>

            <div className="admin-input-with-icon">
              <Users size={17} />

              <input
                type="number"
                min="1"
                step="1"
                value={capacity}
                onChange={(event) =>
                  setCapacity(event.target.value)
                }
                placeholder="80"
                inputMode="numeric"
              />
            </div>

            <small>
              اتركه فارغًا إذا كانت السعة غير
              محددة.
            </small>
          </label>

          {/* Location */}
          <label className="admin-form-field admin-form-field--full">
            <span>المكان</span>

            <div className="admin-input-with-icon">
              <MapPin size={17} />

              <input
                type="text"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                placeholder="مثال: مبنى هندسة الحاسبات"
                autoComplete="off"
                required
              />
            </div>
          </label>

          {/* Target */}
          <label className="admin-form-field">
            <span>الفئة المستهدفة</span>

            <select
              value={target}
              onChange={(event) =>
                setTarget(event.target.value)
              }
            >
              <option value="جميع الطلاب">
                جميع الطلاب
              </option>

              <option value="هندسة الحاسبات">
                هندسة الحاسبات
              </option>

              <option value="الفرقة الأولى">
                الفرقة الأولى
              </option>
            </select>
          </label>

          {/* Status */}
          <label className="admin-form-field">
            <span>الحالة</span>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as EventStatus
                )
              }
            >
              <option value="قادمة">
                قادمة
              </option>

              <option value="مسودة">
                مسودة
              </option>

              <option value="منتهية">
                منتهية
              </option>
            </select>
          </label>

          {/* Description */}
          <label className="admin-form-field admin-form-field--full">
            <span>وصف الفعالية</span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="اكتب تفاصيل الفعالية هنا..."
              rows={8}
              required
            />
          </label>
        </div>

        {/* Actions */}
        <div className="admin-form-panel__actions">
          <Link
            to="/admin/events"
            className="admin-secondary-button"
          >
            إلغاء
          </Link>

          <button
            type="submit"
            className="admin-primary-button"
            disabled={
              saving ||
              (role === "admin" &&
                ((!isEditMode && !canAdd) ||
                  (isEditMode && !canEdit)))
            }
          >
            {saving ? (
              <LoaderCircle
                size={18}
                className="admin-spin"
              />
            ) : (
              <Save size={18} />
            )}

            <span>
              {saving
                ? role === "admin"
                  ? "جاري إرسال الطلب..."
                  : "جاري الحفظ..."
                : role === "admin"
                ? isEditMode
                  ? "إرسال طلب التعديل"
                  : "إرسال طلب الإضافة"
                : isEditMode
                ? "حفظ التعديلات"
                : "إضافة الفعالية"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}